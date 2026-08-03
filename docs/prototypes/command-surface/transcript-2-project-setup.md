# Transcript 2 — a human sets up a project

Scenario: a developer adopts wayfinder-cli in the repo `acme/checkout`. The CLI is already
installed globally. Their user config already sets a global tracker default of `local`.
Every setup command here has two faces: an interactive form when run without flags in a
TTY, and flags for agents and scripts.

## 1. Init — the entry point, interactively

```
$ wayfinder init
wayfinder init — install the entry point into this project

? Install the stub into which harnesses?  (space to toggle, enter to confirm)
  ◉ claude — .claude/skills/   (detected in this repo)
  ◯ agents — .agents/skills/

? Tracker for this project
  ❯ local — markdown files in-repo   (your global default)
    github cli
    github mcp
    gitlab cli
    gitlab mcp
    jira mcp
    linear mcp
    other — type your own (freeform, e.g. "shortcut mcp")

✔ Harnesses: claude
✔ Tracker: github cli → .wayfinder/config.json (project scope)
✔ Wrote .claude/skills/wayfinder/SKILL.md  (the single stub — the only file the CLI
  ever installs into a harness)
✔ Created .wayfinder/config.json (project scope)
✔ Added .wayfinder/local.json to .gitignore

Next: have your agent run `wayfinder skill wayfinder`
```

Harnesses are an abstraction — install targets addressed by id (`claude`, `agents`), with
detection marking what the repo already uses. Adding support for a new harness later adds
an id to this select; the surface does not change. The stub's full content is shown in
[transcript 1](transcript-1-agent-session.md).

`init` is idempotent: re-running it repairs the stubs against the current config and
reports a diff instead of failing. It never writes per-skill stubs, so originals the
developer keeps installed (their own to-spec, to-tickets, …) are never touched.

Flag form for scripts: `wayfinder init --harness claude,agents --tracker "github cli"`.

## 2. Tracker config

The tracker value is **freeform prose** — a flat string like `github cli`, `jira mcp`,
`local`. Known values ship full operations docs that get substituted into renders. (The
default set above is provisional — a later research ticket populates it.) The select
groups rows visually by platform, but the model is flat: no platform → surface hierarchy.

```
$ wayfinder tracker show
tracker: github cli
sources[2]{scope,file,value,effective}:
  project,.wayfinder/config.json,"github cli",true
  user,~/.config/wayfinder/config.json,local,false
note: no repo sniffing — the tracker is only ever what config says
```

Any other value is custom automatically — no registration needed. The render then names
the tracker as prose and leaves the operations to the agent's own tools (for example a
connected MCP server):

```
$ wayfinder tracker set "acme-tracker mcp"
✔ Tracker: acme-tracker mcp → .wayfinder/config.json (project scope)
  No built-in operations doc for this value: renders will name the tracker and leave
  operations to the agent's tools. Attach your own doc with --doc <path> for full
  operations prose.

$ wayfinder tracker set "acme-tracker mcp" --doc ./docs/trackers/acme-tracker.md
✔ Tracker: acme-tracker mcp (doc: ./docs/trackers/acme-tracker.md) → .wayfinder/config.json
```

`--doc` works with any value, known or not — a team can override the built-in `github cli`
prose with its own. `tracker set` rewrites config only. It does not touch the stubs:
renders are fetched live, so a tracker change needs no stub change.

## 3. Extension-skill CRUD — interactive

The team has a house skill for pre-mortems and wants it offered during charting. Run bare,
`ext add` opens a form:

```
$ wayfinder ext add
wayfinder ext add — serve an extension skill and offer it on a host

? Source directory        › ./skills/pre-mortem
  ✔ Found SKILL.md: "pre-mortem" — Surface killer risks before a decision locks in.
? Serve under id          › pre-mortem   (from the source's frontmatter; edit only on collision)
? Host skill                (select)  ❯ wayfinder
? Offered during            (select)  ❯ charting        (the host's phase: charting | working)
? Relation to the default   (select)  ❯ and — offered alongside the default grilling
                                        instead — replaces the default for matching tickets
? Fires when              › charting surfaces a risky, hard-to-reverse decision
    One sentence, written by you. It is rendered into the host skill and tells the
    agent when to fetch this extension — sharp conditions fire reliably, vague ones don't.
? Scope                     (select)  ❯ project (.wayfinder/config.json)

✔ Registered extension "pre-mortem" (project scope)
✔ Re-synced the stub's command map (+ pre-mortem)
Rendered `wayfinder skill wayfinder` now offers pre-mortem at its charting extension point.
```

What the fields mean (the full field set is the extension-schema grill's decision — this
transcript fixes only the surface):

- **Source** — the CLI is a content server; an extension is content it does not ship. The
  source is a directory holding the skill's `SKILL.md`; the CLI serves it rendered through
  the same pipeline as core skills.
- **Id** — derived from the source's frontmatter name; editable only for collisions.
- **Host / offered during** — which served skill offers it, and in which of that host's
  phases.
- **Relation** — each host moment already has a default skill, and the render must tell
  the agent whether that default still applies. `and` renders as "…run
  `wayfinder skill pre-mortem` **alongside** the default grilling" — both happen.
  `instead` renders as "…run `wayfinder skill grilling-frontend-prototyping` **instead
  of** the default prototype flow" — the extension supersedes it, so the agent does not
  run the plain flow and the variant loop as duplicates. Without this field the render
  cannot say which, and the agent must guess.
- **Fires when** — becomes the pointer sentence in the host's render; the registrant
  writes it, because pointer wording is what makes a pointer fire reliably.

## 4. The same registration, driven by an agent

A missing flag never falls back to the form outside a TTY — it fails with a usage error
that teaches:

```
$ wayfinder ext add --source ./skills/pre-mortem --host wayfinder \
    --during charting --relation and --scope project
Error: missing required flag --when
  --when <sentence>  When should the host offer this skill? One sentence, written by
                     you. It is rendered into the host skill and tells the agent when
                     to fetch this extension. Sharp conditions fire reliably; vague
                     ones don't.
  Example:
    --when "charting surfaces a risky, hard-to-reverse decision"
(exit 1)

$ wayfinder ext add --source ./skills/pre-mortem --host wayfinder \
    --during charting --relation and --scope project \
    --when "charting surfaces a risky, hard-to-reverse decision"
✔ Registered extension "pre-mortem" (project scope)
✔ Re-synced the stub's command map (+ pre-mortem)
```

```
$ wayfinder ext list
extensions[1]{id,scope,host,during,relation,when}:
  pre-mortem,project,wayfinder,charting,and,"charting surfaces a risky, hard-to-reverse decision"

$ wayfinder ext remove pre-mortem --scope project
✔ Removed extension "pre-mortem" (project scope)
✔ Re-synced the stub's command map (- pre-mortem)
```

## 5. What the registration changes

After `ext add`, two surfaces update automatically:

- The stub's generated command map gains a `pre-mortem` line, so sessions see it exists.
- The rendered `wayfinder skill wayfinder` output carries a registered-extensions block at
  the matching extension point:

```
### Registered extensions (charting)

- **pre-mortem** — when charting surfaces a risky, hard-to-reverse decision, run
  `wayfinder skill pre-mortem` and follow its output, alongside the default grilling.
```

How the block is injected — and the full field set a registration carries — is the
extension-schema grill's question, not this ticket's.
