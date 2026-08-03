# Prototype: command surface and agent entry point

Prototype for the map ticket [Command surface and agent entry point](https://github.com/will-ness-ai/wayfinder-cli/issues/6).

**Status: round 5 — round-3 reactions and the relation-field removal applied, awaiting
final confirmation.** Help, transcript 1 (bar one edit), transcript 2 (bar the tracker
model), and transcript 3 were accepted in round 3.

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
10. **Trackers are freeform prose, flat.** The tracker value is one string —
    `github cli`, `jira mcp`, `local`, or anything else. Known values ship full
    operations docs substituted into renders. Any unknown value is custom automatically:
    the render names the tracker as prose and leaves operations to the agent's own tools
    (for example a connected MCP server). `--doc <path>` attaches full operations prose
    to any value, known or not. No platform → surface hierarchy: the real set is sparse
    (each entry needs a doc), and freeform custom values break a matrix anyway; the
    interactive select only groups rows visually.

## Deliberately deferred (fog on the map — not this ticket)

- **Plugin content sync.** Where clones live on disk, how a pin moves forward (a probable
  `plugin update [<name>]` verb), cache invalidation, lockfile semantics, per-scope
  enable — all owned by the plugin-system spec, which follows the extension schema. This
  ticket locks only the surface around it: `plugin add` pins URL + commit SHA into config,
  and a fresh-clone `init` reproduces the exact content from the pin. Adding an `update`
  verb later does not disturb the surface locked here.
- **Core content updates.** Core skills ship inside the CLI package, so updating the CLI
  updates the content. The post-v1 update flow for the forked content is its own fog item
  on the map.
- **The default tracker set.** Which values ship operations docs (`github cli`,
  `github mcp`, `jira mcp`, …) is a later research ticket; the lists in these mocks are
  provisional.

(Stub sync is **not** deferred — it is decision 4: mutations auto-sync the stub's command
map, and `init` is the repair path.)

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
- A platform → surface hierarchy for trackers — a matrix the sparse real set and freeform
  custom values would break; flat freeform strings instead.
- A registered `custom` tracker kind — any unknown value is custom automatically.
- A relation-to-default field (`and`/`instead`) on extension registrations — unnecessary
  complexity. Extensions are always additive: the host's default skill still applies, and
  the extension is offered on top (a frontend prototype ticket runs both the prototype
  skill and a registered frontend-prototyping loop).
