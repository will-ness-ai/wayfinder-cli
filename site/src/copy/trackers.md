---
title: Trackers
nav: Trackers
group: Reference
order: 4
description: >-
  Name your issue tracker and the wayfinder render appends the operations prose
  for it — the value set, the filename rule, attaching your own doc, and the
  three states of the tracker block.

terminal:
  label: the three states
  lines:
    - kind: cmd
      text: wayfinder skill tracker
    - kind: out
      text: "## Issue tracker"
    - kind: out
      text: ""
    - kind: out
      text: No issue tracker is configured for this repo, so there is no operations prose to load.
    - kind: cm
      text: "# … and it asks the human to choose"
    - kind: out
      text: ""
    - kind: cmd
      text: wayfinder tracker set "acme tracker"
    - kind: cmd
      text: wayfinder skill tracker
    - kind: out
      text: "## Issue tracker: acme tracker"
    - kind: out
      text: ""
    - kind: out
      text: No operations prose ships for **acme tracker**. Use your own knowledge of this tracker, and the tools it provides, to create the map and its tickets.
    - kind: out
      text: ""
    - kind: cmd
      text: wayfinder tracker set "github cli"
    - kind: cmd
      text: wayfinder skill tracker
    - kind: out
      text: "## Issue tracker: github cli"
    - kind: out
      text: ""
    - kind: out
      text: Issues live in this repo's GitHub Issues. Use the [`gh`](https://cli.github.com/) CLI for every operation. Run it inside a clone and it infers the repo from `git remote -v`.
    - kind: cm
      text: "# … 49 more lines of operations prose"
---

Every wayfinder render ends with the operations prose for **your** issue tracker.
You name the tracker once; the render appends the prose that tells the agent how
to create the map, wire the blocking edges, and close a ticket.

The CLI never operates the tracker. It prints the prose, and your agent runs the
commands.

## Name your tracker

```bash
wayfinder tracker set "github cli"
wayfinder tracker set "linear mcp" --user
```

The value is freeform prose. Write it lower case, and write it the way you would
say it: the system, then how your agent reaches it.

## The value finds a doc by its filename

Lower-case the value and replace each run of whitespace with `-`. `github cli`
finds `github-cli.md`. There are no aliases and no fuzzy matching, so a value
that matches no file is simply a custom value — which is a state the render
already handles.

| Value | Shipped doc |
|---|---|
| `github cli` | `github-cli.md` — the reference doc |
| `gitlab` | `gitlab.md` |
| `local` | `local.md` — markdown files in the repo |
| `github mcp` | not written yet |
| `gitlab cli` | not written yet |
| `jira mcp` | not written yet |
| `linear mcp` | not written yet |
| anything else | your own, through `--doc` |

The four values marked *not written yet* are
[tracked in the repo](https://github.com/will-ness-ai/wayfinder-cli/issues/31).
Until each one lands it behaves as a custom value: the render names it and leaves
the operations to your agent's own tools.

`gitlab mcp` is deliberately absent. The official GitLab MCP server is Beta and
cannot list, update, assign, or close an issue, so a repo on a community server
uses the freeform value instead.

## Attach your own doc

```bash
wayfinder tracker set "acme tracker" --doc ./docs/trackers/acme.md
```

`--doc` works with any value, shipped or not. It **replaces** the shipped doc
rather than merging with it, so exactly one doc reaches the render and it can
never hold two conflicting sets of commands.

It stores the path, not a copy, and resolves it against the config file that
holds it. Commit the doc and the project config together, and your whole team
reads the same file. A path that stops resolving degrades to the no-doc block
and is reported by `wayfinder doctor`; a missing file is never an error.

## The three states of the tracker block

The block always renders, in one of three states.

| State | The block holds |
|---|---|
| No tracker set | The gap, plus the two ways to close it. It asks the human, and it never guesses. |
| A value, and no doc found | The tracker's name, and an instruction to use the agent's own tools. |
| A value, and a doc found | The whole doc, under `## Issue tracker: <value>`. |

In the third state the doc's own headings drop one level and nothing else is
added. A doc therefore carries no top-level heading of its own — the render
supplies the title.

## What a tracker doc holds

The shipped docs share a shape. Each one names the tool the agent drives, then
covers:

- **Conventions** — create, read, list, comment, label, close.
- **Wayfinding operations** — how a map, a child ticket, a blocking edge, and a
  claim are expressed on this tracker.
- **The frontier recipe** — no tracker can express "open, unblocked, unassigned
  children of one map" as a single server-side query, so every doc ships the same
  two steps: narrow server-side, then inspect each candidate's blockers.
- **The missing-label rule** — a tracker refuses a label the project does not
  have, so a fresh repo fails on the first run. Every doc says the same thing:
  ask the human to create the label or to publish without it, and never create a
  label in silence.

Write your own doc to the same shape and `--doc` will carry it.

## Reaching the block on its own

```bash
wayfinder skill tracker
```

`wayfinder skill tracker` prints the tracker block alone, in whichever state
applies. One function serves it and the wayfinder render, so the two can never
disagree.

`to-spec` and `to-tickets` run standalone, with no map and no wayfinder session
to append anything. Each names your tracker and carries one conditional pointer
at `wayfinder skill tracker`, rather than inlining the doc.
