// Sequential Reviewer over a lane (sandcastle skill: lanes model).
//
// A run is a lane: this worktree, its branch, and an untracked
// .sandcastle/run.json naming exactly the tickets it works. Nothing here
// queries a shared pool — concurrent lanes in other worktrees never interact.
//
// Per iteration: an implement agent works ONE ticket from the batch on a
// dedicated branch, then a review agent inspects the diff and corrects it on
// that branch; the host folds the reviewed branch onto the lane. The loop ends
// when an iteration lands no commits (dry — the batch is exhausted or fully
// blocked). After dry, a PR agent gates the lane against its base and opens
// the PR; merging stays a human act.
//
// This repo starts with no code: the first ticket creates package.json, so the
// install hook and the gate commands both tolerate their absence.
//
// Usage:
//   .sandcastle/node_modules/.bin/tsx .sandcastle/main.mts          # run the lane
//   .sandcastle/node_modules/.bin/tsx .sandcastle/main.mts --plan   # print the resolved lane and exit
//
// run.json shape (see the sandcastle skill, step 2):
//   {
//     "branch": "sandcastle/<batch-slug>",   // optional; defaults to the checked-out branch
//     "base": "main",                        // optional; defaults to main
//     "tickets": [292, 293]                  // GitHub numbers, or literal {id,title,body} objects
//     "cap": 8,                              // optional; defaults to tickets+1 (dry-stop headroom)
//     "notes": "…"                           // optional; reaches the implement prompt verbatim
//   }

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import * as sandcastle from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

// ---------------------------------------------------------------------------
// The lane's run config
// ---------------------------------------------------------------------------

type LiteralTicket = { id: string; title: string; body: string };
type RunConfig = {
	branch?: string;
	base?: string;
	tickets: Array<number | LiteralTicket>;
	cap?: number;
	notes?: string;
};

function fail(message: string): never {
	console.error(message);
	process.exit(1);
}

let config: RunConfig;
try {
	config = JSON.parse(readFileSync(".sandcastle/run.json", "utf8"));
} catch {
	fail(
		"No readable .sandcastle/run.json — write the lane's run config first (sandcastle skill, step 2).",
	);
}
if (!Array.isArray(config.tickets) || config.tickets.length === 0)
	fail("run.json has no tickets — a lane needs a batch.");

const BASE = config.base ?? "main";
const LANE =
	config.branch ?? execSync("git branch --show-current").toString().trim();
const NOTES = config.notes ?? "none";

// Resolve GitHub numbers to full issues at launch; literal tickets pass
// through. Closed issues drop out with a log line, so a relaunch after a
// partial run self-heals instead of re-working done tickets.
function resolveTickets(): { open: unknown[]; dropped: number[] } {
	const open: unknown[] = [];
	const dropped: number[] = [];
	for (const t of config.tickets) {
		if (typeof t !== "number") {
			open.push(t);
			continue;
		}
		const issue = JSON.parse(
			execSync(
				`gh issue view ${t} --json number,title,state,body,labels,comments`,
				{ maxBuffer: 16 * 1024 * 1024 },
			).toString(),
		);
		if (issue.state !== "OPEN") {
			dropped.push(t);
			continue;
		}
		open.push({
			number: issue.number,
			title: issue.title,
			body: issue.body,
			labels: issue.labels.map((l: { name: string }) => l.name),
			comments: issue.comments.map((c: { body: string }) => c.body),
		});
	}
	return { open, dropped };
}

const { open, dropped } = resolveTickets();
if (dropped.length)
	console.log(`Already closed, dropped from the lane: ${dropped.join(", ")}`);
if (open.length === 0) fail("Every ticket in the lane is already closed.");

const TICKETS = JSON.stringify(open, null, 1);
const CAP = config.cap ?? open.length + 1;

if (process.argv.includes("--plan")) {
	console.log(
		`Lane: ${LANE} (base ${BASE}) — ${open.length} open ticket(s), cap ${CAP}\nNotes: ${NOTES}\n`,
	);
	console.log(TICKETS);
	process.exit(0);
}

// ---------------------------------------------------------------------------
// Sandbox configuration
// ---------------------------------------------------------------------------

// Hooks run inside the sandbox before the agent starts each iteration.
// The install is conditional: until the first ticket lands, this repo has no
// package.json and an unconditional pnpm install would abort the iteration.
// gh auth setup-git lets the agent push branches over https with GH_TOKEN.
const hooks = {
	sandbox: {
		onSandboxReady: [
			{
				command:
					"test -f package.json && pnpm install --store-dir /home/agent/.pnpm-store || echo 'no package.json yet — the foundation ticket creates it'",
				timeoutMs: 600_000,
			},
			{ command: "gh auth setup-git" },
		],
	},
};

