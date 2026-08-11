---
title: Ticket skills
nav: Ticket skills
group: Reference
order: 5
description: >-
  Register your team's own harness skills with wayfinder, so the charting agent
  writes each one into every ticket its when sentence covers.

terminal:
  label: register and check
  lines:
    - kind: cmd
      text: wayfinder ticket-skill add pre-mortem --when "the ticket carries deploy or migration risk"
    - kind: ok
      text: Registered ticket skill "pre-mortem" in project config.
    - kind: out
      text: ""
    - kind: cmd
      text: wayfinder ticket-skill list
    - kind: out
      text: "ticketSkills[1]{name,when,scope}:"
    - kind: out
      text: "  pre-mortem,the ticket carries deploy or migration risk,project"
    - kind: out
      text: ""
    - kind: cmd
      text: wayfinder doctor
    - kind: out
      text: "problems[1]{kind,subject,detail}:"
    - kind: out
      text: "  ticket-skill,pre-mortem,\"Ticket skill \\\"pre-mortem\\\" (project scope) resolves to no installed harness skill. Install it in a harness, or remove it with `wayfinder ticket-skill remove pre-mortem`.\""
    - kind: cm
      text: "# exit 1 — the name is registered, but no harness serves it"
---

A **ticket skill** is one of your own harness skills, registered with wayfinder
so the charting agent knows it exists and knows when it applies. Your pre-mortem,
your design loop, your review checklist: register it once, and every map on the
repo can reach for it.

The CLI points at the skill. It never serves it — your harness already does.

## The schema is three fields

| Field | Holds |
|---|---|
| name | The harness skill's name, as the harness knows it |
| when | One sentence: the condition that makes the skill relevant to a ticket |
| scope | Which config file the registration is written to |

There is no source field, no host field, and no readiness field. A skill's
readiness is a property of the ticket, not of the skill, and the CLI has no
distribution mechanism, so it has nothing to record about where the skill came
from.

## Register one

```bash
wayfinder ticket-skill add pre-mortem --when "the ticket carries deploy or migration risk"
wayfinder ticket-skill add pre-mortem --when "…" --scope user
```

`--when` is required. `--scope` takes `local`, `project`, or `user`, and defaults
to `project` — the committed file, so a registration reaches the whole team by
default.

## Write the when sentence as a condition

The sentence is read by the charting agent, once per ticket, to decide whether
that ticket carries the skill. So write the **condition**, not a description of
what the skill does.

| Write this | Not this |
|---|---|
| `the ticket carries deploy or migration risk` | `runs a pre-mortem on the plan` |
| `the ticket decides how a UI looks` | `a frontend design loop` |

It reads well when it completes the phrase *"…when the ticket…"*, because that is
exactly how it renders.

## Where a registration shows up

Every effective registration renders inside `wayfinder skill wayfinder`, in a
**Ticket skills** block at the end of skill planning:

```markdown
### Ticket skills

Assign a registered ticket skill to a ticket by writing a ticket-carried pointer
that names the harness skill — for example "At session start, invoke the
pre-mortem skill and apply it." Each carries the condition that makes it
relevant.

- **pre-mortem** — when the ticket carries deploy or migration risk
- **grill-design** — when the ticket decides how a UI looks
```

The charting agent reads that block and writes the skill into each ticket the
sentence covers, as a line in the ticket body. The session that later claims the
ticket invokes the skill from there, with no lookup of its own.

A repo with nothing registered still gets the block. It says so, and it names the
command that adds one.

Charting sees your registrations in the render itself, so nothing else has to
enumerate them. `ticket-skill list` is the registration surface; `doctor` is the
availability check.

## Change and remove

```bash
wayfinder ticket-skill edit pre-mortem --when "the ticket changes production data"
wayfinder ticket-skill remove pre-mortem
wayfinder ticket-skill remove pre-mortem --scope local
wayfinder ticket-skill list
```

`add` refuses a name already registered in that scope, and `edit` refuses a name
not registered there, so neither one surprises you. `edit` also requires
`--when`: the sentence is the only field there is to change. To move a
registration between scopes, remove it from one and add it to the other.

`remove` does one of two things, and reports which:

- The name is registered **in that scope** — the entry is deleted.
- The name is only **inherited** from a broader scope — a tombstone is written,
  which hides the inherited registration in that scope alone.

A tombstone is how you drop a user-scope skill in one repo that uses it nowhere,
without touching your global config. See [Config](/config/) for how the scopes
resolve.

## Check that the names still resolve

```bash
wayfinder doctor
```

A registration is a name. Nothing guarantees a harness on this machine actually
serves a skill by that name, and a charting agent that writes a dangling name
into a ticket wastes a whole session.

`doctor` looks for each registered name under both the `claude` and the `agents`
target, in project scope and in user scope, and reports every name that resolves
to nothing. It exits 1 on any finding, so it gates a CI job.
