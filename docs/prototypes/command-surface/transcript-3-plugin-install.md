# Transcript 3 — plugin install from git

Scenario: same repo as transcript 2, tracker already `github`. The team wants the
frontend-prototyping loop, which ships only as an example plugin — never in core.
(The plugin system has its own upcoming spec; this transcript fixes only the command
surface it must fit into.)

## 1. Install

```
$ wayfinder plugin add https://github.com/acme/wayfinder-plugin-frontend-prototyping
✔ Cloned wayfinder-plugin-frontend-prototyping @ 4f2c9e1 (pinned)
Plugin provides 1 skill:
  grilling-frontend-prototyping — Converge on a frontend look through rounds of
  prototypes and grilling verdicts.
✔ Enabled for this project (.wayfinder/config.json)
✔ Re-synced the stub's command map (+ grilling-frontend-prototyping)
```

Run bare in a TTY, `wayfinder plugin add` opens the same kind of form as `ext add`
(URL input, scope select). The pin (URL + commit SHA) is what lands in config, so a
teammate's `wayfinder init` on a fresh clone reproduces the same plugin content:

```
$ wayfinder plugin list
plugins[1]{name,pinned,skills,scope}:
  wayfinder-plugin-frontend-prototyping,4f2c9e1,1,project
```

## 2. The plugin skill is served like any other

```
$ wayfinder skills
skills[9]{id,origin,children,description}:
  wayfinder,core,,"Plan a huge chunk of work — more than one agent session can hold…"
  [... seven more core rows, as in transcript 1 ...]
  grilling-frontend-prototyping,plugin:wayfinder-plugin-frontend-prototyping,,"Converge on a frontend look through rounds of prototypes and grilling verdicts…"

$ wayfinder skill grilling-frontend-prototyping
# Grilling frontend prototyping

[... rendered plugin skill; tracker prose, children blocks, and pointers rendered with
the same pipeline as core skills ...]
```

There is no per-skill stub for it — the single-stub decision holds. Sessions reach it
through the stub's command map, through `wayfinder skills`, or through a pointer in a
host skill's render.

## 3. Teammate on a fresh clone

`.wayfinder/config.json` is committed, so a teammate needs exactly one command:

```
$ git clone https://github.com/acme/checkout && cd checkout
$ wayfinder init
✔ Installed plugin wayfinder-plugin-frontend-prototyping @ 4f2c9e1 (from project config)
✔ Harnesses: claude (from project config)
✔ Wrote .claude/skills/wayfinder/SKILL.md (command map: 9 skills)
Tracker: github (project)
```

## 4. Remove

```
$ wayfinder plugin remove wayfinder-plugin-frontend-prototyping
✔ Removed plugin (project scope) and its 1 skill
✔ Re-synced the stub's command map (- grilling-frontend-prototyping)
```
