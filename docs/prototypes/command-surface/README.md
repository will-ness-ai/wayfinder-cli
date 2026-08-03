# Prototype: command surface and agent entry point

Prototype for the map ticket [Command surface and agent entry point](https://github.com/will-ness-ai/wayfinder-cli/issues/6).

**Status: round 1 — awaiting reaction.** Nothing here is locked. Every command, flag, path,
and output line is a mock to react to, not a spec.

**Placeholder name.** The binary is written `wayfinder` throughout. The real name is its own
open ticket ([Pick the CLI and binary name](https://github.com/will-ness-ai/wayfinder-cli/issues/9));
this prototype does not pre-empt it.

## Files

- [help-output.md](help-output.md) — mock `wayfinder --help`, plus a minimal alternative
  surface (variant B) to react against.
- [transcript-1-agent-session.md](transcript-1-agent-session.md) — an agent works a map
  ticket end to end: stub fires → rendered skill → CLI pointer → disclosed file → skill list.
- [transcript-2-project-setup.md](transcript-2-project-setup.md) — a human sets up a
  project: `init` (the entry-point stub), tracker config, extension-skill CRUD.
- [transcript-3-plugin-install.md](transcript-3-plugin-install.md) — plugin install from
  git, and how a plugin skill surfaces in the list and the stubs.

## The shape in one paragraph

The CLI has exactly two agent-facing read commands: `wayfinder skill <name>` prints one
rendered skill, and `wayfinder skills` lists everything served. All other commands are
human-facing setup: `init`, `tracker`, `ext`, `plugin`. The entry point is a set of **thin
stub skills** that `wayfinder init` writes into the agent harness (`.claude/skills/` for
Claude Code): each stub carries the real skill's frontmatter description — so model-invoked
discovery keeps working — and a one-line body that tells the agent to run
`wayfinder skill <name>` and follow its output. Rendered content is composed at render time
per the composition decision: some dependencies inline, the rest as pointers of the standard
form "When \<condition\>, run `wayfinder skill <name>` and follow its output."

## React points

1. **Command form.** Variant A: `wayfinder skill <name>` + `wayfinder skills` (matches the
   pointer wording locked in the composition research). Variant B: bare `wayfinder <name>`
   (shortest possible, but skill names collide with command names). See
   [help-output.md](help-output.md).
2. **Disclosed files.** `wayfinder skill prototype --file LOGIC.md` (flag) vs
   `wayfinder skill prototype/LOGIC.md` (sub-path). The composition ticket flagged this as
   open question 3; the transcripts use the flag form.
3. **Entry point.** One stub per served skill (shown; preserves per-skill model-invoked
   discovery) vs a single wayfinder-only stub (smaller footprint, no discovery for the
   other seven).
4. **Stub refresh.** In the mocks, `ext`/`plugin`/`tracker` mutations rewrite the stubs
   automatically and `init` is an idempotent first-run/sync command. Alternative: stubs
   change only on explicit `init`.
5. **Config layout.** `.wayfinder/config.json` (project, committed),
   `.wayfinder/local.json` (gitignored), `~/.config/wayfinder/config.json` (user).
   Precedence shown: local > project > user. Only project-over-user is decided on the map;
   local's position is a guess.
6. **`--json`.** Read commands accept `--json` for machine-readable output. Keep for v1 or
   cut?
7. **Extension CRUD flags are illustrative.** The registration schema has its own upcoming
   grill; the question here is only whether `ext add/list/edit/remove --scope <s>` is the
   right *surface* to hang that schema on.
