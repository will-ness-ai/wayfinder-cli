# Prototype: command surface and agent entry point

Prototype for the map ticket [Command surface and agent entry point](https://github.com/will-ness-ai/wayfinder-cli/issues/6).

**Status: round 2 — converged on all seven react points, awaiting final confirmation.**
Round 1 proposed; the human reacted; this round bakes the reactions in.

**Placeholder name.** The binary is written `wayfinder` throughout. The real name is its own
open ticket ([Pick the CLI and binary name](https://github.com/will-ness-ai/wayfinder-cli/issues/9));
this prototype does not pre-empt it.

## Files

- [help-output.md](help-output.md) — mock `wayfinder --help`.
- [transcript-1-agent-session.md](transcript-1-agent-session.md) — an agent works a map
  ticket end to end: stub fires → rendered skill → CLI pointer → child skill → skill list.
- [transcript-2-project-setup.md](transcript-2-project-setup.md) — a human sets up a
  project: `init` (writes the single stub), tracker config, extension-skill CRUD in both
  interactive and flag form.
- [transcript-3-plugin-install.md](transcript-3-plugin-install.md) — plugin install from
  git, and how a plugin skill surfaces in the list and the stub's command map.

## Decisions (from the round-1 reaction)

1. **Command form: variant A.** The whole agent surface is `wayfinder skill <id>` (print one
   rendered skill) and `wayfinder skills` (list everything served). Variant B (bare
   `wayfinder <name>`) is rejected: skill names would collide with command names.
2. **Sub-tree ids, not file paths.** Skill ids form a tree: `prototype` has children
   `prototype/logic` and `prototype/ui`; `domain-modeling` has `domain-modeling/adr-format`
   and `domain-modeling/context-format`. Ids are logical — no `.md`, no filesystem leak.
   Every skill render ends with a **children block**: one line per child with the exact
   command and its firing condition. The `--file` flag from round 1 is dropped.
3. **Entry point: a single wayfinder stub.** `wayfinder init` writes exactly one stub,
   `.claude/skills/wayfinder/SKILL.md` — an introduction that points at
   `wayfinder skill wayfinder` as the starting point, plus a generated command map of every
   served skill. No per-skill stubs: the human may keep original skills (to-spec,
   to-tickets, …) installed on their machine for other workflows, and the CLI must not
   collide with them.
4. **Stub refresh: auto-sync.** `ext` and `plugin` mutations rewrite the stub's generated
   command map as a side effect and say so in their output. `tracker set` never touches the
   stub — renders are fetched live, so a tracker change needs no stub change. `init` is
   first-run and repair (idempotent, reports a diff).
5. **Config layout.** `~/.config/wayfinder/config.json` (user), `.wayfinder/config.json`
   (project, committed), `.wayfinder/local.json` (gitignored). Precedence: local > project
   > user.
6. **Output encoding.** List and status commands (`skills`, `tracker show`, `ext list`,
   `plugin list`) print TOON by default; `--json` switches to JSON. Skill renders are
   markdown — the markdown is the product.
7. **Dual-mode commands.** Every setup command is drivable two ways: flags for agents and
   scripts; run it without flags in a TTY and it opens an interactive form (inputs,
   selects, multi-selects — Claude-Code-like). Without a TTY, missing flags fail with
   usage. The exact `ext` field set stays open — the extension-schema grill owns it.

## Rejected alternatives (kept for the record)

- Variant B (bare `wayfinder <name>`) — namespace collisions; reserved-name rule would leak
  into the extension and plugin specs.
- One stub per served skill — collides with originals the human keeps installed; larger
  footprint.
- `--file <path>` for disclosed files — leaks the filesystem; replaced by sub-tree ids.
