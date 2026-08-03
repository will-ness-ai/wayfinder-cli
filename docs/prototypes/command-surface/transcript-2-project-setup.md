# Transcript 2 — a human sets up a project

Scenario: a developer adopts wayfinder-cli in the repo `acme/checkout`. The CLI is already
installed globally. Their user config already sets a global tracker default of `local`.
Every setup command here has two faces: an interactive form when run without flags in a
TTY, and flags for agents and scripts.

## 1. Init — the entry point, interactively

```
$ wayfinder init
wayfinder init — install the entry point into this project

? Tracker for this project  (global default: local)
  ❯ github
    gitlab
    local
    keep the global default

✔ Tracker: github → .wayfinder/config.json (project scope)
✔ Wrote .claude/skills/wayfinder/SKILL.md  (the single stub — the only file the CLI
  ever installs into the harness)
✔ Created .wayfinder/config.json (project scope)
✔ Added .wayfinder/local.json to .gitignore

Next: have your agent run `wayfinder skill wayfinder`
```

The stub's full content is shown in [transcript 1](transcript-1-agent-session.md): an
introduction pointing at `wayfinder skill wayfinder` as the starting point, plus a
generated command map of every served skill between `wayfinder:index` markers.

`init` is idempotent: re-running it repairs the stub against the current config and
reports a diff instead of failing. It never writes per-skill stubs, so originals the
developer keeps installed (their own to-spec, to-tickets, …) are never touched.

Flag form for scripts: `wayfinder init --tracker github`.

## 2. Tracker config

```
$ wayfinder tracker show
tracker: github
sources[2]{scope,file,value,effective}:
  project,.wayfinder/config.json,github,true
  user,~/.config/wayfinder/config.json,local,false
note: no repo sniffing — the tracker is only ever what config says
```

`tracker set gitlab` would rewrite project config only. It does not touch the stub:
renders are fetched live, so a tracker change needs no stub change.

## 3. Extension-skill CRUD — interactive

The team has a house skill for pre-mortems and wants it offered during charting. Run bare,
`ext add` opens a form. (Fields are illustrative — the registration schema is its own
upcoming decision; this transcript fixes only the surface.)

```
$ wayfinder ext add
wayfinder ext add — register an extension skill

? Name                    › pre-mortem
? Source path             › ./skills/pre-mortem
? Host skill                (select)  ❯ wayfinder
? Offered during            (select)  ❯ charting
? Relation to the default   (select)  ❯ and — alongside it
? Fires when              › charting surfaces a risky, hard-to-reverse decision
? Scope                     (select)  ❯ project (.wayfinder/config.json)

✔ Registered extension "pre-mortem" (project scope)
✔ Re-synced the stub's command map (+ pre-mortem)
Rendered `wayfinder skill wayfinder` now offers pre-mortem at its charting extension point.
```

## 4. The same registration, driven by an agent

```
$ wayfinder ext add pre-mortem \
    --source ./skills/pre-mortem \
    --host wayfinder --during charting \
    --relation and \
    --when "charting surfaces a risky, hard-to-reverse decision" \
    --scope project
✔ Registered extension "pre-mortem" (project scope)
✔ Re-synced the stub's command map (+ pre-mortem)
```

Without a TTY, missing flags never fall back to the form — they fail with usage and
exit 1, so an agent can't hang on a hidden prompt.

```
$ wayfinder ext list
extensions[1]{name,scope,host,during,relation,when}:
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
