# Transcript 2 — a human sets up a project

Scenario: a developer adopts wayfinder-cli in the repo `acme/checkout`. The CLI is already
installed globally. Their user config already sets a global tracker default of `local`.

## 1. Init — the entry point

```
$ wayfinder init
Wrote 8 stub skills to .claude/skills/:
  wayfinder, grilling, domain-modeling, grill-with-docs, research, prototype,
  to-spec, to-tickets
Created .wayfinder/config.json (project scope)
Added .wayfinder/local.json to .gitignore

Tracker: local (from user scope — no project tracker set)
Next: set this project's tracker with `wayfinder tracker set <github|gitlab|local>`
```

`init` is idempotent: re-running it re-syncs the stubs against the current config and
reports a diff instead of failing.

Each stub is a thin pointer whose frontmatter is copied from the served skill, so
model-invoked discovery still works in the harness. `.claude/skills/grilling/SKILL.md`:

```markdown
---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user
  wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Run `wayfinder skill grilling` and follow its output. The output is the full skill,
rendered for this project's configuration — do not act from this stub alone.
```

## 2. Tracker config

```
$ wayfinder tracker set github
Tracker for this project: github
  written to .wayfinder/config.json (project scope — wins over user scope: local)
Re-synced 8 stubs (rendered content changes; stub bodies unchanged)

$ wayfinder tracker show
Effective tracker: github
  project  .wayfinder/config.json            github   ← effective
  user     ~/.config/wayfinder/config.json   local
No repo sniffing: the tracker is only ever what config says.
```

## 3. Extension-skill CRUD

The team has a house skill for pre-mortems and wants it offered during charting.
(The flags below are illustrative — the registration schema is its own upcoming
decision; see react point 7.)

```
$ wayfinder ext add pre-mortem \
    --source ./skills/pre-mortem \
    --host wayfinder --ticket-type grilling \
    --when "charting surfaces a risky, hard-to-reverse decision" \
    --relation and --hitl --mode in-session --phase charting \
    --scope project
Registered extension "pre-mortem" (project scope)
  host: wayfinder · offered: and (alongside the default grilling)
Re-synced stubs: wrote .claude/skills/pre-mortem/SKILL.md
Rendered wayfinder now offers pre-mortem at its charting extension point.

$ wayfinder ext list
NAME        SCOPE    HOST       WHEN                                          RELATION
pre-mortem  project  wayfinder  charting surfaces a risky, hard-to-reverse…   and

$ wayfinder ext remove pre-mortem --scope project
Removed extension "pre-mortem" (project scope)
Re-synced stubs: deleted .claude/skills/pre-mortem/SKILL.md
```

After `ext add`, the rendered `wayfinder skill wayfinder` output carries a registered-
extensions block at the matching extension point, for example:

```
### Registered extensions (charting)

- **pre-mortem** — when charting surfaces a risky, hard-to-reverse decision, run
  `wayfinder skill pre-mortem` and follow its output, alongside the default grilling.
```

How the block is injected — and whether charting sessions read it from the render or from
`wayfinder skills` — is the extension-schema grill's question, not this ticket's.
