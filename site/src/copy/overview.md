---
title: wayfinder-cli
nav: Overview
order: 1
description: >-
  wayfinder-cli serves planning skills to coding agents as rendered markdown —
  composed for your harness, substituted for your issue tracker, and extended
  with the skills your team registers.

hero:
  headline: Your agent's planning skills, served.
  sub: >-
    Composed for your harness. Substituted for your issue tracker. Extended
    with the skills your team registered.

install:
  - command: npm install -g wayfinder-cli
    note: Install once, for every repo on the machine. A Homebrew tap ships the same build.
  - command: wayfinder init
    note: Writes one stub skill per agent harness, and records your issue tracker.
  - command: wayfinder
    note: Your agent runs this. It prints the wayfinder skill, and the rest follows.

panels:
  - title: What it removes
    note: Skills kept as files break in three ways.
    rows:
      - title: Copies drift
        body: >-
          Every repo holds its own copy of every skill, so an upstream
          improvement reaches no repo without a manual sweep. The content ships
          inside the CLI instead. Upgrade the CLI and every skill upgrades with
          it.
      - title: Skills hardcode each other
        body: >-
          A skill that says "run /grilling" works only while you keep that
          skill, under that name, in that harness. The render composes instead.
          A dependency every path needs is inlined; a dependency only some paths
          need becomes a command plus the condition that fires it.
      - title: Skills assume one tracker
        body: >-
          GitHub prose in a Jira repo is worse than no prose. Name your tracker
          and the render appends the operations for it. A repo with no tracker
          set gets a block that asks the human — never a silent guess.
  - title: What it adds
    note: A served skill set your team can extend.
    accent: true
    rows:
      - title: Your own skills join the plan
        body: >-
          Register a harness skill with one sentence that says when it applies.
          The charting agent reads that sentence and writes the skill into every
          ticket it covers — your pre-mortem, your design loop, your review
          checklist.
      - title: One setup for the whole team
        body: >-
          Project scope is a committed file. Every contributor and every agent
          renders the same skills, the same tracker, and the same
          registrations, with nothing to configure per person.
      - title: Adoption is one command
        body: >-
          Run wayfinder init once per repo. There is nothing to copy, nothing to
          keep in step, and nothing for a new joiner to install by hand.

upstream:
  text: New to wayfinding? This site documents the CLI, not the method — start at
  label: aihero.dev/skills-wayfinder
  url: https://www.aihero.dev/skills-wayfinder

terminal:
  label: install → init → first render
  lines:
    - kind: cmd
      text: npm install -g wayfinder-cli
    - kind: out
      text: ""
    - kind: cmd
      text: wayfinder init --harness claude --tracker "github cli"
    - kind: ok
      text: Set tracker to "github cli" in project config (.wayfinder/config.json).
    - kind: ok
      text: Wrote .claude/skills/wayfinder/SKILL.md (new stub).
    - kind: out
      text: "Next: have your agent run `wayfinder skill wayfinder`."
    - kind: out
      text: ""
    - kind: cmd
      text: "wayfinder | grep '^## '"
    - kind: out
      text: "## Fog of war"
    - kind: out
      text: "## Out of scope"
    - kind: out
      text: "## Invocation"
    - kind: out
      text: "## Issue tracker: github cli"
---

`wayfinder` is a content server. It installs once per repo and prints planning
skills as rendered markdown for an agent to read. It never operates your issue
tracker: it prints the operations prose, and your agent runs the commands.
