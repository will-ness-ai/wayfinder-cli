# Prototype: the docs site look

Prototype for the map ticket [Design the docs site look](https://github.com/will-ness-ai/wayfinder-cli/issues/46), on the map [Wayfinder map: docs site — wayfinder-cli on GitHub Pages](https://github.com/will-ness-ai/wayfinder-cli/issues/45).

**Status: locked.** Four rounds of prototypes, each round one level further down the design tree. Every page in [prototype.html](prototype.html) now shows the accepted design.

This file is the **specification** that [Choose the site framework](https://github.com/will-ness-ai/wayfinder-cli/issues/47) and [Apply the locked design](https://github.com/will-ness-ai/wayfinder-cli/issues/49) build against. A framework theme never overrules a verdict below.

## The file

[prototype.html](prototype.html) is one standalone HTML file. Open it in a browser — it needs no server and no build. A draggable picker sits at the bottom right. Use it to switch page (landing, reference, skill page, cheatsheet) and theme (system, light, dark).

The copy is real, taken from [the v1 spec](../../spec/wayfinder-cli-v1.md). No page holds filler text.

## Verdicts

### 1. The shell: prose with a terminal beside it

Every page is a grid. A route sidebar on the left, prose in the middle, and a terminal in the third column that shows the output of the commands the prose describes.

The terminal is what makes this site different from a generic docs theme. The product is a program that prints things, so the site shows what it prints, on every page.

### 2. The navigation: a route with one station per page

The sidebar is a vertical hairline with a dot for each page. The dot for the current page fills with the accent colour and takes a halo.

The route is the site's one motif. It comes from the wayfinding vocabulary the reader already knows, and it makes the sidebar say what the product is.

All 15 pages stay open in the route — 1 landing, 4 reference, 9 skill, 1 cheatsheet. The nine skill ids **are** the product, so a collapsed Skills group would hide what the CLI serves. Fifteen stations fit one screen at a normal window height.

### 3. The columns adapt: three, but two on a skill page

Landing, reference, and cheatsheet run three columns. A skill page drops to two, and its output block runs full width.

A skill page is already terminal output. A terminal column beside terminal output is dead space. This rule covers 9 of the 15 pages.

### 4. The theme follows the system, with a toggle

No stamp on the root element means the system setting decides. An explicit choice stamps `data-theme="light"` or `data-theme="dark"` and wins in both directions. A control in the top strip cycles system → light → dark.

The reader arrives from a terminal, so a guess is wrong half the time. The toggle exists because a docs site is often open beside an editor in the other theme.

Write the tokens the way [prototype.html](prototype.html) does: the complete light palette on bare `:root`, the dark tokens under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])`, and the dark tokens again under `:root[data-theme="dark"]`. A colour defined only inside a media block or a `[data-theme]` block does not apply in the un-stamped state.

### 5. A skill page shows the verbatim stdout

A skill page holds the bytes of `wayfinder skill <id>`, in one block. It never re-renders the markdown as prose.

The page answers one question: what does my agent actually get. Rendered prose answers a different question.

The block carries three things:

- **Line numbers** in a gutter, so a reader can cite a line.
- **Markdown tinting** — headings in the caret amber, fenced code and tables dimmed, inline code in teal. The tinting reads the structure of the output. It changes no byte.
- **A header bar** with the command, the line count, and a copy control. The bar sticks below the top strip.

Above the block, a **fixture line** states the config that produced the page: the tracker value, and the registered ticket skills. The map requires this on every skill page.

### 6. The terminal is static, and it keeps one palette

The third column shows a fixed example per page. It does not follow the reader's scroll.

A scroll-following rail was prototyped and rejected. It costs build effort on all 15 pages to solve a problem that a short reference page does not have.

The terminal, the fenced code blocks, and the stdout block all keep **one dark palette in both themes**. A pale terminal in light mode stops looking like output, and looking like output is the whole job.

### 7. The reference pages carry no in-page contents list

Prose fills the middle column. The third column is the terminal, not a table of contents.

The four reference pages are short enough to scroll. A contents list would take the column that the terminal earns.

### 8. The landing page: one statement, then two panels

The hero is one oversized line, one supporting line, and the install commands in a dark block.

Below it, the pitch splits **50/50** into two bordered panels:

| Panel | Holds |
|---|---|
| **What it removes** | Copies drift. Skills hardcode each other. Skills assume one tracker. |
| **What it adds** | Your own skills join the plan. One setup for the whole team. Adoption is one command. |

The second panel takes the accent border and an accent tint, so the eye sees that half of the pitch is about extension, not complaint.

The balance is the point. Half of what the CLI does is repair the problems with skills kept as files. The other half is new: a team registers its own skills, ships one committed config, and adopts wayfinder with one command per repo. A pitch that is three-quarters complaint understates the product.

The landing page also carries the link out to https://www.aihero.dev/skills-wayfinder. This site never teaches the wayfinding method.

### 9. The cheatsheet is one dense table

Three columns — group, item, meaning. Eight groups: agent commands, setup commands, flags, config keys, config scopes, tracker values, skill ids, ticket labels. A rule and extra space open each group.

Cards were prototyped and rejected. The cheatsheet exists to be scanned, and card borders spend space that rows want.

## Design tokens

Copy these values. They are the palette the four rounds settled on.

**Light** — `--bg:#F6F7F5` `--paper:#FFFFFF` `--fg:#17191B` `--dim:#6E7377` `--faint:#9AA09C` `--rule:#E2E4E0` `--hair:#EDEEEA` `--accent:#1F7A6B` `--soft:rgba(31,122,107,.11)` `--code:#F0F2EE`

