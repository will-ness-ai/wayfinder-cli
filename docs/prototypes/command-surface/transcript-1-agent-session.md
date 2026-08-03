# Transcript 1 — an agent works a map ticket

Scenario: repo `acme/checkout`. The tracker is set to `github` in `.wayfinder/config.json`.
`wayfinder init` has already been run, so the single wayfinder stub sits in
`.claude/skills/wayfinder/`. The user types: `/wayfinder work the map, next ticket`.

## 1. The stub fires

The harness loads `.claude/skills/wayfinder/SKILL.md` — the entry point, and the only file
the CLI ever installs into the harness:

```markdown
---
name: wayfinder
description: Plan a huge chunk of work — more than one agent session can hold — as a shared
  map of decision tickets on your issue tracker, and resolve them one at a time until the
  way to the destination is clear.
disable-model-invocation: true
---

This project serves its planning skills through the wayfinder CLI. Content is rendered
per project — tracker prose, extensions, and plugins are composed in at render time — so
always fetch it from the CLI; never act from this stub alone.

**Start here: run `wayfinder skill wayfinder` and follow its output.**

<!-- wayfinder:index:start — generated; re-synced by init/ext/plugin. Do not edit. -->
Served skills — fetch any of them with `wayfinder skill <id>`:

- `wayfinder` — chart and work a map of decision tickets. The starting point.
- `grilling` — stress-test a plan, decision, or idea through a relentless interview.
- `domain-modeling` — pin down terminology; record architectural decisions.
- `grill-with-docs` — a grilling that also maintains the docs as you go.
- `research` — investigate a question against primary sources; capture findings in-repo.
- `prototype` — throwaway prototype to answer a design question (children: logic, ui).
- `to-spec` — turn the current conversation into a spec on the tracker.
- `to-tickets` — break a plan into tracer-bullet tickets with blocking edges.

Full index with children and firing conditions: `wayfinder skills`
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
[...]

## Children

- Run `wayfinder skill grilling` when a session needs the grilling protocol on its own,
  outside this skill's inlined copy.
- Run `wayfinder skill domain-modeling` at session start of any grilling, and whenever a
  term or decision needs recording.
- Run `wayfinder skill research` inside the subagent prompt of every research ticket.
- Run `wayfinder skill prototype` when the claimed ticket is labelled `wayfinder:prototype`.
```

What the render shows:

- The github "Wayfinding operations" block is substituted in from the tracker config — the
  source skill's "a tracker doc should have been provided" paragraph is gone.
- grilling is **inlined once** as a named section; in-body references point at the
  `#the-grilling-protocol` anchor (composition decision, edge 3).
- domain-modeling, research, and prototype are **pointers** (edges 4–6), and the render
  ends with the **children block**: every child's exact command plus its firing condition.

## 3. A pointer fires

The map's next frontier ticket is a grilling ticket. The render says to load
domain-modeling at session start:

```
$ wayfinder skill domain-modeling
# Domain Modeling

[... 74 rendered lines ...]

## Children

- Run `wayfinder skill domain-modeling/context-format` at the moment you crystallise a
  term and need to write it down.
- Run `wayfinder skill domain-modeling/adr-format` at the moment a decision needs an ADR.
```

Intra-skill disclosure survives as sub-tree children: the two format files became the ids
`domain-modeling/context-format` and `domain-modeling/adr-format`, fetched only at the
moment of writing — exactly the branch structure they had upstream.

## 4. A prototype ticket, later in the effort

A different session claims a ticket labelled `wayfinder:prototype`. The wayfinder render's
children block fires:

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

The agent wants to know what else is servable (for example, when a map's Notes section
names a skill). Default output is TOON:

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
context: tracker=github(project) extensions=0 plugins=0
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

An unknown id fails loudly with the index attached, so the "map Notes names a skill the
CLI does not serve" case (composition open question 6) has a defined behaviour:

```
$ wayfinder skill riskiest-assumption
Error: no skill with id "riskiest-assumption" is served.
Run `wayfinder skills` to see the 8 served skills, or register it:
  wayfinder ext add riskiest-assumption --source <path> ...
(exit 1)
```
