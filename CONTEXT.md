# wayfinder-cli

A public content-server CLI that renders a set of planning skills for agents. The CLI serves skill content; it never operates an issue tracker.

## Language

### Tickets

**AFK (ready-for-agent)**:
A ticket an agent can complete with zero human input.
_Avoid_: autonomous, background

**HITL (ready-for-human)**:
A ticket that needs human oversight to resolve.
_Avoid_: interactive, manual

**Ticket type**:
The shape of work a ticket holds: grilling, research, prototype, or task. A closed set of four, carried as the `wayfinder:<type>` label. Orthogonal to the ticket's skill list.
_Avoid_: category, kind

**Skill list**:
The set of skill commands a ticket body carries. The charting agent plans it per ticket from the skill-planning list. Any type can carry any skills (a prototype ticket may list grill-with-docs and prototype).
_Avoid_: type mapping

**Skill planning**:
The section of wayfinder's render that lists the skills available for tickets, each with a firing condition. It renders from the skill registry: core entries built in, registered ticket skills appended.
_Avoid_: ticket-type enum

**Ticket skill**:
A harness skill registered by name plus a required when sentence. Charting assigns it to each ticket where the sentence says it is relevant. The CLI points at it; the harness serves and invokes it.
_Avoid_: extension, extension skill

**When sentence**:
The registrant-written relevance condition on a ticket skill. It renders in skill planning and decides which tickets carry the skill.
_Avoid_: fires-when

### Skill composition

**Host**:
A skill whose body references another skill.
_Avoid_: parent skill, caller

**Dependency**:
The skill a host references.
_Avoid_: child skill, target skill

**Cross-skill edge**:
One reference from a host to a dependency.
_Avoid_: link, relation

**Mandatory edge**:
A cross-skill edge that every run of the host reaches.
_Avoid_: required edge, always-edge

**Conditional edge**:
A cross-skill edge that only some branches of the host reach.
_Avoid_: optional edge, branch edge

**Inline at render**:
The render pipeline composes the dependency's body into the host's output, from the dependency's single source file. Source files never hold copies.
_Avoid_: merge, embed, duplicate

**CLI pointer**:
A concrete command in rendered output, with a firing condition, that tells the agent to fetch a dependency (for example: "When the ticket is labelled `wayfinder:prototype`, run `wayfinder skill prototype`").
_Avoid_: reference, link, mention

**Hard-worded pointer**:
A CLI pointer whose wording states that the fetch is required and when ("At session start, you must run …").
_Avoid_: strong pointer

**Ticket-carried pointer**:
A skill pointer written into a ticket body at charting time. The session that claims the ticket runs the listed commands to load its context. A served skill points at `wayfinder skill <id>`; a ticket skill names the harness skill to invoke. A skill in a ticket's skill list is delivered this way, not through the host's prose.
_Avoid_: ticket link, embedded skill

**Composition rule**:
The rule that picks the mechanism for a cross-skill edge. Necessity decides whether the content is needed on every path; size decides the mechanism. Mandatory and small → inline at render. Conditional or large → CLI pointer (hard-worded when the edge is mandatory).

### Trackers

**Tracker value**:
The free-text string in config that names this project's issue tracker (for example `github cli`). Lower case it and replace spaces with `-` to find the shipped tracker doc.
_Avoid_: tracker name, tracker type

**Tracker doc**:
The operations prose for one tracker value: a file shipped in the CLI, or a file the project attaches with `tracker set --doc`. An attached doc replaces the shipped one.
_Avoid_: tracker file, operations doc

**Tracker block**:
The block the render appends at the bottom of the wayfinder render. It holds the tracker doc, or a fallback when there is none. `wayfinder skill tracker` prints the same block alone.
_Avoid_: tracker slot, substitution block

**Notice-and-ask block**:
The tracker block when config holds no tracker value. It reports the gap and asks the human to choose. It never stops with an error, and it never picks a tracker on its own.
_Avoid_: fallback, default tracker

### Docs site

**Docs site**:
The public site for wayfinder-cli, deployed to GitHub Pages. It serves a human who already knows wayfinder and now wants to install and operate the CLI. A reader who does not know the method goes to the upstream docs.
_Avoid_: website, homepage, docs

**Landing page**:
The first page of the docs site: what the CLI does, the install commands, a short quickstart, and the link out to the upstream wayfinder docs.
_Avoid_: home, index

**Reference page**:
One page of the docs site's reference section — commands, config, trackers, or ticket skills. Prose, tables, and code blocks, written by hand from the spec and from the working CLI.
_Avoid_: docs page, guide

**Cheatsheet**:
One dense scan page that holds every command, flag, config key, and tracker value in a single grid. It serves a reader who wants to copy a line, not read an explanation. It is not printable output, and it is not a paste block for an agent.
_Avoid_: quick reference, summary

**Rendered skill page**:
A docs site page that holds the stdout of `wayfinder skill <id>`, never the source file under `content/skills/`. It shows the reader exactly what an agent receives.
_Avoid_: skill doc, source page

**Fixture config**:
The fixed config the docs site build uses to produce every rendered skill page: tracker value `github cli`, plus example registered ticket skills. Each rendered skill page states the fixture that produced it.
_Avoid_: demo config, sample config
