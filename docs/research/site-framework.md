# Site framework: which one reproduces the locked design

Research for the map ticket [Choose the site framework](https://github.com/will-ness-ai/wayfinder-cli/issues/47), on the map [Wayfinder map: docs site — wayfinder-cli on GitHub Pages](https://github.com/will-ness-ai/wayfinder-cli/issues/45).

Survey date: **2026-08-10**. All external claims come from primary sources: official documentation, the framework repositories, and the npm registry. Each load-bearing claim gives its source. Claims that no primary source confirms are marked **unverified**.

The design is locked in [docs/prototypes/docs-site/README.md](../prototypes/docs-site/README.md). The framework must reproduce it. A framework theme never overrules a verdict in that file.

## Summary

- **Recommendation: Astro, with no theme.** It ships no CSS, and a layout owns the full `<html>` element, so the locked prototype transfers without a fight. It is TypeScript-native and ESM-only, which matches this repo exactly. It has a first-party GitHub Pages action.
- **Runner-up: Eleventy.** It matches the design constraint just as well. It loses on repo fit: TypeScript data files are undocumented, and Markdown and HTML pass through Liquid before output, which puts the "changes no byte" verdict at risk.
- **Reject Astro Starlight.** Two locked verdicts cannot be honoured at all. The work to erase the theme is larger than the work to build the site.
- **Reject the VitePress default theme.** The locked grid is not reachable through `themeConfig`, so that path is a CSS override war. A fully custom VitePress theme does work, but it adds a Vue layer and an alpha-versus-stable documentation split.
- **Reject a plain Vite build.** Vite has no templating, no layouts, and no includes. Fifteen pages means fifteen copies of the shell, or a generator you write first. That generator is a static site generator.
- **Two local facts changed the judgement.** The build needs no subprocess, and the stdout is unsafe in a template language. Both are measured below.

## The two local facts

### 1. The build imports the CLI. It does not run a subprocess

The ticket asks which framework "runs a Node CLI at build time and captures stdout". The CLI makes that question smaller than it looks.

`src/cli.ts` exposes one seam: `run(argv, env)` returns `{ stdout, stderr, exitCode }`, and it never touches `process` ([src/env.ts](../../src/env.ts)). A build script imports `run` and calls it with a fixture `CliEnv`. There is no `execSync`, no PATH lookup, and no global install.

Measured on this branch, against a fixture directory holding `.wayfinder/config.json` with `tracker.value: "github cli"` and two registered ticket skills:

| Skill id | Lines | Bytes |
|---|---:|---:|
| wayfinder | 204 | 16,572 |
| to-tickets | 100 | 5,328 |
| grill-with-docs | 83 | 3,901 |
| domain-modeling | 75 | 3,240 |
| to-spec | 70 | 2,846 |
| tracker | 53 | 3,482 |
| prototype | 27 | 2,765 |
| grilling | 8 | 651 |
| research | 8 | 519 |
| **Total** | **628** | **39,304** |

All nine ids exit 0. The `github cli` tracker block appears. Both registered ticket skills appear.

The whole site is 15 pages and 39 KB of generated content. Every candidate that runs Node at build time can do this, so this criterion separates the candidates very little. It does reward a framework that reads TypeScript, because the import carries the CLI's own types.

### 2. The stdout is unsafe in a template language

The locked design says a skill page holds the bytes of `wayfinder skill <id>`, and that the tinting "changes no byte". A count of the characters that a template language, a Markdown pipeline, or a Vue compiler consumes:

| Skill id | `<` | `{` | ` ``` ` fences |
|---|---:|---:|---:|
| wayfinder | 43 | 8 | 4 |
| tracker | 33 | 8 | 0 |
| to-tickets | 11 | 0 | 0 |
| to-spec | 7 | 0 | 0 |
| prototype | 3 | 0 | 0 |
| grill-with-docs | 0 | 0 | 4 |
| domain-modeling | 0 | 0 | 4 |

No render holds `{{` or `{%` today, so the Liquid and Nunjucks risk is latent, not live. The `<` and `{` counts are live. The longest run of backticks at the start of a line is 3, so a Markdown fence around this content needs four backticks.

The safe design is the same for every candidate: **never send the stdout through Markdown or a template language.** Capture it at build time, escape it, and emit your own markup.

The prototype already holds that code. [prototype.html](../prototypes/docs-site/prototype.html) carries `esc()` (line 830), `renderMarkdown()` (line 842), `tintedRows()` (line 987), and `applyTheme()` (line 1036). The escaping, the line-number gutter, the Markdown tinting, and the three-state theme toggle are written. They port to any candidate.

This cancels two arguments the frameworks make for themselves. VitePress generates line-number markup and Shiki tinting for free, but this site does not want them — it wants the tinting the design locked. Eleventy leaves the line-number gutter to you, but the gutter already exists.

## Comparison

"Fights the design" measures work you must undo before you build. "Repo fit" measures TypeScript, ESM, Node >= 22, and pnpm.

| Candidate | Fights the design | Build-time CLI capture | Base path | Repo fit | Verdict |
|---|---|---|---|---|---|
| **Astro, no theme** | Nothing. Zero CSS; a layout owns `<html>` | Content loader or route frontmatter, in Node, TypeScript-native | `base` + first-party action; internal links need a manual prefix | Exact: Node >= 22.12.0, ESM, TypeScript built in | **Recommend** |
| Eleventy | Nothing. No theme, no CSS, no client JS | `_data/*.js` ESM, in Node | `pathPrefix` + `HtmlBasePlugin`, HTML output only | Good, but TypeScript data files undocumented | Runner-up |
| VitePress, custom theme | Core stamps `.dark` until `appearance: false` | Data loaders and dynamic routes, in Node | `base`, plus `withBase` for every built URL | ESM and TypeScript good; adds Vue | Third |
| VitePress, default theme | ~28 KB of layout CSS plus the Inter web font | Same | Same | Same | Reject |
| Astro Starlight | ~14 of 28 components replaced; 2 verdicts impossible | Blocked from the docs collection | Same as Astro | Pre-1.0, 29 extra deps | Reject |
| Plain Vite | Nothing to fight, and nothing to build with | A custom plugin, in Node | `base` does not rewrite `<a href>` | Good | Reject |

## Astro, no theme — recommended

**Design.** Astro ships no default stylesheet and no reset. CSS enters only through your own scoped, global, or imported styles (<https://docs.astro.build/en/guides/styling/>). A layout component owns the whole document: the docs' example layout writes `<html>`, `<head>`, and `<body>` by hand (<https://docs.astro.build/en/basics/layouts/>). Astro writes no class and no attribute to `<html>`. So the three-column grid, the 1100px and 860px breakpoints, the 46px strip, the hairline route nav, and the three-state theme are your CSS, unopposed.

**Build-time capture.** Astro pre-renders pages in Node at build time by default (<https://docs.astro.build/en/basics/rendering-modes/>). Two documented homes for the capture:

- The Content Loader API. `load()` is "called at build time to fetch data and update the data store", and its context supplies `store`, `parseData`, and a `watcher` for dev re-runs (<https://docs.astro.build/en/reference/content-loader-reference/>).
- A dynamic route `src/pages/skill/[id].astro` with `getStaticPaths`, which runs the import in the component script.

For nine pages the dynamic route is smaller. Either way the script calls `run(['skill', id], fixtureEnv)` directly.

**Base path.** Set `site: 'https://will-ness-ai.github.io'` and `base: '/wayfinder-cli'`. The deploy guide states the rule and gives the same shape (<https://docs.astro.build/en/guides/deploy/github/>). One documented chore: "all of your internal page links must be prefixed with your `base` value". Files in `public/` serve at `/` whatever the base, but imported assets get the prefix automatically (<https://docs.astro.build/en/reference/configuration-reference/#base>).

**Deployment.** Astro maintains an official action, and calls it the recommended path (<https://docs.astro.build/en/guides/deploy/github/>, <https://github.com/withastro/action>). The documented workflow uses `actions/checkout@v7`, `withastro/action@v6`, then `actions/deploy-pages@v5`, with `permissions: contents: read / pages: write / id-token: write`. The action detects pnpm from the committed lockfile. Its `node-version` input defaults to **24**, so pin it to 22.

**Repo fit.** `engines.node: ">=22.12.0"`, and odd-numbered Node versions are unsupported (<https://docs.astro.build/en/install-and-setup/>). The package is `"type": "module"`. TypeScript is built in, including an `astro.config.ts` (<https://docs.astro.build/en/guides/typescript/>). pnpm is a documented install path.

**Cost.** Navigation is a 15-entry data module plus one component, about 60 to 110 lines. The theme toggle is your palette CSS plus an inline pre-paint script, about 25 to 40 lines — and the prototype already holds the logic. The capture is 20 to 60 lines. Nothing must be undone.

**Risks, stated plainly.**

- **Version churn.** Astro shipped three majors in about 19 months: 5.0.0 on 2024-12-03, 6.0.0 on 2026-03-10, 7.0.0 on 2026-06-22. Current is 7.2.0, published 2026-08-06 (<https://registry.npmjs.org/astro>). Pin the major. A 15-page site is cheap to move.
- **Weight.** 52 direct dependencies, 2.96 MB unpacked (<https://registry.npmjs.org/astro>). This is a devDependency of a site that ships nothing: `package.json` publishes only `dist` and `content`.
- **Manual base prefixes.** Put one `href()` helper beside the nav data and route every internal link through it.
- **Escaping is unverified.** No primary source was checked in this survey for how Astro escapes `{expression}` output in a template. The build ticket confirms this first, against the 43 `<` characters in the wayfinder render.

## Astro Starlight — reject

Starlight is a full theme: a reset, about 7.6 KB of layout and colour tokens, about 9 KB of prose styles, and per-component CSS in cascade layers (<https://github.com/withastro/starlight/blob/main/packages/starlight/components/Page.astro>). Its override surface is real and well documented — 28 named components, slot reuse, route middleware (<https://starlight.astro.build/guides/overriding-components/>). The locked design needs about 14 of those 28 replaced.

Three conflicts decide it, and two cannot be won:

1. **The shell is nested flexbox, not a grid.** `TwoColumnContent` renders its right column only when `starlightRoute.toc` is set, so the third column is a table of contents by design (<https://github.com/withastro/starlight/blob/main/packages/starlight/components/TwoColumnContent.astro>).
2. **The breakpoints are literals, not tokens** — `50em` and `72em` — and two of them sit in `Page.astro`, which is **not** in the overridable schema (<https://github.com/withastro/starlight/blob/main/packages/starlight/schemas/components.ts>). Verdict 4 asks for 1100px and 860px. **Impossible.**
3. **`Page.astro` server-renders `<html data-theme="dark">`**, and `ThemeProvider` always stamps `data-theme`. The locked rule `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` becomes dead code, and a light-preferring visitor with no JavaScript gets dark. Starlight's own helper also resolves "no preference" to dark; the locked design resolves it to light. **Impossible.**

Starlight also blocks the clean data path: `docsLoader()` globs only `src/content/docs/`, so the nine CLI-output pages must move to `src/pages/` with manual sidebar entries (<https://github.com/withastro/starlight/blob/main/packages/starlight/loaders.ts>, <https://starlight.astro.build/guides/pages/>).

What it gives back is search, which the map puts out of scope. Starlight earns its keep when you adopt its look, not when you must erase it.

## Eleventy — runner-up

**Design.** Eleventy supplies no theme and no CSS, and gives "full control over your project's output" with "zero client-side JavaScript by default" (<https://www.11ty.dev/>). A layout is a file you write, and the docs' example is a hand-written document (<https://www.11ty.dev/docs/layouts/>). Nothing writes to `<html>`, so the three-state theme has no competitor. *(No page states "Eleventy ships no CSS" in those words — **unverified** as a direct quotation, but it follows from the above.)*

**Build-time capture.** `_data/*.js` files export a value, a function, or an async function; the docs say "we use `await` on the return value" (<https://www.11ty.dev/docs/data-js/>). Pagination with `size: 1` emits the nine pages (<https://www.11ty.dev/docs/pagination/>). Whether a data file is re-executed or memoized per build is **not documented** (<https://www.11ty.dev/docs/watch-serve/>).

**Base path.** `pathPrefix` plus `HtmlBasePlugin`. The plugin's `extensions` option defaults to `"html"`, so it rewrites HTML output only — CSS `url()` is untouched (<https://www.11ty.dev/docs/plugins/html-base/>). The deployment page points at a sample workflow held in a different repository (<https://www.11ty.dev/docs/deployment/>).

**Why it is second, not first.** Two repo-fit gaps:

- **TypeScript.** The config runs as TypeScript only through `--config=eleventy.config.ts` with Node type stripping, or through `tsx` (<https://www.11ty.dev/docs/languages/typescript/>). TypeScript **data files are not documented at all** — `addDataExtension` takes file contents as a string, which suits YAML and JSON, not modules. The practical answer is `_data/*.js`. This repo is TypeScript throughout, and the capture wants the CLI's types.
- **Liquid pre-processing.** Markdown files are "by default pre-processed as Liquid templates", and HTML files likewise (<https://www.11ty.dev/docs/languages/markdown/>, <https://www.11ty.dev/docs/languages/>). Against a verdict that says the page changes no byte, a default that reads `{{` and `{%` out of the content is a standing hazard. It is controllable per template, but it must be remembered on every page.

Eleventy is stable where Astro churns: 3.1.6 shipped 2026-06-02, `engines.node: ">=18"`, 33 small server-side dependencies (<https://registry.npmjs.org/@11ty/eleventy/latest>). **Pick Eleventy instead if dependency weight and version stability outrank the TypeScript fit.**

## VitePress — third

The default-theme path is rejected outright. The theme imports nine stylesheets plus Inter — `vars.css` is 17 KB, `fonts.css` 15 KB, `base.css` 5.5 KB (<https://github.com/vuejs/vitepress/blob/main/src/client/theme-default/without-fonts.ts>) — and `themeConfig` options "only apply to the default theme" (<https://vitepress.dev/reference/default-theme-config>). The locked grid is not reachable there, so that path is the override war the ticket forbids.

The fully custom theme path works. `.vitepress/theme/index.ts` default-exports `{ Layout }`, and only `Layout` is required (<https://vitepress.dev/guide/custom-theme>). The client runtime entry imports no CSS, so a custom theme loads none *(source-verified, not doc-stated: <https://github.com/vuejs/vitepress/blob/main/src/client/app/index.ts>)*.

Two things hold it back:

- **Core stamps the root element.** `src/node/config.ts` injects a script that adds a `.dark` class unless `appearance: false` is set; core also adds a `mac` class unconditionally (<https://github.com/vuejs/vitepress/blob/main/src/node/config.ts>, semantics at <https://vitepress.dev/reference/site-config>). `appearance: false` is a clean documented switch, but it is a thing to switch off.
- **Version posture.** vitepress.dev now documents **2.0.0-alpha.19**, published 2026-08-02, and gives the install as `vitepress@next` with Node 22+. The npm `latest` tag is still **1.6.4** from 2025-08-05, whose docs say Node 18+ (<https://registry.npmjs.org/-/package/vitepress/dist-tags>). You either adopt an alpha or work against documentation that no longer describes the stable release.

It also adds a Vue layer: the theme is SFCs that must stay SSR-compatible, and every runtime-built URL passes through `withBase` (<https://vitepress.dev/guide/asset-handling>).

## Plain Vite — reject

Vite documents a multi-page app as one HTML entry per page in the `input` map. It supplies **no templating, no layouts, no partials, no includes, and no Markdown**. The only HTML substitution is `%CONST_NAME%` env replacement, and the docs state Vite "is intentionally unopinionated about complex replacements like conditionals", pointing at userland plugins or a `transformIndexHtml` hook.

So 15 pages means 15 copies of the shell, or a generator you write first: roughly 150 to 350 lines plus maintenance. That generator is a static site generator, and four already exist in this survey.

Two further notes:

- **`base` does not rewrite `<a href>`.** Confirmed against `packages/vite/src/node/assetSource.ts` at v8.2.1, where the `a` element is absent from `DEFAULT_HTML_ASSET_SOURCES`. Assets in JS, CSS `url()`, and HTML asset attributes are rewritten; hand-written links and `public/` are not.
- **Version note.** Current stable Vite is **8.2.1**, published 2026-08-06; 8.0.0 shipped 2026-03-12. Vite 8 replaced Rollup with Rolldown, so `build.rollupOptions` is documented as deprecated and aliases `build.rolldownOptions`. The MPA docs now use a top-level `input` map. `engines.node` is `^20.19.0 || >=22.12.0`.

Its one genuine strength: dark mode costs nothing, because there is no framework to fight. Every candidate except Starlight and default-theme VitePress shares that.

## What the build ticket inherits

[Build the site shell and the Pages pipeline](https://github.com/will-ness-ai/wayfinder-cli/issues/48) starts from these:

1. **GitHub Pages is not enabled on this repo.** `GET /repos/{owner}/{repo}/pages` returns 404 as of the survey date. Set Settings → Pages → Source to "GitHub Actions" before the first deploy.
2. **Pin Node to 22** in the deploy workflow. The Astro action defaults to 24.
3. **Commit `pnpm-lock.yaml`** so the action detects pnpm. It already is committed.
4. **The release workflow does not change.** Pages deployment is a separate workflow on push to `main`.
5. **The fixture config** is a directory holding `.wayfinder/config.json` with `tracker.value: "github cli"` and example `ticketSkills` entries. Pass its path as both `home` and `cwd` in the `CliEnv`. Every skill page states the fixture that produced it.
6. **Confirm the escaping first.** Verify how the chosen framework escapes an expression, against the 43 `<` characters in the wayfinder render, before any page is styled.
7. **The action versions in GitHub's own docs lag reality.** docs.github.com shows `configure-pages@v5`, `upload-pages-artifact@v4`, and `deploy-pages@v4`, while the current majors are v6, v5, and v5. Read the version from the action repositories.

## Method and limits

- Three parallel surveys, one per candidate group, merged here. Every external claim was taken from official documentation, the framework source, or the npm registry, and carries its URL.
- The local measurements were run on this branch: `pnpm build`, then a throwaway script importing `run` from `dist/cli.js` against a fixture directory. The render sizes and the character counts are output of that script, not estimates.
- **Not tested:** no candidate was scaffolded, and no page was built. Every cost figure is a line-count estimate read from the documentation, not a measurement.
- **Not weighed:** site search, which the map puts out of scope.
- **Unverified and named above:** Astro's expression escaping; whether Eleventy re-executes a data file per build; whether `.nojekyll` is needed on the Actions artifact path; transitive install weight for any candidate; whether VitePress can keep `appearance: true` and a `data-theme` scheme together.
