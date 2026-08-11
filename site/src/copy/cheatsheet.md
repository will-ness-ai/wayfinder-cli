---
title: Cheatsheet
nav: Cheatsheet
order: 15
description: >-
  Every wayfinder command, flag, config key, tracker value, skill id, and ticket
  label, in one dense table.

terminal:
  label: wayfinder --help
  lines:
    - kind: cmd
      text: "wayfinder --help"
    - kind: out
      text: "wayfinder — a content server that renders planning skills for coding agents."
    - kind: out
      text: ""
    - kind: out
      text: "USAGE"
    - kind: out
      text: "  wayfinder                Print the wayfinder skill, the agent's entry point."
    - kind: out
      text: "  wayfinder skill <id>     Print one skill, rendered as markdown."
    - kind: out
      text: "  wayfinder skills         List every skill served, with its description and children."
    - kind: out
      text: ""
    - kind: out
      text: "SETUP"
    - kind: out
      text: "  wayfinder init                       Install the entry-point stub into your agent harnesses."
    - kind: out
      text: "    [--harness <ids>] [--tracker ...]  Runs a form on a terminal; takes flags with no TTY."
    - kind: out
      text: "                                       --harness is claude, agents, or both, comma-separated."
    - kind: out
      text: "                                       Idempotent: a re-run repairs the stub and reports a diff."
    - kind: out
      text: "  wayfinder tracker show               Report the effective tracker and the scope it came from."
    - kind: out
      text: "  wayfinder tracker set [<value>]      Record this repo's issue tracker. Runs a form on a"
    - kind: out
      text: "    [--doc <path>] [--user]            terminal; takes flags with no TTY. --doc attaches a"
    - kind: out
      text: "                                       tracker doc by path; --user writes the user scope."
    - kind: out
      text: "  wayfinder ticket-skill add <name>    Register a harness skill for charting to assign to"
    - kind: out
      text: "    --when \"<sentence>\" [--scope ...]  tickets. --when is required; --scope is local, project"
    - kind: out
      text: "                                       (default), or user. edit, remove, and list round it out."
    - kind: out
      text: "  wayfinder doctor                     Report registered ticket skills that resolve to no"
    - kind: out
      text: "                                       installed harness skill, and an unresolvable tracker doc."
    - kind: out
      text: ""
    - kind: out
      text: "OPTIONS"
    - kind: out
      text: "  --json                   Emit machine-readable JSON instead of TOON."
    - kind: out
      text: "  --version, -V            Print the version."
    - kind: out
      text: "  --help, -h               Print this page."
    - kind: out
      text: ""
    - kind: out
      text: "Skill renders are always markdown. Every list and status command — skills,"
    - kind: out
      text: "tracker show, ticket-skill list, doctor — prints TOON by default and JSON"
    - kind: out
      text: "under --json. Run `wayfinder skills` to discover every served id."

