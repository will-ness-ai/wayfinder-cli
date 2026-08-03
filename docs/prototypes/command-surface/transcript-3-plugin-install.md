# Transcript 3 — plugin install from git

Scenario: same repo as transcript 2, tracker already `github`. The team wants the
frontend-prototyping loop, which ships only as an example plugin — never in core.
(The plugin system has its own upcoming spec; this transcript fixes only the command
surface it must fit into.)

## 1. Install

```
$ wayfinder plugin add https://github.com/acme/wayfinder-plugin-frontend-prototyping
Cloned wayfinder-plugin-frontend-prototyping @ 4f2c9e1 (pinned)
Plugin provides 1 skill:
  grilling-frontend-prototyping — Converge on a frontend look through rounds of
  prototypes and grilling verdicts.
Enabled for this project (.wayfinder/config.json)
Re-synced stubs: wrote .claude/skills/grilling-frontend-prototyping/SKILL.md
```

The pin (URL + commit SHA) is what lands in config, so a teammate's `wayfinder init` on a
fresh clone reproduces the same plugin content:

```
$ wayfinder plugin list
NAME                                    PINNED   SKILLS  SCOPE
wayfinder-plugin-frontend-prototyping   4f2c9e1  1       project
```

## 2. The plugin skill is served like any other

```
$ wayfinder skills
NAME                           ORIGIN                                       DESCRIPTION
wayfinder                      core                                         Plan a huge chunk of work — more…
grilling                       core                                         Grill the user relentlessly abou…
[... six more core skills ...]
grilling-frontend-prototyping  plugin:wayfinder-plugin-frontend-prototyping Converge on a frontend look thro…

9 skills · tracker: github (project) · 0 extensions · 1 plugin

$ wayfinder skill grilling-frontend-prototyping
# Grilling frontend prototyping

[... rendered plugin skill; tracker prose and pointers rendered with the same pipeline
as core skills ...]
```

## 3. Teammate on a fresh clone

`.wayfinder/config.json` is committed, so a teammate needs exactly one command:

```
$ git clone https://github.com/acme/checkout && cd checkout
$ wayfinder init
Installed plugin wayfinder-plugin-frontend-prototyping @ 4f2c9e1 (from project config)
Wrote 9 stub skills to .claude/skills/
Tracker: github (project)
```

## 4. Remove

```
$ wayfinder plugin remove wayfinder-plugin-frontend-prototyping
Removed plugin (project scope) and its 1 skill
Re-synced stubs: deleted .claude/skills/grilling-frontend-prototyping/SKILL.md
```