// pnpm's symlinked node_modules doesn't survive a copy into the container,
// so instead of copyToWorktree we persist the pnpm store across runs via a
// bind mount and let the hook install from it.
const sandboxProvider = () =>
	docker({
		// Pin the image name — the default derives from the directory name,
		// which breaks when running from a git worktree.
		imageName: "sandcastle:wayfinder-cli",
		mounts: [
			// Global Claude Code skills — /implement, /tdd, /code-review live here.
			{
				hostPath: "~/.claude/skills",
				sandboxPath: "/home/agent/.claude/skills",
				readonly: true,
			},
			// Persistent pnpm store so installs after the first run are fast.
			{
				hostPath: ".sandcastle/pnpm-store",
				sandboxPath: "/home/agent/.pnpm-store",
			},
		],
	});

// ---------------------------------------------------------------------------
// The loop: implement → review → fold, until dry
// ---------------------------------------------------------------------------

let anyCommits = false;

for (let iteration = 1; iteration <= CAP; iteration++) {
	console.log(`\n=== Iteration ${iteration}/${CAP} ===\n`);

	const branch = `sandcastle/sequential-reviewer/${Date.now()}`;

	// One sandbox shared by implementer and reviewer, so both work the same
	// real, named branch across phases.
	const sandbox = await sandcastle.createSandbox({
		branch,
		sandbox: sandboxProvider(),
		hooks,
	});

	let reviewOk = false;
	try {
		// maxIterations 1: each outer pass implements a single ticket on its own
		// branch, then hands it to the reviewer — a higher value would drain the
		// batch onto one branch and defeat the per-ticket review.
		const implement = await sandbox.run({
			name: "implementer",
			maxIterations: 1,
			agent: sandcastle.claudeCode("claude-opus-4-8"),
			promptFile: "./.sandcastle/implement-prompt.md",
			promptArgs: { TICKETS, NOTES },
		});

		if (!implement.commits.length) {
			// Dry: the batch is exhausted (or fully blocked) — nothing to review.
			console.log("Lane is dry — no commits this iteration.");
			break;
		}
		anyCommits = true;

		console.log(`\nImplementation complete on branch: ${branch}`);
		console.log(`Commits: ${implement.commits.length}`);

		await sandbox.run({
			name: "reviewer",
			maxIterations: 1,
			agent: sandcastle.claudeCode("claude-opus-4-8"),
			promptFile: "./.sandcastle/review-prompt.md",
			promptArgs: { BRANCH: branch },
		});

		console.log("\nReview complete.");
		reviewOk = true;
	} finally {
		await sandbox.close();
	}

	// Fold the reviewed branch onto the lane so the next iteration builds on
	// this ticket's code. Local only — shipping stays with the PR phase + human.
	if (reviewOk) {
		console.log(`\nMerging ${branch} into ${LANE}...`);
		execSync(`git merge --no-edit ${branch}`, { stdio: "inherit" });
		try {
			execSync(`git branch -D ${branch}`, { stdio: "ignore" });
		} catch {
			// Branch may be pinned by a preserved (dirty) worktree — leave it.
		}
	}
}

// ---------------------------------------------------------------------------
// The PR phase: gate the lane against its base, open the PR
// ---------------------------------------------------------------------------

if (anyCommits) {
	console.log("\n=== PR phase ===\n");
	const sandbox = await sandcastle.createSandbox({
		branch: `sandcastle/pr/${Date.now()}`,
		sandbox: sandboxProvider(),
		hooks,
	});
	try {
		await sandbox.run({
			name: "pr",
			maxIterations: 1,
			agent: sandcastle.claudeCode("claude-opus-4-8"),
			promptFile: "./.sandcastle/pr-prompt.md",
			promptArgs: { BASE, LANE, TICKETS },
		});
	} finally {
		await sandbox.close();
	}
	// The PR agent may have committed gate fixes and pushed the lane — sync the
	// worktree so local and remote agree.
	try {
		execSync(`git pull --ff-only origin ${LANE}`, { stdio: "inherit" });
	} catch {
		console.log(`Lane diverged from origin/${LANE} — reconcile by hand.`);
	}
} else {
	console.log("\nNothing landed — no PR to open.");
}

console.log("\nAll done.");
// Exit explicitly: lingering handles have left a finished orchestrator
// hanging for hours after its final dry iteration.
process.exit(0);
