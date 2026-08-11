# wayfinder-cli v1 spec

The destination of the wayfinder map [wayfinder-cli — from skill set to public CLI](https://github.com/will-ness-ai/wayfinder-cli/issues/1). Assembled in [Assemble the v1 spec](https://github.com/will-ness-ai/wayfinder-cli/issues/32). Hand this file to `/to-tickets`.

This file is canonical. It is published to the tracker as [wayfinder-cli v1 spec](https://github.com/will-ness-ai/wayfinder-cli/issues/34), which holds the same text. Edit the file, then update the issue.

**Provenance.** Every implementation decision below comes from a closed ticket on the map. The table gives the ticket that holds the full reasoning. The **Testing Decisions** section is the one part the map did not decide; that section records where it comes from.

| Area | Ticket |
|---|---|
| Forked content and attribution | [Fork and adapt the eight core skills](https://github.com/will-ness-ai/wayfinder-cli/issues/2) |
| Stack | [Choose the stack](https://github.com/will-ness-ai/wayfinder-cli/issues/5) |
| Names | [Survey CLI name availability](https://github.com/will-ness-ai/wayfinder-cli/issues/3), [Pick the CLI and binary name](https://github.com/will-ness-ai/wayfinder-cli/issues/9) |
| Command surface, entry point, config layout | [Command surface and agent entry point](https://github.com/will-ness-ai/wayfinder-cli/issues/6) |
| Render composition | [How to combine skills without duplication](https://github.com/will-ness-ai/wayfinder-cli/issues/4), [Decide per-edge composition](https://github.com/will-ness-ai/wayfinder-cli/issues/11) |
| Ticket skills | [Extension-skill registration schema and CRUD design](https://github.com/will-ness-ai/wayfinder-cli/issues/20) |
| Tracker set | [Populate the default tracker set](https://github.com/will-ness-ai/wayfinder-cli/issues/21) |
| Tracker prose substitution | [Design the tracker prose substitution](https://github.com/will-ness-ai/wayfinder-cli/issues/24) |
| Distribution and release | [Distribution mechanics](https://github.com/will-ness-ai/wayfinder-cli/issues/14) |

**Vocabulary.** [CONTEXT.md](../../CONTEXT.md) defines the terms this spec uses: ticket skill, when sentence, skill planning, host, dependency, cross-skill edge, inline at render, CLI pointer, ticket-carried pointer, composition rule, tracker value, tracker doc, tracker block, notice-and-ask block, AFK, HITL.

## Problem Statement

A developer who plans large work with a coding agent wants the wayfinder planning skills in every repo. Today the skills are files that a human copies into each agent harness. This causes four problems.

1. **The copies drift.** Each repo holds its own copy. An upstream improvement reaches no repo without a manual sweep.
2. **The skills reference each other by harness command.** A skill says "run `/grilling`". The reference works only when the reader keeps that other skill installed under that exact name, in that exact harness.
3. **The skills assume one issue tracker.** The forked sources point at a setup skill that writes tracker prose into the repo. A team on Jira, on Linear, or on plain markdown files gets prose for the wrong tracker, or a silent fallback that guesses.
4. **A team cannot add its own planning skills.** A team with a pre-mortem skill or a frontend-prototyping loop has no way to tell the charting agent that the skill exists, or when to attach it to a ticket.

## Solution

`wayfinder-cli` is a content server. It installs once per repo, and it prints planning skills as rendered markdown that an agent reads.

- **One install, one entry point.** `wayfinder init` writes a single stub skill into the agent harness. The stub tells the agent to run `wayfinder skill wayfinder`.
- **Two read commands.** `wayfinder skill <id>` prints one rendered skill. `wayfinder skills` lists everything served. These two commands are the whole agent surface.
- **The render composes.** The CLI holds one source file per skill. At render time it inlines a dependency that every path needs, and it writes a CLI pointer for a dependency that only some paths need. No source file holds a copy of another.
- **The render substitutes tracker prose.** The repo sets a tracker value. The render appends the operations prose for that tracker. An unset tracker gets a block that reports the gap and asks the human.
- **A team registers its own ticket skills.** `wayfinder ticket-skill add <name> --when "..."` records a harness skill and the condition that makes it relevant. The condition renders inside the wayfinder skill, so the charting agent attaches the skill to the tickets where it applies.

The CLI never operates an issue tracker, and it never serves a ticket skill. It prints content, and it points.

## User Stories

### Agents using the skills

1. As a planning agent, I want one stub skill in the harness that names my first command, so that I start a wayfinder session without reading configuration.
2. As a planning agent, I want `wayfinder skill wayfinder` to print the complete wayfinder skill, so that I never plan from a summary.
3. As a planning agent, I want `wayfinder skills` to list every served id, so that I can find content the current render did not carry.
4. As a planning agent, I want the grilling protocol inlined in the wayfinder render, so that I can grill in chart mode before any ticket exists.
5. As a planning agent, I want each pointer in a render to be a command plus the condition that fires it, so that I know what to run and when.
6. As a planning agent, I want disclosed files behind sub-tree ids such as `prototype/logic`, so that I load a long reference file only when I need it.
7. As a planning agent, I want a render of a skill with sub-files to end with a children block, so that I can see every child command in one place.
8. As a planning agent, I want the wayfinder render to end with the operations prose for this repo's tracker, so that I create the map and its tickets with the correct commands.
9. As a planning agent, I want a clear notice when no tracker is configured, so that I ask the human instead of guessing a tracker.
10. As a planning agent, I want the render to name the tracker even when no operations prose exists, so that I use my own tools against the correct system.
11. As a planning agent working `to-spec` or `to-tickets` alone, I want a pointer to `wayfinder skill tracker`, so that I can fetch tracker operations without a wayfinder session.
12. As a planning agent, I want the wayfinder render to list every available ticket skill with its when sentence, so that I attach the relevant skills at ticket creation.
13. As a charting agent, I want to write skill commands into each ticket body, so that the session that claims the ticket loads its own context.
14. As a session that claims a ticket, I want the ticket body to carry its skill commands, so that I need no separate lookup.
15. As a planning agent, I want to mark each ticket AFK or HITL from the work it holds, so that a human sees which tickets an agent can take alone.
16. As an agent driving a setup command, I want to pass every value as a flag, so that I need no terminal form.
17. As an agent that omits a required flag, I want a usage error that explains the flag and shows an example, so that I can correct the call on the next attempt.
18. As an agent reading a list command, I want TOON output by default and `--json` on demand, so that I parse the output cheaply.

### Developers setting up a project

19. As a developer, I want `wayfinder init` to detect my agent harnesses and offer them in a multi-select, so that I install to the right place without knowing the directory layout.
20. As a developer, I want `wayfinder init` to be repeatable, so that re-running it repairs a damaged stub and reports what changed.
21. As a developer, I want `wayfinder tracker set` to accept freeform prose such as `github cli` or `jira mcp`, so that I am not limited to a fixed list.
22. As a developer, I want a shipped operations doc for the common trackers, so that my agent gets correct commands with no writing from me.
23. As a developer on an unusual tracker, I want `--doc <path>` to attach my own operations prose, so that my agent gets correct commands for a system the CLI never heard of.
24. As a developer, I want `--doc` to store the path rather than a copy, so that my whole team reads the same file from the repo.
25. As a developer, I want `wayfinder tracker show` to report the effective tracker and its scope, so that I can see which config file won.
26. As a team lead, I want a project-scope config file in git, so that every contributor and every agent gets the same tracker and the same ticket skills.
27. As a developer, I want a gitignored local-scope config, so that I can override the team settings on my machine without a commit.
28. As a developer, I want a global user-scope config, so that a new repo starts with my usual defaults.
29. As a developer, I want `wayfinder ticket-skill add <name> --when "..."` to register a harness skill, so that the charting agent offers it on the right tickets.
30. As a developer, I want `ticket-skill list` to show every registration with its scope, so that I can see what my agents will be offered.
31. As a developer, I want to hide an inherited registration in one repo, so that a global skill I do not use here stops appearing.
32. As a developer, I want `wayfinder doctor` to check that each registered name resolves to an installed harness skill, so that I find a broken registration before an agent does.
33. As a developer, I want `wayfinder doctor` to report a tracker doc path that does not resolve, so that a moved file does not silently degrade my renders.
34. As a developer, I want bare `wayfinder` to print a short agent quickstart and `wayfinder --help` to print the full setup page, so that each audience reads only its own page.

### Maintainers

35. As a maintainer, I want `npm version` plus a tag push to run the whole release, so that I ship without a manual checklist.
36. As a maintainer, I want CI to be the only publisher, so that no npm token exists on any laptop.
37. As a maintainer, I want the published package to carry provenance, so that a consumer can verify the build.
38. As a maintainer, I want the release workflow to bump the Homebrew tap, so that the tap never lags the npm release.
39. As a maintainer, I want the forked content to carry its upstream commit and its MIT attribution, so that the licence obligation holds.
40. As a maintainer, I want core content to ship inside the package, so that a CLI upgrade upgrades the skills.

## Implementation Decisions

### 1. Names and stack

- Package name: `wayfinder-cli`. Binary name: `wayfinder`.
- Language: TypeScript, compiled to JavaScript before publish. No runtime TypeScript loader.
- Runtime: plain Node. Module system: ESM only. `engines: node >=22`.
- Target registries: npm and Homebrew. crates.io is dropped.

### 2. Content that ships

- Eight skills, forked from [mattpocock/skills](https://github.com/mattpocock/skills) at commit `2ab958093e83e0ec752e6c1c5932da465bf23e0c`, MIT: wayfinder, grilling, domain-modeling, grill-with-docs, research, prototype, to-spec, to-tickets. They live under `content/skills/<name>/`.
- Six tracker docs under `content/trackers/`: `github-cli.md`, `github-mcp.md`, `gitlab-cli.md`, `jira-mcp.md`, `linear-mcp.md`, `local.md`.
- `content/ATTRIBUTION.md` holds the upstream commit, the fork map, the local modifications, and the MIT licence text.
- Core content ships inside the npm package. A CLI upgrade upgrades the content.

### 3. The served set

A **skill id** is logical. It carries no `.md` and no directory name.

| Id | Children |
|---|---|
| `wayfinder` | none |
| `grilling` | none |
| `domain-modeling` | `domain-modeling/adr-format`, `domain-modeling/context-format` |
| `grill-with-docs` | the domain-modeling format ids above |
| `research` | none |
| `prototype` | `prototype/logic`, `prototype/ui` |
| `to-spec` | none |
| `to-tickets` | none |
| `tracker` | none |

`tracker` is not a forked skill. It prints the tracker block alone, and it carries `origin: tracker` in the `wayfinder skills` listing. Every other row carries `origin: core`.

### 4. Command surface

**Agent commands, read only.**

- `wayfinder skill <id>` prints one rendered skill as markdown. The output is the entire adapted skill. The CLI never summarizes content.
- `wayfinder skills` lists every served id with its description and its children.
- Bare `wayfinder` prints the agent quickstart: the two read commands and the start line.

**Setup commands.** Each one runs an interactive form when a TTY is present and no flags are given. Each one accepts flags for agents and scripts.

- `wayfinder init [--harness <ids>] [--tracker <value>]`
- `wayfinder tracker show`
- `wayfinder tracker set [<value>] [--doc <path>] [--user]`
- `wayfinder ticket-skill add <name> --when "<sentence>" [--scope user|project|local]`
- `wayfinder ticket-skill edit <name> [...]`
- `wayfinder ticket-skill remove <name> [--scope ...]`
- `wayfinder ticket-skill list`
- `wayfinder doctor`

**Global options.** `--json`, `--version` / `-V`, `--help` / `-h`. `wayfinder --help` prints the full setup page.

**Output.** List and status commands print TOON by default and JSON under `--json`. Skill renders are always markdown.

**Usage errors.** A missing flag with no TTY fails with an error that teaches: what the flag means, what a good value looks like, and one example.

**Removed groups.** The `ext` group and the `plugin` group do not exist. `ticket-skill` replaces `ext`. Plugins are out of scope (see below). The round-5 prototype mocks still draw both groups; the [prototype README amendments](../prototypes/command-surface/README.md#amendments) record the supersession.

### 5. Config

Three scopes. Precedence: local wins over project, project wins over user.

| Scope | File | Committed |
|---|---|---|
| user | `~/.config/wayfinder/config.json` | no |
| project | `.wayfinder/config.json` | yes |
| local | `.wayfinder/local.json` | no, gitignored |

Two keys.

```json
{
  "tracker": { "value": "github cli", "doc": "./docs/trackers/acme.md" },
  "ticketSkills": {
    "pre-mortem": { "when": "a decision is risky and hard to reverse" }
  }
}
```

- `tracker` resolves **wholesale**. The nearest scope supplies both `value` and `doc` together. Two flat keys were rejected: independent resolution can pair a project value with a user doc and render Jira prose in a GitHub repo.
- `ticketSkills` resolves as a **union of all scopes**, keyed by skill name. One name resolves wholesale, by the same nearest-scope rule. A `null` entry is a tombstone: it hides an inherited registration in that scope.
- `--doc` stores the path. The CLI reads it against the config file that holds it, so a repo-relative path works for the whole team.

### 6. The render pipeline

**The composition rule.** Necessity decides whether the content is needed on every path. Size decides the mechanism.

- Mandatory and small → inline at render.
- Conditional or large → CLI pointer. Hard-worded when the edge is mandatory.

**Composition is raw.** The render strips frontmatter and demotes headings. It adds no framing prose. Source files never hold copies of each other.

**The edge table.**

| Edge | Mechanism |
|---|---|
| grill-with-docs → grilling | inline at render |
| grill-with-docs → domain-modeling | inline at render; the format files stay disclosed behind sub-tree ids |
| wayfinder → grilling | inline once, anchored; chart mode needs it before any ticket exists |
| wayfinder → domain-modeling | hard pointer, retargeted to `wayfinder skill grill-with-docs` |
| wayfinder → research | ticket-carried pointer |
| wayfinder → prototype | ticket-carried pointer |
| wayfinder → the upstream setup skill | deleted at all four sites; the tracker block replaces it |
| wayfinder → skills named in map Notes | freeform prose guidance; no registry check |
| intra-skill files | sub-tree id pointers |

`grill-with-docs` is the canonical decision-conversation id. A ticket body carries one command for a decision conversation, not two. The one id means "load the decision-conversation protocol" everywhere. The cost is roughly seven duplicated grilling lines per fetch, and that cost is accepted.

**Children block.** A render ends with a children block only when the skill has sub-files. Each row is the child's command plus its firing condition. A single-file skill has no children block; its cross-skill references stay inline pointers at the exact sites where they fire.

**Ticket-carried pointers.** A ticket body lists the skill commands for that ticket: "Use bash to run `wayfinder skill <id>` before starting any work on this ticket." A ticket skill is named as a harness skill instead, because the harness serves it.

### 7. Edits to the forked sources

No session has edited `content/skills/` yet. The sources still carry upstream wording that the decisions above overturn. The build must apply these edits.

**wayfinder**

1. Delete every subagent reference. Research tickets are ordinary frontier tickets worked by full sessions. Remove the "fire the research subagents" chart step. Remove the "one ticket per session, except research" exception. The existing "the user may run unblocked tickets in parallel" line already covers parallel work.
2. Replace the **Ticket Types** section with **skill planning**. The four ticket types stay a closed set — grilling, research, prototype, task — and stay orthogonal to the ticket's skill list. The fixed type-to-HITL/AFK mapping becomes one rule line: zero human input marks the ticket AFK (`ready-for-agent`); human oversight needed marks it HITL (`ready-for-human`).
3. Render the skill-planning list from the skill registry. Core entries are built in: `grill-with-docs` is the default decision-conversation entry, plus `research` and `prototype`. A task ticket carries no core skill. Registered ticket skills append after them.
4. Rewrite the map paragraph. It stops saying that a tracker doc was provided, and it anchors down the page to the tracker block. The "if no tracker has been provided, default to the local-markdown tracker" silent fallback goes; the notice-and-ask block replaces it.
5. Inline the grilling body once, anchored at its reference sites. Retarget the domain-modeling references to `wayfinder skill grill-with-docs`.

**to-spec**

6. Drop "and its label vocabulary" from the tracker line. Name the tracker and carry the conditional pointer to `wayfinder skill tracker`.

**to-tickets**

7. The same two edits as `to-spec`.
8. Step 5 keeps its local-files-versus-real-tracker branch as written. The tracker value alone resolves the branch, so it needs no prose.

**All skills**

9. `ready-for-agent` and `ready-for-human` stay literal strings in the skill text. No label mapping file and no label config key exists.

Author every edit above with the skill-writing skill, as the map Notes require. That skill is a build-time tool. It is not shipped content.

### 8. Tracker prose substitution

**One block.** The whole tracker doc appends once, at the bottom of the wayfinder render, under `## Issue tracker: <value>`. The doc's own headings drop one level. Nothing else is added. A shipped doc therefore carries no top-level heading, because the render supplies the title.

The block always renders, in one of three states.

| State | Block |
|---|---|
| No `tracker` key in config | The **notice-and-ask block**: report the gap, offer the local markdown tracker or `wayfinder tracker set`, and do not guess. |
| Value set, no doc found | Name the tracker, state that no operations prose exists, and tell the agent to use its own tools. |
| Value set, doc found | The whole doc. |

**Finding a shipped doc.** Lower-case the tracker value and replace each run of whitespace with `-`. `github cli` finds `github-cli.md`. No aliases and no fuzzy matching. A value with no matching file is a custom value, which is an already-defined state.

**`--doc` replaces the shipped doc.** The two never merge, so exactly one doc reaches the render and it can never hold two conflicting sets of commands. A path that does not resolve degrades to the no-doc block and is reported by `wayfinder doctor`. A missing file is never an error.

**`to-spec` and `to-tickets` do not inline the doc.** Each one names the tracker and carries one conditional pointer: "if you do not know how to operate it, run `wayfinder skill tracker` first". Both skills run standalone, with no map and no wayfinder session to append anything. `wayfinder skill tracker` prints the same block alone, so the two paths can never disagree.

**The missing-label rule.** A tracker refuses a label the project does not have, so a fresh repo fails on the first `to-tickets` run. Each shipped tracker doc carries the rule: ask the human to create the label or to publish without it. The doc never creates a label silently.

**Tracker set contents.** Six values ship: `github cli`, `github mcp`, `gitlab cli`, `jira mcp`, `linear mcp`, `local`. `gitlab mcp` is excluded, because the official GitLab MCP server is Beta and cannot list, update, assign, or close an issue.

**Each doc carries a frontier recipe.** No tracker expresses "open, unblocked, unassigned children of one map" in a single server-side query. Each doc ships the same two-step recipe: narrow server-side, then inspect each candidate's blockers.

`content/trackers/github-cli.md` is the reference doc and is already written. The other five are tracked off the map in [Write the five remaining tracker docs](https://github.com/will-ness-ai/wayfinder-cli/issues/31). This spec depends on that issue, and does not restate it.

### 9. Ticket skills

A **ticket skill** is a harness skill that charting assigns to each ticket where it is relevant. The CLI points at it. The harness serves and invokes it.

**Schema.** Three fields, and no more: skill **name**, a required **when sentence**, and a **scope**. There is no source field, no host field, no during field, no dispatch field, and no HITL/AFK field. The per-ticket HITL/AFK rule covers readiness, and no subagent language exists anywhere in the content.

**Render.** One block, headed **Ticket skills**, appends at the bottom of the skill-planning section of the wayfinder render. It lists each name with its when sentence, and it instructs charting to assign each relevant skill to a ticket by writing a ticket-carried pointer that names the harness skill — for example "At session start, invoke the pre-mortem skill and apply it." Assignment happens at ticket creation. Author the exact prose with the skill-writing skill at implementation time.

**`wayfinder doctor`.** For each registered name, check the harness skill directories — user scope and project scope, `claude` target and `agents` target — and report each name that resolves to no installed skill. `doctor` also reports a tracker doc path that does not resolve.

**Enumeration.** Charting sees ticket skills in the render block itself, so the charting-visibility gap closes by construction. `ticket-skill list` is the registration surface, and `doctor` is the availability check. A skill relevant to one effort alone stays in the map Notes as freeform prose.

### 10. The entry point stub

`wayfinder init` writes exactly one stub skill per selected harness. Install targets are ids: `claude` writes to `.claude/skills/`, `agents` writes to `.agents/skills/`. `init` offers a multi-select with detected targets marked, and takes `--harness claude,agents` for scripts.

The stub is agent-optimized. It holds a hardened start line — "Your next action MUST be to run `wayfinder skill wayfinder`" — plus a generated command map. It holds no render-pipeline talk, because tracker and registration material is config-audience content.

There is one stub per harness, not one per served skill, so a skill the human keeps installed is never overwritten.

The command map lists served skills only. Registration mutations never touch the stub, and `tracker set` never touches it. The served set is therefore fixed for a given CLI version, and `init` is the only writer: first run and repair. `init` is idempotent and reports a diff.

### 11. Distribution and release

- **npm.** Package `wayfinder-cli`, installing the `wayfinder` binary. Publishing is CI only, through GitHub Actions with trusted publishing (OIDC) and `--provenance`. No npm token is stored anywhere. One manual bootstrap publish creates the package, because npm requires the package to exist before trusted publishing can be configured. Every publish after that goes through CI.
- **Homebrew.** A personal tap for v1: `brew install will-ness-ai/tap/wayfinder-cli`. Homebrew core is a post-v1 concern, because core's notability audit fails a brand-new repo. The formula wraps the published npm tarball with `depends_on "node"` and `std_npm_args`, so npm stays the single source of truth and a release changes two formula lines.
- **Releases are tag-driven and on demand.** Run `npm version <bump>` on `main`, then `git push --follow-tags`. CI fires on the `v*` tag: build, publish to npm, create the GitHub Release with generated notes, then bump the tap formula.
- **The tap bump is automatic.** It needs the pipeline's only long-lived credential: a fine-grained token scoped to the tap repo with contents-write. A silently lagging tap is the most likely failure in this design, so the bump is never left to memory.
- **No placeholder publish.** The first real publish claims the name.

## Testing Decisions

The map did not decide testing. [Assemble the v1 spec](https://github.com/will-ness-ai/wayfinder-cli/issues/32) proposed this section, and the `/to-spec` session that published this spec confirmed it with the developer. Build from it as written.

**What makes a good test here.** A test asserts external behavior: the bytes the CLI writes to stdout, the exit code, and the files it writes to disk. A test never asserts the shape of an internal function. The CLI is a pure content transform over two inputs — the shipped content tree and the resolved config — so the observable output is the whole contract.

**The seam.** One seam: the CLI entry point, called with an argv array plus an injected environment. The environment names the home directory, the working directory, the TTY state, and the environment variables. A test drives a real command and reads its output. This is the highest available seam and it covers every module below it, so the CLI has one seam and no other.

The environment variables are part of the seam because `XDG_CONFIG_HOME` moves the user-scope config directory. A test that cannot set it cannot cover that path, and a developer machine that sets it behaves differently from CI.

Two consequences of the single seam:

- Config resolution, render composition, tracker resolution, and stub writing are all exercised through commands, not through direct calls.
- File-writing commands (`init`, `tracker set`, `ticket-skill add`) run against a temporary directory tree supplied by the injected environment.

**What is tested.**

- `skill <id>` for every served id, including each sub-tree id, asserted against a committed snapshot of the rendered markdown. A snapshot is the correct tool here, because the render is long prose and its exact wording is the deliverable.
- The inline edges: the grilling body appears in the `grill-with-docs` render and in the `wayfinder` render.
- The pointer edges: the `wayfinder` render names `wayfinder skill grill-with-docs`, and contains no reference to the upstream setup skill.
- Children blocks: present for `prototype` and `domain-modeling`, absent for every single-file skill.
- The three tracker-block states, each asserted at the bottom of the `wayfinder` render and through `wayfinder skill tracker`.
- Tracker value to filename derivation, including a value that matches no shipped file.
- `--doc` path resolution relative to the config file that holds it, and the degrade-to-no-doc path for a missing file.
- Config precedence: wholesale `tracker` resolution across all three scopes, `ticketSkills` union across all three scopes, and tombstone suppression.
- User-scope config path resolution, with `XDG_CONFIG_HOME` set and unset.
- The **Ticket skills** block renders one row per effective registration.
- `doctor` reports an unresolvable skill name and an unresolvable doc path.
- `init` writes the stub to each selected harness, and a second run repairs and reports a diff.
- Dual mode: a missing flag without a TTY exits non-zero with a message that names the flag and shows an example.
- `--json` output parses, and the default output is TOON.

**Prior art.** None. This repository holds no code yet, so the first test ticket also establishes the harness, the snapshot format, and the temporary-directory fixture.

## Out of Scope

- **Operating an issue tracker.** The CLI is a content server. It prints tracker prose; the agent runs the commands. A CLI that drives GitHub, Linear, or Jira directly would simplify the wayfinder experience greatly, but it is a separate effort and needs its own map.
- **Plugins and a marketplace.** A distributable bundle of ticket skills, and a catalog to publish it in. Ticket skills live in the harness, so a plugin would have to install skill files the CLI does not own. Skill storage comes first, and it needs its own map. The `plugin` command group leaves the surface. See [Plugin system and marketplace spec](https://github.com/will-ness-ai/wayfinder-cli/issues/28).
- **Serving non-core skills.** `grilling-frontend-prototyping` and `writing-great-skills` never ship in the core distribution. The CLI has no distribution mechanism of its own. A human installs such a skill through the harness, then registers it with `ticket-skill add`.
- **Execution-side skills.** `implement` and `triage` stay out of core. They are candidate ticket skills if they are ever wanted.
- **Triage features.** No label vocabulary mapping, no `labels` config key, and no "PRs as a triage surface" section in any tracker doc. All three are residue of the upstream `/triage` skill, which this repository did not fork.
- **The upstream sync routine.** Keeping the forked content current with `mattpocock/skills` is tracked as a regular issue, not on the map.
- **Homebrew core submission.** Post-v1.
- **crates.io.** Dropped as a target registry.
- **Multi-harness support beyond `claude` and `agents`.** Adding a harness later adds an id, not new surface.
- **`gitlab mcp` as a shipped tracker value.** A repo on a community GitLab MCP server uses the freeform-value fallback by design.

## Further Notes

**Open implementation choices.** These are build-time choices, not map decisions. `/to-tickets` may settle each one inside the ticket that needs it.

- The package manager, the bundler, and the test runner.
- The TOON encoder: a dependency or a small local writer.
- The interactive form library.
- Whether the forked `agents/openai.yaml` metadata files ship in the package. They carry no render content, and no decision on the map assigns them a role.
- The description text and firing condition that `wayfinder skills` prints per row.

**Sequencing note for `/to-tickets`.** The content edits in section 7 and the render pipeline in section 6 are coupled: an edit to a source file is only observable through a render. A vertical slice that carries one skill's edits together with the render feature they need will stay demoable; a horizontal split into "edit all sources" and "build the renderer" will not.

**Dependency outside this spec.** Five tracker docs must exist before the six-value set is complete. See [Write the five remaining tracker docs](https://github.com/will-ness-ai/wayfinder-cli/issues/31).

**Accepted risks, recorded during the map.**

- Search-term overlap with the active `wayfinder-cli` Rust crate and with Appvia's commercial "Wayfinder CLI". Both ship a `wf` binary, not `wayfinder`.
- The trademark check was shallow. A live USPTO registration for WAYFINDER exists in game software. No full clearance search was run.
- A `--doc` file carries its unused lines into every session. The cost is small once the fork residue is cut.
- Jira and Linear publish no tool-name contract for their MCP servers, so those docs describe operations by capability rather than by tool name.