**Dark** — `--bg:#121412` `--paper:#191C19` `--fg:#E4E7E2` `--dim:#8C938E` `--faint:#666C68` `--rule:#272B27` `--hair:#1F231F` `--accent:#5FC4B0` `--soft:rgba(95,196,176,.13)` `--code:#101310`

**Terminal, both themes** — `--term:#0F1211` `--termfg:#D8DAD6` `--termdim:#727A81` `--termrule:#222724` `--caret:#E4B429`, with `--tHead:#E4B429` `--tCode:#7FD2C2` `--tDim:#767E7A` for the tinting.

**Type** — the system sans stack for body and headings, and the system monospace stack for code, commands, and every label with wide letter-spacing. No web font is loaded. Headings run tight (`letter-spacing` between `-.016em` and `-.038em`); labels run wide (`.12em` to `.2em`, upper case).

**Layout** — sidebar `254px`. Third column `minmax(300px, 34%)`. Prose `max-width: 66ch`. Top strip `46px`, sticky. The sidebar and the third column are sticky and full height. Below `1100px` the third column moves under the prose. Below `860px` the grid collapses to one column.

**Corners** — `6px` to `9px` on blocks and panels. The route dots are the only circles.

## Rejected alternatives, kept for the record

- **A terminal-only site**, in mono throughout, dark by default. Strongly on-brand for a CLI, and unreadable for four reference pages.
- **A cartographic look** — contour rings, serif headings, a paper plate. Its route sidebar won; the rest of it did not.
- **A Swiss reference sheet** — top bar, right-hand contents rail, numbered sections. It lost the route, and a top bar cannot hold 15 pages.
- **Flat colour blocks** with a solid nav column. Fast to scan, and too loud for long prose.
- **A terminal drawer** that slides from the right edge. It reaches the same place as the adaptive grid, and it asks the reader to do the work.
- **A terminal band** pinned above the prose. It costs vertical space on every page.
- **Terminals inline in the prose**, with no third column at all.
- **A rail that follows the scroll**, so the example always matches the section. The best idea that lost; revisit if the reference pages grow long.
- **A foldable stdout block**, one fold per `##` section. Folding hides the length, and the length is an honest fact about the render.
- **An index beside the stdout block**, listing the render's own headings.
- **Cards, four-column flow, sticky group headers, and an audience split** for the cheatsheet.
- **Four landing pitches** — a quiet one led by the terminal, a problem-led one, one led by the table of served skills, and one built from three horizontal stations.
- **Four ways to show the 50/50 split** — two columns, two stacked bands, a six-row ledger, and a spine that runs the route motif down the pitch.

## Not decided here

- **The framework.** [Choose the site framework](https://github.com/will-ness-ai/wayfinder-cli/issues/47) picks it, and it must reproduce the verdicts above exactly.
- **Where the copy comes from.** The prototype holds real copy, but [Write the reference pages and the cheatsheet](https://github.com/will-ness-ai/wayfinder-cli/issues/51) owns the final text.
- **How the skill pages are produced.** [Generate the skill pages from the CLI render](https://github.com/will-ness-ai/wayfinder-cli/issues/50) owns the fixture config and the build step. This prototype fixes only how the output looks.
- **Search, versioned docs, and a custom domain.** All out of scope on the map.
