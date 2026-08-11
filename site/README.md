# site — the docs site

The docs site for wayfinder-cli. Astro, no theme. It deploys to GitHub Pages on
every push to `main`, through [`.github/workflows/pages.yml`](../.github/workflows/pages.yml).

Every pull request runs `pnpm check` and `pnpm build`, through
[`.github/workflows/site-check.yml`](../.github/workflows/site-check.yml). Run
both from inside `site/` before you push: a type error stops the pull request,
even though it does not stop a deploy.

The look is locked in [docs/prototypes/docs-site/README.md](../docs/prototypes/docs-site/README.md).
That file decides the design; a framework default never overrules a verdict in
it. The framework choice and its measurements are in
[docs/research/site-framework.md](../docs/research/site-framework.md).

**One control is on the site and not in the prototype**: the source link in the
top strip. It was added after the design was locked, and the prototype is
deliberately not amended, so the record is
[wayfinder ticket #63](https://github.com/will-ness-ai/wayfinder-cli/issues/63).
It is not drift — do not reconcile it away.

## A standalone project

`site/` holds its own `package.json` and its own `pnpm-lock.yaml`, and the repo
has no pnpm workspace. Run every command from inside `site/`.

This keeps Astro's dependency tree out of the release path: the root
`pnpm install --frozen-lockfile` in `release.yml` never sees it, and the root
`files` field publishes `dist` and `content` only. The root ESLint config
ignores `site/**` for the same reason — `astro check` lints this project.

## Two things to keep

**Every internal link goes through `href()`** ([src/lib/href.ts](src/lib/href.ts)).
The site serves under `/wayfinder-cli/`, not under `/`. Astro prefixes an
imported asset on its own, and it leaves a hand-written `<a href>` alone.

**TypeScript stays at 5.9.3.** TypeScript 7 removed the programmatic API that
`astro check` calls, so `pnpm check` fails on it
([tracking discussion](https://github.com/withastro/roadmap/discussions/1321)).

The site needs no `.nojekyll` file. GitHub Pages serves the uploaded artifact
as it is, and it runs Jekyll only on the branch-based source. Measured on the
first deploy: `_astro/index.CMj5cWph.css` returns 200, and Jekyll would have
hidden that underscore-prefixed path.

## How a page is built

The words live in [`src/copy/`](src/copy/README.md) and the design lives in
[`src/styles/site.css`](src/styles/site.css). A page joins them.

| File | Holds |
|---|---|
| [`src/content.config.ts`](src/content.config.ts) | The schema over `src/copy/`. Change it when the copy grows a key. |
| [`src/lib/nav.ts`](src/lib/nav.ts) | The route. Six stations come from the copy's `nav`, `group`, and `order`; the nine skill stations are listed in the file. |
| [`src/layouts/Page.astro`](src/layouts/Page.astro) | The shell — route, top strip, prose column, terminal column. It owns the whole `<html>`. |
| [`src/components/`](src/components/) | `Route`, `TopStrip`, `Terminal`. |
| [`src/pages/[slug].astro`](src/pages/) | The four reference pages, from the copy bodies. |
| `src/pages/index.astro`, `cheatsheet.astro` | The two pages whose structure prose cannot hold. |

A page that passes a terminal runs three columns; one that passes none runs two,
which is how a rendered skill page gets its full-width output block.

Every value in the stylesheet traces to the locked prototype, and each block
names the verdict behind it. Only the accepted treatments are there — the
rejected ones are listed in the prototype's README and are not in the CSS.

**A station whose page does not exist yet** carries `ready: false` and renders
as dim text rather than a link, so the route keeps all 15 stations without
shipping a link to a 404. The nine skill stations are waiting on ticket #50.

## Markdown, and the two rehype plugins

The reference bodies are Markdown, so the build runs the Markdown pipeline, and
two locked rules need a plugin to reach prose the build renders:

- `rehypeWrapTables` puts every table in `<div class="tablewrap">`. The prose
  column is 66ch and a reference table is wider, so without the box a wide
  table pushes the whole page sideways on a phone.
- `rehypeBaseHref` prefixes a root-relative link with `/wayfinder-cli`. This is
  `href()` for prose, and it is why a copy file writes `/trackers/` plain.

Astro 7 made Sätteri the default Markdown processor, and `markdown.rehypePlugins`
switches the pipeline back to `unified` from `@astrojs/markdown-remark`. That is
what the dependency buys. `markdown.syntaxHighlight` is off in the same block:
Shiki writes its own background and colours onto every `<pre>`, over a locked
verdict.

## Escaping the CLI output

A rendered skill page holds the stdout of `wayfinder skill <id>`, and the
locked design says the page changes no byte. Measured on Astro 7.2.0: an
`{expression}` escapes `<`, `>`, `&`, `"`, and `'`, and it passes `{`, `}`, and
a backtick through as text. So a string in an expression is safe as it stands,
and it needs no `esc()` helper.

`set:html` writes the string raw. Build the line-number gutter and the markdown
tinting as Astro elements, so the escaping stays.

## The skill pages

Nineteen pages are built, and fifteen of them are stations on the route. The
nine top-level skill ids are stations; the four supporting files they disclose
— `domain-modeling/adr-format`, `domain-modeling/context-format`,
`prototype/logic`, `prototype/ui` — are pages with no dot, reached from the
parent that discloses them. Decided on
[wayfinder ticket #50](https://github.com/will-ness-ai/wayfinder-cli/issues/50).

**The page set follows the CLI, not a list here.** `src/lib/renders.ts` reads
`wayfinder skills` for the ids. `src/lib/nav.ts` still writes the nine station
labels out, because their order is the prototype's rather than the CLI's
registry order — so it checks itself against the CLI on every build and throws
when the two disagree.

**The CLI is loaded at run time, through a specifier the bundler cannot read.**
`site/` links the CLI with `link:..`, and Vite treats a linked package as
source: a static import is inlined into the build chunk, and the CLI then looks
for its own `content/` tree under `dist/.prerender/`. `ssr.external` does not
lift a linked package out. See the comment on `CLI_SEAM` in
[src/lib/renders.ts](src/lib/renders.ts).

**`dist/` must exist before Astro starts.** Run `pnpm install && pnpm build` in
the repo root first. Both workflows do this — [pages.yml](../.github/workflows/pages.yml)
and [site-check.yml](../.github/workflows/site-check.yml) — and their two extra
steps must stay equal.

**One fixture produces every page.** [fixture/](fixture/) is a real directory
with a real project-scope config: tracker value `github cli`, and the ticket
skills `grill-design` and `pre-mortem`. The render reads the config, so without
it the tracker block would print its notice-and-ask state and the Ticket skills
block would be empty. Every page states the fixture in prose, so a reader does
not take the GitHub tracker prose for universal. Reproduce any page with:

```sh
cd site/fixture && node ../../dist/bin.js skill wayfinder
```

**No byte changes.** The tinting in [src/lib/tint.ts](src/lib/tint.ts) only
decides which span a character sits in, and it asserts that at build time. The
copy control reads the text back out of the rows, so what it puts on the
clipboard is what the CLI printed — trailing newline included.
