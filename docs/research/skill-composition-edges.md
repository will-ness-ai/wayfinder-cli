# Skill composition edges: inline at render vs CLI pointer

Research for the ticket "How to combine skills without duplication". All sources are in
[mattpocock/skills](https://github.com/mattpocock/skills); paths below are paths in that repo.

## The constraint

The CLI serves rendered skill content. The rendered output has **no Skill tool**, so every
upstream cross-skill reference ("via the `/grilling` skill", "run a `/grilling` session") must
become one of exactly two things:

- **Inline at render** — the dependency's body is composed into the host's rendered output. The
  composition happens only in the render pipeline, from the dependency's single source file. No
  source duplication, ever.
- **CLI pointer** — a concrete command the agent can run: `<cli> skill grilling`. A pointer that
  is not a runnable command is dead text in a CLI world.

## The decision rule (from writing-great-skills)

Derived from `skills/productivity/writing-great-skills/SKILL.md` and its `GLOSSARY.md`:

1. **Branch test** (progressive disclosure): inline what every branch of the host needs; put
   behind a pointer what only some branches reach. "Disclose what only some branches need,
   inline what every path needs."
2. **Sprawl brake**: inlining adds the dependency's full length to what the agent wades through
   before acting. A long, reference-heavy dependency behind a pointer keeps the host's
   information hierarchy legible; a tiny dependency costs less inline than the pointer prose
   that would replace it.
3. **Pointer wording carries the reliability**: "Its wording, not the target, decides when the
   agent reaches — and how reliably. A must-have target behind a weakly worded pointer is a
   variance bug: fix the wording first, and inline the material only if sharpening fails."
   Every rendered pointer therefore needs a firing condition plus an exact command.
4. **Single source of truth**: each meaning lives in one authoritative place. Inlining is only
   legal because it is resolved at render time from that one place.

Approximate body sizes that feed the sprawl brake: grilling ~7 lines; grill-with-docs 1 line;
research ~10 lines; domain-modeling 74 lines (+ 2 disclosed format files, ~107 lines);
prototype 27 lines (+ LOGIC.md 79, UI.md 112); wayfinder 128 lines; to-spec 75; to-tickets 105.

## Edge inventory: cross-skill edges among the eight

| # | Host | Dependency | Where referenced | Recommendation | Rationale |
|---|------|------------|------------------|----------------|-----------|
| 1 | grill-with-docs | grilling | Whole body: "Run a `/grilling` session, using the `/domain-modeling` skill" (`skills/engineering/grill-with-docs/SKILL.md`) | **Inline at render** | The composition *is* the skill; one branch, taken on every run — the branch test says inline. As pointers, the rendered skill would contain nothing but two commands: two fetch round-trips and two pointer-reliability risks to deliver zero content. |
| 2 | grill-with-docs | domain-modeling | Same single line | **Inline at render** | Same single-branch argument. Composing 74 lines into a 1-line host yields a ~85-line render — shorter than wayfinder itself; no sprawl. Domain-modeling's own disclosed files (`CONTEXT-FORMAT.md`, `ADR-FORMAT.md`) stay disclosed behind CLI pointers, so its internal hierarchy survives composition. |
| 3 | wayfinder | grilling | Ticket Types ("Grilling (HITL): Conversation via the /grilling and /domain-modeling skills … the default case"); Chart step 1 ("Run a `/grilling` and `/domain-modeling` session") and step 2 ("Grill again"); Work step 3 ("If in doubt, use `/grilling` and `/domain-modeling`") (`skills/engineering/wayfinder/SKILL.md`) | **Inline at render** (once, anchored) | Both wayfinder branches reach it: charting always grills (steps 1–2), and working defaults to it (grilling is "the default case", plus the "if in doubt" catch-all). Near-every-branch need means inline. The body is ~7 lines — cheaper than the pointer prose plus a round trip. Render it once as a named section; rewrite the three in-body references to internal anchors, so the rendered output also holds a single copy. |
| 4 | wayfinder | domain-modeling | Same three sites as edge 3 | **CLI pointer** | Same branches as grilling, but the sprawl brake wins: 74 lines of mostly *reference* (conduct rules, ADR gate) plus two disclosed format files would push wayfinder from 128 to 200+ lines and bury its steps. writing-great-skills' cure for sprawl is exactly this: push reference behind a context pointer. It is consulted mid-session, when a term crystallises — not needed before the session can start. Wording: "At session start, run `<cli> skill domain-modeling` and apply it alongside the grilling protocol." |
| 5 | wayfinder | research | Ticket Types ("Research (AFK) … Resolved by a `/research` **subagent**"); Chart step 5 ("spin up a `/research` subagent" per research ticket) | **CLI pointer** | Only the research-ticket branch reaches it; many sessions never do — textbook disclosure. It also fires *in a subagent*: the parent hands the command (or its output) to a fresh context, which a pointer supports naturally and inlining cannot. Wording: "For each research ticket, launch a subagent whose prompt includes the output of `<cli> skill research` and the ticket question." |
| 6 | wayfinder | prototype | Ticket Types ("UI/logic code via the /prototype skill") | **CLI pointer** | Only the prototype-ticket branch. The dependency is a three-file tree (`SKILL.md` + `LOGIC.md` + `UI.md`, ~220 lines) with its own two-branch structure; inlining would flatten that hierarchy and make every wayfinder session carry two dead branches. Wording: "When the ticket is labelled `wayfinder:prototype`, run `<cli> skill prototype` and follow its output." |

Headline: **6 in-set edges; 3 inline at render, 3 CLI pointers.** No other cross-skill
invocation edges exist among the eight (grilling, domain-modeling, research, prototype, to-spec,
and to-tickets reference no other core skill).

## Edges that leave the set of eight

These cannot be resolved by either mechanism as-is and need a decision:

| # | Host | Target | Where | Note |
|---|------|--------|-------|------|
| 7 | wayfinder | setup-matt-pocock-skills | "The Map" section: "run `/setup-matt-pocock-skills` if not" | The CLI does not serve this skill. Tracker configuration becomes the CLI's own concern — replace with the CLI's setup/config story or drop. |
| 8 | to-spec | setup-matt-pocock-skills | Process preamble | Same. |
| 9 | to-tickets | setup-matt-pocock-skills | Preamble and step 5 ("the tracker `/setup-matt-pocock-skills` configured") | Same, twice. |
| 10 | wayfinder | *dynamic*: "invoke the skills the `## Notes` block names" | Work step 3 | Target is known only at run time — cannot inline at render. Must stay a *generic* pointer, which requires the stable command form `<cli> skill <name>` and a convention that map Notes only name servable skills. |

Soft references, no action needed: to-spec ("Implementation Decisions") and to-tickets (final
paragraph) mention "a prototype" as an artifact source, not as a skill invocation — no edge.

## Comparison class: intra-skill pointers

These are already progressive disclosure done right; the CLI should preserve them as pointers,
which means disclosed files must be addressable through the CLI:

- `skills/engineering/prototype/SKILL.md` → `LOGIC.md` / `UI.md`: two **mutually exclusive
  branches** — every run takes exactly one. Inlining both would make every run carry a dead
  branch. Keep disclosed; rewrite the links to the CLI's sub-resource form.
- `LOGIC.md` ↔ `UI.md` mutual "wrong branch" cross-pointers, and each file's back-pointer to
  `SKILL.md` (the capture step): keep, rewrite to CLI form.
- `skills/engineering/domain-modeling/SKILL.md` → `CONTEXT-FORMAT.md` / `ADR-FORMAT.md`: needed
  only at the moment of writing a file — deep-branch reference; keep disclosed. This holds even
  where domain-modeling itself is inlined (edge 2): the composed render keeps these as pointers.
- `skills/productivity/writing-great-skills/SKILL.md` → `GLOSSARY.md`: the exemplar of the
  pattern (not served by the CLI; cited for the shape).

## Render-time composition patterns that keep a single source of truth

- **Sources stay clean; the pipeline composes.** Forked skill sources remain one-source-per-
  meaning (and byte-close to upstream, easing merges). All inlining lives in a render manifest
  or template layer — e.g. an include directive (`{{include skill="grilling"}}`) resolved at
  render from the dependency's single source file.
- **Frontmatter strip and heading demotion** on every include, so composed output reads as one
  document.
- **Include-once, anchor-many.** When a host references one dependency at several sites (edge
  3), render the body once as a named section and rewrite each in-body reference to an internal
  anchor — the render output also keeps exactly one copy.
- **Pointer rewrite pass with a build-failing lint.** Map every `/skill-name` and "Skill tool"
  phrasing to the concrete command form; fail the render on any unmapped skill token so stale
  Skill-tool phrasing can never ship.
- **Pointer wording template.** Reliability lives in the wording, so standardise it: "When
  <condition>, run `<cli> skill <name>` and follow its output." Every pointer edge above names
  its condition.
- **Disclosed files as sub-resources.** Intra-skill pointers survive only if `LOGIC.md`,
  `UI.md`, `CONTEXT-FORMAT.md`, `ADR-FORMAT.md` are fetchable (e.g. `<cli> skill prototype
  --file LOGIC.md`), keeping each skill's internal hierarchy intact.

## Open questions for the decision session

1. **Edge 3 (wayfinder → grilling)** is the only edge where the branch test (inline) and
   mechanism-uniformity (pointer everywhere) pull apart. Accept the mixed model, or trade ~7
   inline lines for one uniform rule?
2. **Does grill-with-docs survive as a served skill at all?** Its render is exactly
   grilling + domain-modeling composed; it could instead be a flag (`<cli> skill grilling
   --with-docs`).
3. **Command shape for disclosed files** (`--file`, sub-path, separate command) — this decides
   the exact wording of every intra-skill pointer.
4. **Voice under composition.** Grilling's body is first-person imperative ("Interview me
   relentlessly…"). Does it compose raw into a host, or under a framing line ("Adopt this
   protocol:")?
5. **Replacement for the three setup-matt-pocock-skills edges** (edges 7–9): a CLI config
   command, static docs, or removal?
6. **Contract for the dynamic Notes edge** (edge 10): must everything a map's Notes names be
   servable as `<cli> skill <name>`, and what does the agent do when it is not?
7. **Discovery.** Upstream, model-invoked descriptions are the always-loaded index that lets
   skills fire. A CLI render has no such index — is `<cli> skills list` the replacement, and do
   descriptions keep their trigger phrasing there?
