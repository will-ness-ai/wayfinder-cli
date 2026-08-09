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
The section of wayfinder's render that lists the skills available for tickets, each with a firing condition. It renders from the skill registry: core entries built in, registered extensions appended.
_Avoid_: ticket-type enum

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
A CLI pointer written into a ticket body at charting time. The session that claims the ticket runs the listed commands to load its context. A skill in a ticket's skill list is delivered this way, not through the host's prose.
_Avoid_: ticket link, embedded skill

**Composition rule**:
The rule that picks the mechanism for a cross-skill edge. Necessity decides whether the content is needed on every path; size decides the mechanism. Mandatory and small → inline at render. Conditional or large → CLI pointer (hard-worded when the edge is mandatory).
