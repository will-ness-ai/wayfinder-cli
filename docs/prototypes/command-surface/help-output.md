# Mock help output

Round 3. Two audiences, two pages: bare `wayfinder` is for an agent actively using the
skills; `--help` is for a human (or an agent) configuring the CLI. `wayfinder` is a
placeholder binary name.

## Bare invocation — the agent quickstart

```
$ wayfinder
wayfinder — serves this project's planning skills as rendered content

Using the skills? You need exactly two commands:
  wayfinder skill <id>     Print a skill's rendered content (markdown)
  wayfinder skills         List every served skill and its children

Start here: run `wayfinder skill wayfinder` and follow its output.

Configuring wayfinder? Run `wayfinder --help` for the setup commands.
```

## `--help` — the full setup page

```
$ wayfinder --help
wayfinder — serve the wayfinder planning skills to coding agents

Usage
  wayfinder <command> [options]

Agent commands (read-only)
  skill <id>              Print a skill's rendered content (markdown).
                          Ids form a tree: `prototype` is a skill, `prototype/logic` is
                          one of its children. Renders of skills with children end with
                          a children block — each child's command and when to fetch it.
  skills                  List every served skill and its children: core, extensions,
                          plugins. TOON output; --json for JSON.

Setup commands (run without flags for an interactive form; drive with flags from agents)
  init                    Install the entry point: write the wayfinder stub skill into
                          the selected agent harnesses. Idempotent: re-running repairs
                          the stubs and reports a diff.
      --harness <ids>     Install targets: claude (.claude/skills/), agents
                          (.agents/skills/) — one or both, comma-separated
      --tracker <value>   Skip the tracker question
  tracker show            Show the effective tracker and where it comes from
  tracker set [<value>]   Set this project's tracker — freeform prose, e.g. "github cli",
                          "jira mcp", "local". Known values ship operations docs; any
                          other value renders as-is, operations left to the agent's tools
      --doc <path>        Attach your own tracker doc (operations prose) to any value
      --user              Set the global default instead
  ext list                List extension-skill registrations (all scopes)
  ext add [...]           Serve an extension skill and offer it on a host skill
  ext edit [<id>] [...]   Change a registration
  ext remove [<id>]       Remove a registration
      --scope <s>         Scope for ext commands: user | project | local
  plugin add [<git-url>]  Install a plugin from a git repo (pinned to a commit)
  plugin list             List installed plugins
  plugin remove [<name>]  Uninstall a plugin

Global options
  --json                  JSON instead of TOON (list and status commands)
  --version, -V           Print version
  --help, -h              Print this page

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
- Bracketed positionals (`tracker set [<name>]`, `plugin add [<git-url>]`) mark where the
  interactive form takes over when the argument is omitted in a TTY. Without a TTY,
  missing arguments fail with a usage error that teaches (see transcript 2, section 4).
- `ext` and `plugin` mutations re-sync the stub's generated command map as a side effect
  and report it. `tracker set` never touches the stubs.
