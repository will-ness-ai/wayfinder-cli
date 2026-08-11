---
title: Commands
nav: Commands
group: Reference
order: 2
description: >-
  Every wayfinder command and every flag: the two read commands an agent uses,
  the setup commands a developer runs, the global options, and the exit codes.

terminal:
  label: try it
  lines:
    - kind: cmd
      text: wayfinder skill prototype | tail -4
    - kind: out
      text: "## Disclosed files"
    - kind: out
      text: ""
    - kind: out
      text: "- `wayfinder skill prototype/logic` — when the question is whether a logic or state model feels right"
    - kind: out
      text: "- `wayfinder skill prototype/ui` — when the question is what a UI should look like"
    - kind: out
      text: ""
    - kind: cmd
      text: wayfinder doctor
    - kind: out
      text: "problems: []"
    - kind: out
      text: ""
    - kind: cmd
      text: wayfinder skill nope
    - kind: out
      text: Unknown skill id "nope". Run `wayfinder skills` to see every served id.
---

`wayfinder` has two surfaces. The **agent surface** is two read-only commands.
Everything else is **setup**: a developer runs it once per repo, or an agent
drives it with flags.

## The agent surface

### wayfinder skill &lt;id&gt;

Prints one rendered skill to stdout, as markdown. The output is the whole
adapted skill. The CLI never summarizes content.

```bash
wayfinder skill wayfinder
wayfinder skill prototype/ui
```

A skill id is logical. It carries no `.md` and no directory name. A skill that
holds sub-files exposes them as sub-tree ids, and its render ends with a
**Disclosed files** block: one row per child, each row a command plus the
condition that makes the fetch worth making. A single-file skill has no such
block.

The render composes. A dependency that every path needs is inlined from its own
source file. A dependency that only some paths need becomes a command plus its
firing condition. Frontmatter is stripped, headings are demoted one level, and
no framing prose is added. No source file holds a copy of another.

An unknown id writes an error to stderr and exits 1.

### wayfinder skills

Lists every served id with its description and its children.

```bash
wayfinder skills
wayfinder skills --json
```

| Id | Children | Origin |
|---|---|---|
| `wayfinder` | none | core |
| `grilling` | none | core |
| `domain-modeling` | `domain-modeling/adr-format`, `domain-modeling/context-format` | core |
| `grill-with-docs` | `domain-modeling/adr-format`, `domain-modeling/context-format` | core |
| `research` | none | core |
| `prototype` | `prototype/logic`, `prototype/ui` | core |
| `to-spec` | none | core |
| `to-tickets` | none | core |
| `tracker` | none | tracker |

Nine rows list. Thirteen ids serve: the four sub-tree ids in the Children column
answer `wayfinder skill <id>` as well, and they appear here only as a parent's
child.

`tracker` is not a forked skill. It prints the tracker block alone, so an agent
running `to-spec` or `to-tickets` outside a wayfinder session still reaches the
operations prose.

### wayfinder

Bare `wayfinder` prints the agent quickstart: the start line and the two read
commands, and nothing else. `wayfinder --help` prints the full setup page
instead. Two audiences, two pages.

## Setup commands

### wayfinder init

```bash
wayfinder init
wayfinder init --harness claude,agents --tracker "github cli"
```

Writes exactly one stub skill per selected harness. Install targets are ids:
`claude` writes to `.claude/skills/`, `agents` writes to `.agents/skills/`. Run
it on a terminal with no `--harness` and it offers a multi-select with the
detected targets marked.

The stub is written for the agent. It holds a hardened start line — *"Your next
action MUST be to run `wayfinder skill wayfinder`"* — plus a generated command
map of the served skills. It holds no tracker or registration material, because
that is for the developer.

`init` is idempotent, and it is both the first run and the repair path. A stub
that already matches reports no change; a stub that differs is rewritten and the
line diff is reported. There is one stub per harness, never one per served
skill, so a skill you keep installed yourself is never overwritten.

`--tracker <value>` records the tracker in **project** scope in the same pass. It
stores the value only, and it keeps a doc path an earlier `tracker set --doc`
attached.

### wayfinder tracker

```bash
wayfinder tracker show
wayfinder tracker set "github cli"
wayfinder tracker set "acme tracker" --doc ./docs/trackers/acme.md
wayfinder tracker set "linear mcp" --user
```

`show` reports the effective tracker value, the scope that supplied it, and the
doc path when one is attached. A repo with no tracker set prints `tracker: null`
and exits 0 — an unset tracker is a state, not an error.

`set` writes **project** scope by default and **user** scope under `--user`.
There is no local-scope form of this command; write `.wayfinder/local.json` by
hand for a machine-local override.

The [Trackers](/trackers/) page covers the value set, the doc lookup, and the
three states of the tracker block.

### wayfinder ticket-skill

```bash
wayfinder ticket-skill add pre-mortem --when "a decision is risky and hard to reverse"
wayfinder ticket-skill edit pre-mortem --when "the ticket carries deploy or migration risk"
wayfinder ticket-skill remove pre-mortem --scope project
wayfinder ticket-skill list
```

`add` and `edit` both require `--when`. `add` refuses a name already registered
in that scope, so it never overwrites in silence; `edit` refuses a name not yet
registered there, so it never registers by surprise.

`remove` deletes a registration written in that scope. A name that is only
inherited from a broader scope is hidden with a tombstone instead, so one
command covers both the cleanup and the hide.

`--scope` takes `local`, `project`, or `user`, and defaults to `project`.

The [Ticket skills](/ticket-skills/) page covers the registration schema, the
when sentence, and how a registration reaches a ticket.

### wayfinder doctor

```bash
wayfinder doctor
```

Reports two kinds of problem:

- A registered ticket-skill name that resolves to no installed harness skill.
  `doctor` looks under both the `claude` and the `agents` target, in project
  scope and in user scope.
- An attached tracker doc path that no longer resolves to a file.

A clean run prints `problems: []` and exits 0. Any finding exits 1, so `doctor`
gates a CI job. Neither problem is an error at render time — a missing doc
degrades to the no-doc block — so `doctor` is how you find them.

## Global options

| Option | Effect |
|---|---|
| `--json` | JSON instead of the default TOON, on every list and status command |
| `--version`, `-V` | Print the version |
| `--help`, `-h` | Print the full setup page |

`--help` and `--version` are read before the command word, so they win wherever
they appear in the line.

## Forms and flags

Two setup commands run a terminal form: `wayfinder init` when no `--harness` is
given, and `wayfinder tracker set` when no value is given. Both need a TTY. A
form only fills in the flags and hands them to the same code path the flags take,
so the two routes can never diverge, and a form never writes anything on its own.

Every other command takes flags alone. `ticket-skill add` with no `--when` is a
usage error on a terminal exactly as it is in a pipe.

## Usage errors

A usage error writes to stderr and exits 1. It names the flag, says what the flag
means, and shows one example:

```
ticket-skill needs a when sentence: the condition that makes the skill relevant to a ticket.
--when "<sentence>"  Required. The relevance condition charting reads to assign the skill.

For example:

  wayfinder ticket-skill add pre-mortem --when "the ticket carries deploy or migration risk"
```

## Exit codes

| Code | Meaning |
|---|---|
| 0 | The command did its work. `tracker show` with no tracker set is included. |
| 1 | A usage error, an unknown command or id, or a `doctor` run with findings. |

## Output format

Skill renders are always markdown. Every list and status command — `skills`,
`tracker show`, `ticket-skill list`, `doctor` — prints
[TOON](https://toonformat.dev) by default and JSON under `--json`.
