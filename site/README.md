# site — the docs site

The docs site for wayfinder-cli. Astro, no theme. It deploys to GitHub Pages on
every push to `main`, through [`.github/workflows/pages.yml`](../.github/workflows/pages.yml).

The look is locked in [docs/prototypes/docs-site/README.md](../docs/prototypes/docs-site/README.md).
That file decides the design; a framework default never overrules a verdict in
it. The framework choice and its measurements are in
[docs/research/site-framework.md](../docs/research/site-framework.md).

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

## Escaping the CLI output

A rendered skill page holds the stdout of `wayfinder skill <id>`, and the
locked design says the page changes no byte. Measured on Astro 7.2.0: an
`{expression}` escapes `<`, `>`, `&`, `"`, and `'`, and it passes `{`, `}`, and
a backtick through as text. So a string in an expression is safe as it stands,
and it needs no `esc()` helper.

`set:html` writes the string raw. Build the line-number gutter and the markdown
tinting as Astro elements, so the escaping stays.
