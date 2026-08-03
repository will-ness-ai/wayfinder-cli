# Transcript 1 — an agent works a map ticket

Scenario: repo `acme/checkout`. The tracker is set to `github` in `.wayfinder/config.json`.
`wayfinder init` has already been run, so the wayfinder stub sits in `.claude/skills/`.

## 1. The user prompts

> /wayfinder work on ticket 15 of map 3

The harness loads the stub `.claude/skills/wayfinder/SKILL.md` — the entry point, and the
only file the CLI ever installs into a harness. It is written for the agent: no config
talk, one legal next move, and the command map of everything else this project serves:

```markdown
---
name: wayfinder
description: Plan a huge chunk of work — more than one agent session can hold — as a shared
  map of decision tickets on your issue tracker, and resolve them one at a time until the
  way to the destination is clear.
disable-model-invocation: true
---

Your next action MUST be to run `wayfinder skill wayfinder` (a Bash call) and follow its
output. Do not act from this stub alone.

<!-- wayfinder:index:start — generated; re-synced by init/ext/plugin. Do not edit. -->
This project also serves — fetch with `wayfinder skill <id>`:

- `grilling` — stress-test a plan, decision, or idea through a relentless interview.
- `domain-modeling` — pin down terminology; record architectural decisions
  (children: context-format, adr-format).
- `grill-with-docs` — a grilling that also maintains the docs as you go.
- `research` — investigate a question against primary sources; capture findings in-repo.
- `prototype` — throwaway prototype to answer a design question (children: logic, ui).
- `to-spec` — turn the current conversation into a spec on the tracker.
- `to-tickets` — break a plan into tracer-bullet tickets with blocking edges.

Full index: `wayfinder skills`
<!-- wayfinder:index:end -->
```

## 2. The agent fetches the render

```
$ wayfinder skill wayfinder
# Wayfinder

A loose idea has arrived — too big for one agent session, and wrapped in fog [...]

## The Map

The map is a single issue on this repo's issue tracker, labelled `wayfinder:map` [...]

### Wayfinding operations (tracker: github)

The **map** is a single issue with **child** issues as tickets.

- **Map**: a single issue labelled `wayfinder:map` [...] `gh issue create --label wayfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue [...]
- **Blocking**: GitHub's native issue dependencies [...]
- **Claim**: `gh issue edit <n> --add-assignee @me` — the session's first write.
- **Resolve**: `gh issue comment <n>`, then `gh issue close <n>`, then append to Decisions-so-far.

## Ticket Types

- **Research** (AFK): [...] For each research ticket, launch a subagent whose prompt
  includes the output of `wayfinder skill research` and the ticket question.
- **Prototype** (HITL): [...] When the ticket is labelled `wayfinder:prototype`, run
  `wayfinder skill prototype` and follow its output.
- **Grilling** (HITL): conversation via the grilling protocol below (see
  [The grilling protocol](#the-grilling-protocol)), one question at a time. The default case.
- **Task** (HITL or AFK): [...]

## The grilling protocol

Interview the human relentlessly about every aspect of this until you reach a shared
understanding. Walk down each branch of the decision tree [...] For each question, provide
your recommended answer.

At session start, run `wayfinder skill domain-modeling` and apply it alongside the grilling
protocol.

## Invocation

Two modes. [...]

### Chart the map
[...]

### Work through the map
[...] 2. Choose the ticket. If the user named one, use it. [...] **Claim it** [...]
```

**The `[...]` elisions are for this mock's readability only.** The real render is the
entire skill as forked and adapted under `content/` — the CLI never summarizes content.
The only differences from source are the render-time ones: the github operations block
substituted in from tracker config, grilling inlined once as a named section with its
in-body references rewritten to the anchor, and cross-skill references rewritten to
`wayfinder skill <id>` pointers at the exact sites where they fire. No children block:
wayfinder ships a single `SKILL.md` — children are for skills with sub-files.

## 3. The agent follows the render: Work through the map

The prompt matches the render's "Work through the map" mode, so the agent follows those
steps using the substituted github operations:

```
$ gh issue view 3                          # load the map (low-res view)
$ gh issue edit 15 --add-assignee @me      # claim the ticket — first write
$ gh issue view 15 --comments
title: How should checkout retries interact with idempotency keys?
labels: wayfinder:grilling
body: Part of #3
  ## Question
  [...] Grill to a decision. At session start, run `wayfinder skill domain-modeling`
  and apply it alongside the grilling protocol.
```

The ticket body already names the skill it needs — and in a CLI world that "skill" is
just a pointer to a Bash call:

```
$ wayfinder skill domain-modeling
# Domain Modeling

[... the full rendered skill ...]

## Children

- Run `wayfinder skill domain-modeling/context-format` at the moment you crystallise a
  term and need to write it down.
- Run `wayfinder skill domain-modeling/adr-format` at the moment a decision needs an ADR.
```

The agent now grills the human one question at a time, and fetches
`domain-modeling/adr-format` only at the moment a decision needs recording — the children
block told it when.

## 4. A prototype ticket, later in the effort

A different session claims a ticket labelled `wayfinder:prototype`. The rendered
wayfinder's ticket-type line points the way:

```
$ wayfinder skill prototype
# Prototype

A prototype is throwaway code that answers a question [...]

## Children

- Run `wayfinder skill prototype/logic` when the question is "does this logic or state
  model feel right?"
- Run `wayfinder skill prototype/ui` when the question is "what should this look like?"

$ wayfinder skill prototype/logic
# Logic prototype

Build a tiny interactive terminal app that pushes the state machine through cases [...]

## Children

- Run `wayfinder skill prototype/ui` if the question turned out to be about looks — you
  are on the wrong branch.
```

## 5. Discovery

When the agent needs the index — for example, a map's Notes section names a skill — the
list is one command. TOON by default, and no config noise (config state lives on the
setup commands):

```
$ wayfinder skills
skills[8]{id,origin,children,description}:
  wayfinder,core,,"Plan a huge chunk of work — more than one agent session can hold…"
  grilling,core,,"Grill the user relentlessly about a plan, decision, or idea…"
  domain-modeling,core,"context-format,adr-format","Build and sharpen a project's domain model…"
  grill-with-docs,core,,"A relentless interview to sharpen a plan or design…"
  research,core,,"Investigate a question against high-trust primary sources…"
  prototype,core,"logic,ui","Build a throwaway prototype to answer a design question…"
  to-spec,core,,"Turn the current conversation into a spec…"
  to-tickets,core,,"Break a plan, spec, or the current conversation into tickets…"
```

```
$ wayfinder skills --json
[
  { "id": "wayfinder", "origin": "core", "children": [], "modelInvocation": false },
  { "id": "prototype", "origin": "core", "children": ["logic", "ui"],
    "modelInvocation": true },
  ...
]
```

An unknown id fails loudly with the way back, so the "map Notes names a skill the CLI
does not serve" case has a defined behaviour:

```
$ wayfinder skill riskiest-assumption
Error: no skill with id "riskiest-assumption" is served.
Run `wayfinder skills` to see the served skills.
(exit 1)
```
