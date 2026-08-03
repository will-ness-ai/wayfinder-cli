# Prototype: command surface and agent entry point

Prototype for the map ticket [Command surface and agent entry point](https://github.com/will-ness-ai/wayfinder-cli/issues/6).

**Status: round 3 — round-2 reactions applied, awaiting final confirmation.**
Transcript 3 was accepted in round 2 and only received consistency edits.

**Placeholder name.** The binary is written `wayfinder` throughout. The real name is its own
open ticket ([Pick the CLI and binary name](https://github.com/will-ness-ai/wayfinder-cli/issues/9));
this prototype does not pre-empt it.

## Files

- [help-output.md](help-output.md) — bare `wayfinder` (agent quickstart) and
  `wayfinder --help` (full setup page).
- [transcript-1-agent-session.md](transcript-1-agent-session.md) — an agent works a map
  ticket end to end: stub → render → work-mode steps on the configured tracker → skill
  pointers from ticket bodies → discovery.
- [transcript-2-project-setup.md](transcript-2-project-setup.md) — a human sets up a
  project: harness selection, tracker config, extension-skill CRUD in interactive and
  flag form.
- [transcript-3-plugin-install.md](transcript-3-plugin-install.md) — plugin install from
  git, and how a plugin skill surfaces in the list and the stub's command map.

## Decisions

1. **Command form: variant A.** The agent surface is `wayfinder skill <id>` (print one
   rendered skill) and `wayfinder skills` (list everything served).
2. **Sub-tree ids.** Skill ids form a tree: `prototype/logic`, `prototype/ui`,
   `domain-modeling/adr-format`, `domain-modeling/context-format`. Ids are logical — no
   `.md`, no filesystem leak. A render ends with a **children block** (command + firing
   condition per child) **only when the skill actually has sub-files**. Single-file skills
   (wayfinder, grilling, …) have no children block; their cross-skill references stay
   inline pointers at the exact sites where they fire.
3. **Entry point: a single wayfinder stub.** `wayfinder init` writes exactly one stub per
   selected harness — an agent-optimized file: a hardened start line ("Your next action
   MUST be to run `wayfinder skill wayfinder`…") plus a generated command map. No
   render-pipeline talk (tracker/extensions/plugins) in the stub — that is config-audience
   material. No per-skill stubs: originals the human keeps installed are never touched.
4. **Stub refresh: auto-sync.** `ext` and `plugin` mutations rewrite the stub's generated
   command map and say so. `tracker set` never touches the stub. `init` is first-run and
   repair.
5. **Config layout.** `~/.config/wayfinder/config.json` (user), `.wayfinder/config.json`
   (project, committed), `.wayfinder/local.json` (gitignored). Precedence: local >
   project > user.
6. **Output encoding.** List and status commands print TOON by default; `--json` for JSON.
   Skill renders are markdown, and they are the **entire adapted skill — the CLI never
   summarizes content**. `wayfinder skills` carries no config counts; config state lives on
   `tracker show`, `ext list`, `plugin list`.
7. **Dual-mode commands.** Flags for agents and scripts; run a setup command without flags
   in a TTY and it opens an interactive form (inputs, selects, multi-selects). Without a
   TTY, missing flags fail with a usage error that **teaches**: what the flag means, what a
   good value looks like, and an example.
8. **Two audiences, two pages.** Bare `wayfinder` prints the agent quickstart: the two read
   commands and the start line, nothing else. `wayfinder --help` is the full page for
   humans and for agents configuring the CLI.
9. **Harness abstraction.** Install targets are ids: `claude` → `.claude/skills/`,
   `agents` → `.agents/skills/`. `init` offers a multi-select with detected targets
   marked (skills.sh-style); `--harness claude,agents` for scripts. Adding a harness later
   adds an id, not new surface.
10. **Trackers.** Built in: `github | gitlab | jira | linear | local`. `custom` points at
    your own tracker doc: `tracker set custom --doc <path>`.

## Rejected alternatives (kept for the record)

- Variant B (bare `wayfinder <name>`) — namespace collisions; reserved-name rule would leak
  into the extension and plugin specs.
- One stub per served skill — collides with originals the human keeps installed; larger
  footprint.
- `--file <path>` for disclosed files — leaks the filesystem; replaced by sub-tree ids.
- Children blocks on single-file skills — children mean sub-files, not referenced skills.
- Config counts (`extensions=N plugins=N`) in `wayfinder skills` output — config-audience
  data in an agent-audience command.
- A "keep the global default" option in the tracker select — replaced by pre-selecting the
  global default and labelling it.
