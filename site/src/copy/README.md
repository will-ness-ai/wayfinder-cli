# copy — the words on the six written pages

The final text of the landing page, the four reference pages, and the cheatsheet.
Written in [Write the reference pages and the cheatsheet](https://github.com/will-ness-ai/wayfinder-cli/issues/51).

One file is one page. The nine skill pages are not here: they render from the CLI
in [Generate the skill pages from the CLI render](https://github.com/will-ness-ai/wayfinder-cli/issues/50).

| File | Route station | Group |
|---|---|---|
| `overview.md` | Overview | — |
| `commands.md` | Commands | Reference |
| `config.md` | Config | Reference |
| `trackers.md` | Trackers | Reference |
| `ticket-skills.md` | Ticket skills | Reference |
| `cheatsheet.md` | Cheatsheet | — |

## The words are fixed; the shape is a proposal

Change the frontmatter shape freely — turn it into an Astro content collection,
split a key out, rename one. Keep the words. Every sentence here was checked
against the CLI on `main`, and a rewrite loses that check.

Where a page states a fact about the CLI, the CLI is the source of truth. Run the
command before you change the sentence.

## Frontmatter

Every file carries these keys:

```yaml
title: Commands           # the <h1> and the <title>
nav: Commands             # the route station label
group: Reference          # the route group; absent on an ungrouped station
order: 2                  # position in the route, across all 15 stations
description: ...          # the <meta name="description">
terminal:                 # the third column
  label: try it           # the terminal bar label, lower case
  lines:
    - kind: cmd           # amber, and the renderer prefixes "$ "
      text: wayfinder skills
    - kind: out           # plain terminal foreground
      text: "skills[9]:"
```

`kind` is one of four:

| kind | Colour | Holds |
|---|---|---|
| `cmd` | `--caret` amber, prefixed `$ ` | the command the reader types |
| `out` | `--termfg` | stdout, as the CLI writes it |
| `ok` | green | a line that reports success |
| `cm` | `--termdim` | a prompt, an answer, or an elision |

Two files carry more. `overview.md` adds `hero`, `install`, `panels`, and
`upstream` — the locked landing structure. `cheatsheet.md` adds `groups`, the
eight groups of the one dense table. Both shapes are visible in the file.

## An item cell on the cheatsheet holds one token

`cheatsheet.md` renders its `groups` into a three-column table — group, item,
meaning. The item column is monospace and never wraps, so the widest cell in it
sets the width of the whole column. Every character that cell gains comes out of
the meaning column beside it.

Two rules follow:

- **One literal token per cell.** A command, a flag, a config key, a path, or a
  label — never a list. Give each value its own row.
- **Keep an item to 36 characters or fewer.** `wayfinder ticket-skill remove
  <name>` is the widest today, and the columns are measured against it.

A cell that held four tracker values joined by `·` widened the item column by
84px and cut the meaning column to 148px, which wrapped 41 of 51 meaning cells to
three lines. The page's verdict is maximum density, one screen for a human eye.
See [Decide how the cheatsheet handles a long item](https://github.com/will-ness-ai/wayfinder-cli/issues/65).

## Internal links

A link in a body to another page of this site is written site-root-relative, with
a trailing slash: `/trackers/`, `/ticket-skills/`. Send each one through
[`href()`](../lib/href.ts) at render time — the site serves under
`/wayfinder-cli/`, and Astro leaves a hand-written `<a href>` alone. An external
link is absolute and goes through nothing.

## The terminal examples are real, with paths shortened

Every `out` and `ok` line was captured from the built CLI. Two edits were made,
and no others:

- An absolute working-directory path reads as `~/repo`.
- A long listing ends in a `cm` line that says how many rows were cut.

The verbatim-bytes promise belongs to the skill pages, not to these examples.
