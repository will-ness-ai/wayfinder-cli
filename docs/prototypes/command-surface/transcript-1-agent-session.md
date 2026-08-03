# Transcript 1 — an agent works a map ticket

Scenario: repo `acme/checkout`. The tracker is set to `github` in `.wayfinder/config.json`.
`wayfinder init` has already been run, so stub skills sit in `.claude/skills/`. The user
types: `/wayfinder work the map, next ticket`.

## 1. The stub fires

The harness loads `.claude/skills/wayfinder/SKILL.md` — the whole file is:

```markdown
---
name: wayfinder
description: Plan a huge chunk of work — more than one agent session can hold — as a shared
  map of decision tickets on your issue tracker, and resolve them one at a time until the
  way to the destination is clear.
disable-model-invocation: true
---

Run `wayfinder skill wayfinder` and follow its output. The output is the full skill,
rendered for this project's configuration — do not act from this stub alone.
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
```

What the render shows:

- The github "Wayfinding operations" block is substituted in from the tracker config — the
  source skill's "a tracker doc should have been provided" paragraph is gone.
- grilling is **inlined once** as a named section; the three in-body references point at
  the `#the-grilling-protocol` anchor (composition decision, edge 3).
- domain-modeling, research, and prototype are **pointers** with the standard wording and a
  firing condition (edges 4–6).

## 3. A pointer fires

The map's next frontier ticket is a grilling ticket. The render says to load
domain-modeling at session start:

```
$ wayfinder skill domain-modeling
# Domain Modeling

[... 74 rendered lines ...]

When you crystallise a term, record it per `wayfinder skill domain-modeling --file
CONTEXT-FORMAT.md`. When a decision needs an ADR, fetch `wayfinder skill domain-modeling
--file ADR-FORMAT.md`.
```

Intra-skill disclosure survives as CLI pointers: the two format files stay behind
`--file`, exactly as they were behind relative links upstream.

## 4. A prototype ticket, later in the effort

A different session claims a ticket labelled `wayfinder:prototype`. The wayfinder render's
pointer fires:

```
$ wayfinder skill prototype
# Prototype

A prototype is throwaway code that answers a question [...]

- "Does this logic / state model feel right?" → run `wayfinder skill prototype --file
  LOGIC.md` and follow it.
- "What should this look like?" → run `wayfinder skill prototype --file UI.md` and follow it.

$ wayfinder skill prototype --file LOGIC.md
# Logic prototype

Build a tiny interactive terminal app that pushes the state machine through cases [...]
```

## 5. Discovery

The agent wants to know what else is servable (for example, when a map's Notes section
names a skill):

```
$ wayfinder skills
NAME             ORIGIN                      DESCRIPTION
wayfinder        core                        Plan a huge chunk of work — more than one agent…
grilling         core                        Grill the user relentlessly about a plan, decis…
domain-modeling  core                        Build and sharpen a project's domain model. Use…
grill-with-docs  core                        A relentless interview to sharpen a plan or des…
research         core                        Investigate a question against high-trust prima…
prototype        core                        Build a throwaway prototype to answer a design …
to-spec          core                        Turn the current conversation into a spec and p…
to-tickets       core                        Break a plan, spec, or the current conversation…

8 skills · tracker: github (project) · 0 extensions · 0 plugins
```

```
$ wayfinder skills --json
[
  { "name": "wayfinder", "origin": "core", "modelInvocation": false, "files": [] },
  { "name": "prototype", "origin": "core", "modelInvocation": true,
    "files": ["LOGIC.md", "UI.md"] },
  ...
]
```

An unknown name fails loudly with the index attached, so the "map Notes names a skill the
CLI does not serve" case (composition open question 6) has a defined behaviour:

```
$ wayfinder skill riskiest-assumption
Error: no skill named "riskiest-assumption" is served.
Run `wayfinder skills` to see the 8 served skills, or register it:
  wayfinder ext add riskiest-assumption --source <path> ...
(exit 1)
```
