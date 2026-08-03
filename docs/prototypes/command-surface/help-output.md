# Mock help output

Round 2 — variant A with the round-1 reactions applied. `wayfinder` is a placeholder
binary name.

```
$ wayfinder --help
wayfinder — serve the wayfinder planning skills to coding agents

Usage
  wayfinder <command> [options]

Agent commands (read-only)
  skill <id>              Print a skill's rendered content (markdown).
                          Ids form a tree: `prototype` is a skill, `prototype/logic` is
                          one of its children. Every render ends with a children block —
                          each child's command and when to fetch it.
  skills                  List every served skill and its children: core, extensions,
                          plugins. TOON output; --json for JSON.

Setup commands (run without flags for an interactive form; drive with flags from agents)
  init                    Install the entry point: write the wayfinder stub skill into
                          the agent harness (.claude/skills/wayfinder/). Idempotent:
                          re-running repairs the stub and reports a diff.
  tracker show            Show the effective tracker and where it comes from
  tracker set [<name>]    Set the tracker for this project (github | gitlab | local)
      --user              Set the global default instead
  ext list                List extension-skill registrations (all scopes)
  ext add [<name>] [...]  Register an extension skill on a host skill
  ext edit [<name>] [...] Change a registration
  ext remove [<name>]     Remove a registration
      --scope <s>         Scope for ext commands: user | project | local
  plugin add [<git-url>]  Install a plugin from a git repo (pinned to a commit)
  plugin list             List installed plugins
  plugin remove [<name>]  Uninstall a plugin

Global options
  --json                  JSON instead of TOON (list and status commands)
  --version, -V           Print version
  --help, -h              Print help

Config (precedence: local > project > user)
  ~/.config/wayfinder/config.json   user scope (global defaults)
  .wayfinder/config.json            project scope (committed)
  .wayfinder/local.json             local scope (gitignored)

Start here
  wayfinder init          then have your agent run: wayfinder skill wayfinder
```

Notes:

- `skill` / `skills` is the whole agent surface. Every pointer inside rendered content is
  one of those two commands — the composition research's pointer wording
  ("run `<cli> skill <name>` and follow its output") maps onto it verbatim.
- Bracketed positionals (`tracker set [<name>]`, `ext add [<name>]`) mark where the
  interactive form takes over when the argument is omitted in a TTY. Without a TTY,
  omitting them fails with usage.
- `ext` and `plugin` mutations re-sync the stub's generated command map as a side effect
  and report it. `tracker set` never touches the stub.