groups:
  - title: Agent commands
    rows:
      - item: wayfinder
        meaning: print the wayfinder skill — the same bytes as wayfinder skill wayfinder
      - item: wayfinder skill &lt;id&gt;
        meaning: print one rendered skill as markdown
      - item: wayfinder skills
        meaning: list every served id, with its description and children

  - title: Setup commands
    rows:
      - item: wayfinder init
        meaning: write the harness stub; idempotent, and reports a diff on a repair
      - item: wayfinder tracker show
        meaning: the effective tracker value, its doc, and the scope that won
      - item: wayfinder tracker set &lt;value&gt;
        meaning: record this repo's issue tracker; the value is freeform
      - item: wayfinder ticket-skill add &lt;name&gt;
        meaning: register a harness skill; --when is required
      - item: wayfinder ticket-skill edit &lt;name&gt;
        meaning: change a when sentence; --when is required
      - item: wayfinder ticket-skill remove &lt;name&gt;
        meaning: delete the registration in that scope, or tombstone an inherited one
      - item: wayfinder ticket-skill list
        meaning: every effective registration, with the scope that supplied it
      - item: wayfinder doctor
        meaning: unresolvable skill names and doc paths; exits 1 on any finding

  - title: Flags
    rows:
      - item: --harness claude,agents
        meaning: "init: the install targets, comma-separated"
      - item: --tracker "&lt;value&gt;"
        meaning: "init: record the tracker in project scope in the same pass"
      - item: --doc &lt;path&gt;
        meaning: "tracker set: attach your own operations prose by path"
      - item: --user
        meaning: "tracker set: write user scope instead of project"
      - item: --when "&lt;sentence&gt;"
        meaning: "ticket-skill add and edit: the required relevance condition"
      - item: --scope local|project|user
        meaning: "ticket-skill: which config file to write; default project"
      - item: --json
        meaning: JSON instead of TOON, on every list and status command
      - item: --version, -V
        meaning: print the version
      - item: --help, -h
        meaning: print the full setup page

  - title: Config keys
    rows:
      - item: tracker.value
        meaning: the freeform tracker value, for example "github cli"
      - item: tracker.doc
        meaning: path to your own operations doc, resolved from its own config file
      - item: ticketSkills.&lt;name&gt;.when
        meaning: the required relevance sentence for one registration
      - item: "ticketSkills.&lt;name&gt;: null"
        meaning: a tombstone — hides a registration inherited from a broader scope

  - title: Config scopes
    rows:
      - item: ~/.config/wayfinder/config.json
        meaning: user — not committed; follows $XDG_CONFIG_HOME when it is set
      - item: .wayfinder/config.json
        meaning: project — committed, and the default for every write
      - item: .wayfinder/local.json
        meaning: local — ignored by git, and it wins
      - item: tracker
        meaning: resolves wholesale — the nearest scope supplies value and doc together
      - item: ticketSkills
        meaning: resolves as a union of every scope, keyed by name

  - title: Tracker values
    rows:
      - item: github cli
        meaning: ships operations prose — the reference doc
      - item: gitlab
        meaning: ships operations prose
      - item: local
        meaning: ships operations prose — markdown files in the repo
      - item: github mcp
        meaning: planned; no prose ships yet, so it behaves as a custom value
      - item: gitlab cli
        meaning: planned; no prose ships yet
      - item: jira mcp
        meaning: planned; no prose ships yet
      - item: linear mcp
        meaning: planned; no prose ships yet
      - item: anything else
        meaning: custom — the render names it and leaves the operations to your agent
      - item: --doc &lt;path&gt;
        meaning: attach your own prose to any value; it replaces a shipped doc

  - title: Skill ids
    rows:
      - item: wayfinder
        meaning: chart a map, then work its tickets — no children
      - item: grilling
        meaning: the decision-conversation protocol — no children
      - item: domain-modeling
        meaning: "children: domain-modeling/adr-format, domain-modeling/context-format"
      - item: grill-with-docs
        meaning: "children: domain-modeling/adr-format, domain-modeling/context-format"
      - item: research
        meaning: read primary sources, capture the findings — no children
      - item: prototype
        meaning: "children: prototype/logic, prototype/ui"
      - item: to-spec
        meaning: a closed map becomes a spec — no children
      - item: to-tickets
        meaning: a spec becomes implementation tickets — no children
      - item: tracker
        meaning: the tracker block alone, in whichever of its three states applies

  - title: Ticket labels
    rows:
      - item: wayfinder:map
        meaning: the map issue itself
      - item: wayfinder:grilling
        meaning: a decision conversation
      - item: wayfinder:research
        meaning: a fact outside the working directory that a decision waits on
      - item: wayfinder:prototype
        meaning: a rough artifact raises the fidelity of the discussion
      - item: wayfinder:task
        meaning: manual work that unblocks a decision
      - item: ready-for-agent
        meaning: zero human input needed (AFK)
      - item: ready-for-human
        meaning: human oversight needed (HITL)
---

Every command, every flag, every config key, and every tracker value. One
screen, for a human eye.
