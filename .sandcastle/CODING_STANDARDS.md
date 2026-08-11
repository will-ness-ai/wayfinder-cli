# Coding Standards

wayfinder-cli is a content-server CLI. It renders planning skills as markdown for coding agents to read, and it never operates an issue tracker. The shipped content lives under `content/` — eight forked skills and the tracker docs. The spec is https://github.com/will-ness-ai/wayfinder-cli/issues/34.

## The build

- TypeScript compiled to JavaScript before publish. No runtime TypeScript loader.
- ESM only. `engines: node >=22`.
- pnpm is the package manager. The sandbox pins `pnpm@10.18.0` through corepack.
- The repo root must expose three scripts, because the review and PR phases gate on them: `pnpm typecheck`, `pnpm lint`, `pnpm test`. All three must be green before any commit after the foundation ticket.

## Style

- TypeScript strict. No `any`, no unsafe casts.
- Comments only for constraints the code cannot express — no narration, no TODOs.
- `CONTEXT.md` at the repo root is the project glossary. Use its terms in code, comments, and rendered prose. Each entry lists the synonyms to avoid; honour them.

## Testing

- **One seam**: the CLI entry point, called with an argv array plus an injected environment naming the home directory, the working directory, the TTY state, and the environment variables. A test drives a real command and asserts stdout, the exit code, and the files written.
- A test never asserts the shape of an internal function. If a behaviour is hard to reach through the entry point, that is a design signal, not a reason for a second seam.
- Renders are asserted against committed snapshots. The exact prose is the deliverable, so a substring assertion under-tests it.
- File-writing commands run against a temporary directory tree supplied by the injected environment.
- New or changed behaviour must be covered.

## Content

- `content/` holds the shipped skills and tracker docs. A source file never holds a copy of another; composition happens at render time.
- Editing agent-facing prose under `content/skills/` means following `/home/agent/.claude/skills/writing-great-skills/SKILL.md`. That skill is a build-time tool and is never shipped content.

## Boundaries

- **This repository is public.** `CLAUDE.md` at the root carries the privacy rule and it binds every commit: no real names, no personal email addresses, no absolute paths from a contributor's machine, and anonymized example data.
- Never commit secrets. `.sandcastle/.env` stays untracked.
- Never push or merge to `main`. Agent work accumulates on the lane branch; the PR phase pushes and opens the PR, and merging is a human act.
