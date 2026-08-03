# Mock help output

Variant A is the primary proposal. Variant B is a deliberately minimal alternative to react
against. `wayfinder` is a placeholder binary name throughout.

## Variant A — namespaced (primary)

```
$ wayfinder --help
wayfinder — serve the wayfinder planning skills to coding agents

Usage
  wayfinder <command> [options]

Agent commands (read-only)
  skill <name>            Print a skill's rendered content
      --file <path>       Print one of the skill's disclosed files instead
                          (e.g. wayfinder skill prototype --file LOGIC.md)
  skills                  List every served skill: core, extensions, plugins

Setup commands (humans)
  init                    Install the entry point: write thin stub skills into the
                          agent harness (.claude/skills/). Idempotent; re-syncs stubs.
  tracker show            Show the effective tracker and where it comes from
  tracker set <name>      Set the tracker for this project (github | gitlab | local)
      --user              Set the global default instead
  ext list                List extension-skill registrations (all scopes)
  ext add <name> [...]    Register an extension skill on a host skill
  ext edit <name> [...]   Change a registration
  ext remove <name>       Remove a registration
      --scope <s>         Scope for ext commands: user | project | local
  plugin add <git-url>    Install a plugin from a git repo (pinned to a commit)
  plugin list             List installed plugins
  plugin remove <name>    Uninstall a plugin

Global options
  --json                  Machine-readable output (read commands)
  --version, -V           Print version
  --help, -h              Print help

Config
  ~/.config/wayfinder/config.json   user scope (global defaults)
  .wayfinder/config.json            project scope (committed; wins over user)
  .wayfinder/local.json             local scope (gitignored)

Start here
  wayfinder init          then have your agent run: wayfinder skill wayfinder
```

Notes on variant A:

- `skill` / `skills` is the whole agent surface. Everything an agent is ever told to run is
  one of those two commands — the pointer wording from the composition research
  ("run `<cli> skill <name>` and follow its output") maps onto it verbatim.
- `skills` (plural, no subcommand) rather than `skills list`: the list is the only thing the
  plural noun does.
- Setup commands mutate config and rewrite the harness stubs as a side effect (see
  react point 4).

## Variant B — bare names (minimal alternative)

```
$ wayfinder --help
wayfinder — serve the wayfinder planning skills to coding agents

Usage
  wayfinder <skill-name>       Print a skill's rendered content
  wayfinder <skill>/<file>     Print a disclosed file (e.g. wayfinder prototype/LOGIC.md)
  wayfinder ls                 List every served skill

  wayfinder init | tracker | ext | plugin    Setup commands (as in variant A)
```

Notes on variant B:

- Shortest possible agent surface: `wayfinder grilling`.
- Cost: skill names share a namespace with command names. A skill (or future extension or
  plugin skill) named `init`, `ext`, `tracker`, `plugin`, or `ls` is shadowed — the CLI
  would need a reserved-name rule that leaks into the extension and plugin specs.
- The pointer wording in every rendered skill would read "run `wayfinder <name>`", which is
  lighter but loses the self-describing `skill` noun.
