# CLI name availability survey

Research for issue #3. Survey date: **2026-08-02**. This document merges two independent survey passes made the same day, both against primary sources (the registries' own APIs). Facts only; this document does not recommend a name. See "Method and limits" at the end.

`FREE` = the registry returned HTTP 404 for the exact name. `TAKEN` = HTTP 200 with an existing package/crate.

## Summary

- Twelve candidate names were checked: `wayfinder`, `wayfinder-cli`, `wayfind`, `wayfindr`, `wayfndr`, `way-finder`, `wayf`, `skill-wayfinder`, `waypoint`, `waymark`, `wayfare`, `portolan` — plus the npm scope `@wayfinder`.
- No candidate has a Homebrew core formula or cask. Homebrew is open for all twelve names.
- Fully free on npm + Homebrew + crates.io: **`wayf`**, **`wayfndr`**, **`skill-wayfinder`**, **`portolan`**.
- Free on npm but taken on crates.io: **`wayfinder-cli`**.
- Free on crates.io but taken on npm: **`wayfindr`**, **`way-finder`**, **`wayfare`**.
- Taken on both npm and crates.io: **`wayfinder`**, **`wayfind`**, **`waypoint`**, **`waymark`**.
- Biggest name-collision risks: `laravel/wayfinder` (1.8k-star first-party Laravel dev tool), Appvia Wayfinder (commercial Kubernetes platform whose CLI binary is `wf`), AR.IO WayFinder (npm CLI already named `@ar.io/wayfinder-cli`), HashiCorp Waypoint (archived OSS tool with a live commercial successor), and the actively developed `wayfind` Rust router crate (~6k recent downloads).

## Availability table

Homebrew column covers both core formulae and casks. GitHub column lists prominent same-name collisions, not literal availability (repo names are org-scoped).

| Name | npm | Homebrew | crates.io | GitHub collisions (top) |
|---|---|---|---|---|
| `wayfinder` | Taken (A* graph search lib, 2017, ~432 dl/wk) | Free | Taken (HTTP router gen, 2019, 14 recent dl) | High: `laravel/wayfinder` 1,783 stars; org `wayfinder` registered 2010 |
| `wayfinder-cli` | **Free** | Free | Taken (Pathfinder-2e TTRPG tool, active 2026, binary `wf`) | Low: nothing above 6 stars |
| `wayfind` | Taken (AI-dev decision-trail tool, active 2026, 29 dl/wk) | Free | Taken (active Rust router, 5,972 recent dl) | Low: org `wayfind` exists; no prominent exact-name repo |
| `wayfindr` | Taken (0.0.0 placeholder, 2026, 2 dl/wk) | Free | **Free** | Low: nonprofit demo app, 27 stars |
| `wayfndr` | **Free** | Free | **Free** | Low: only a near-empty hobby repo |
| `way-finder` | Taken (dormant Node router, 2017, 2 dl/wk) | Free | **Free** | Low: no prominent exact-name repo |
| `wayf` | **Free** | Free | **Free** | Low: none; see WAYF.dk confusion note |
| `skill-wayfinder` | **Free** | Free | **Free** | Low: no exact-name repo |
| `waypoint` | Taken (dormant router, 2012, ~120 dl/wk) | Free | Taken (Farcaster sync tool, 2025) | High: `imakewebthings/waypoints` 10,311 stars; `hashicorp/waypoint` 4,721 stars |
| `waymark` | Taken (React router, active 2026, 8 dl/wk) | Free | Taken (navmesh pathfinding, 2026) | Medium: FFXIV plugins ~196/145 stars; `waymarkedtrails` 125 stars |
| `wayfare` | Taken (small project, 2025, 13 dl/wk) | Free | **Free** | Low-medium: near-name `choojs/wayfarer` 326 stars |
| `portolan` | **Free** | Free | **Free** | Low: `portolan-sdi/portolan-cli` 12 stars |
| `@wayfinder` (npm scope) | No published packages under the scope; scope ownership unverified | n/a | n/a | GitHub org `wayfinder` is taken (analogous namespace) |

## Per-name detail

### wayfinder

- npm: taken. Package `wayfinder`, "Generic graph search using A* or Dijkstra." Latest 0.1.5 published 2017-08-03 (dormant; the registry document's `modified` timestamp is 2022-06-28, but that is not a publish). 432 downloads last week. Sources: <https://registry.npmjs.org/wayfinder>, <https://api.npmjs.org/downloads/point/last-week/wayfinder>.
- Homebrew: free. Both endpoints return 404: <https://formulae.brew.sh/api/formula/wayfinder.json>, <https://formulae.brew.sh/api/cask/wayfinder.json>.
- crates.io: taken. Crate `wayfinder`, "A little HTTP router generator." Newest 0.2.1, updated 2019-12-18 (dormant). 4,403 total downloads, 14 recent. Source: <https://crates.io/api/v1/crates/wayfinder>.
- GitHub collisions: high. `laravel/wayfinder`, 1,783 stars — a first-party Laravel package that generates TypeScript route/controller definitions; it ships in Laravel starter kits, so the name is prominent in the developer-tools space. The historic GitHub org `wayfinder` (Wayfinder OSS, mapping software, registered 2010) holds the exact org name. Also `asdecided/WayfinderRouter` (404 stars, CLI for routing queries between LLMs) and `error311/wayfinder.nvim` (120 stars, Neovim code-exploration plugin). Sources: <https://github.com/laravel/wayfinder>, <https://laravel.com/blog/laravel-wayfinder-end-to-end-type-safety-for-php-and-typescript>, <https://github.com/wayfinder>, GitHub repo search for "wayfinder" sorted by stars.
- Commercial products with this name: Appvia Wayfinder, AR.IO WayFinder, and the video game "Wayfinder" (registered USPTO trademark, game software). See the collision and trademark sections.
- Ecosystem adjacency: npm search for "wayfinder" already shows 2026-era companion tools that describe themselves as operating on "wayfinder maps" / wayfinder workflows (for example `@mingrath/wfdash`, `pi-wayfinder-guard`, `@wyattjoh/wayfinder-pi`), so the plain term is in live use in this project's own niche. Source: <https://registry.npmjs.org/-/v1/search?text=wayfinder&size=15>.

### wayfinder-cli

- npm: **free** (HTTP 404). Source: <https://registry.npmjs.org/wayfinder-cli>.
- Homebrew: free (404 on formula and cask). Sources: <https://formulae.brew.sh/api/formula/wayfinder-cli.json>, <https://formulae.brew.sh/api/cask/wayfinder-cli.json>.
- crates.io: taken. Crate `wayfinder-cli`, "wf: a terminal tool for searching and browsing Pathfinder 2e / Starfinder 2e data from Archives of Nethys." Created 2026-07-10, newest 0.1.1 updated 2026-07-30 (active). 33 downloads total. Note: this crate installs a binary named `wf`, the same binary name Appvia Wayfinder uses. Source: <https://crates.io/api/v1/crates/wayfinder-cli>.
- GitHub collisions: low. Top search results are all 6 stars or fewer (the wayfinder-cli repo itself appears in the results). A GitHub Action exists to install the *Appvia* Wayfinder CLI: <https://github.com/gcolman/install-wayfinder-cli-action>. Source: GitHub repo search for "wayfinder-cli" sorted by stars.

### wayfind

- npm: taken and very active. Package `wayfind`, "Team decision trail for AI-assisted development." 72 versions, created 2026-03, latest 2.0.81 published 2026-04-20. 29 downloads last week. Direct conceptual overlap with this project's space (AI-assisted development tooling). Sources: <https://registry.npmjs.org/wayfind>, <https://api.npmjs.org/downloads/point/last-week/wayfind>.
- Homebrew: free (404 on formula and cask). Sources: <https://formulae.brew.sh/api/formula/wayfind.json>, <https://formulae.brew.sh/api/cask/wayfind.json>.
- crates.io: taken. Crate `wayfind`, "A speedy, flexible router." Newest 1.1.0, updated 2026-08-01 (very active). 22,978 total downloads, 5,972 recent. Crate repo: <https://github.com/SwornSystems/wayfind>. Source: <https://crates.io/api/v1/crates/wayfind>.
- GitHub collisions: low for the exact name. Org `wayfind` exists (<https://github.com/wayfind>); no prominent repo has the exact name `wayfind`. Source: GitHub repo search for "wayfind" sorted by stars.

### wayfindr

- npm: taken, but by a placeholder. Package `wayfindr`, version 0.0.0, description is boilerplate ("To install dependencies:"), published 2026-05-29. 2 downloads last week. Sources: <https://registry.npmjs.org/wayfindr>, <https://api.npmjs.org/downloads/point/last-week/wayfindr>.
- Homebrew: free (404 on formula and cask). Sources: <https://formulae.brew.sh/api/formula/wayfindr.json>, <https://formulae.brew.sh/api/cask/wayfindr.json>.
- crates.io: **free** (HTTP 404). Source: <https://crates.io/api/v1/crates/wayfindr>.
- GitHub collisions: low. Top result `wayfindrltd/wayfindr-demo-ios` has 27 stars. Source: GitHub repo search for "wayfindr" sorted by stars.
- Name conflict outside code registries: "Wayfindr" is a London-based nonprofit (joint venture of the Royal Society for Blind Children and ustwo) that maintains an ITU-adopted open standard for accessible audio navigation. The name is strongly associated with that organization. Sources: <https://www.wayfindr.net/about-wayfindr>, <https://www.wayfindr.net/open-standard>.

### wayfndr

- npm: **free** (HTTP 404). Source: <https://registry.npmjs.org/wayfndr>.
- Homebrew: free (404 on formula and cask). Source: <https://formulae.brew.sh/api/formula/wayfndr.json>.
- crates.io: **free** (HTTP 404). Source: <https://crates.io/api/v1/crates/wayfndr>.
- GitHub collisions: none of note — only a near-empty `WayfndrAI` hobby repo. Source: GitHub repo search for "wayfndr" sorted by stars.

### way-finder

- npm: taken. Package `way-finder`, "A light-weight, unopinionated router for Node." Latest 0.1.0 published 2017-08-29 (dormant). 2 downloads last week. Sources: <https://registry.npmjs.org/way-finder>, <https://api.npmjs.org/downloads/point/last-week/way-finder>.
- Homebrew: free (404 on formula and cask). Sources: <https://formulae.brew.sh/api/formula/way-finder.json>, <https://formulae.brew.sh/api/cask/way-finder.json>.
- crates.io: **free** (HTTP 404). Source: <https://crates.io/api/v1/crates/way-finder>.
- GitHub collisions: low. Search results for "way-finder" match unrelated Wayback-Machine tools; no prominent exact-name repo. Source: GitHub repo search for "way-finder" sorted by stars.

### wayf

- npm: **free** (HTTP 404). Source: <https://registry.npmjs.org/wayf>.
- Homebrew: free (404 on formula and cask). Source: <https://formulae.brew.sh/api/formula/wayf.json>.
- crates.io: **free** (HTTP 404). Source: <https://crates.io/api/v1/crates/wayf>.
- GitHub collisions: no prominent exact-name repo.
- Naming-confusion note: **WAYF** ("Where Are You From") is an established Danish identity-federation service. Source: <https://wayf.dk/en>.

### skill-wayfinder

- npm: **free** (HTTP 404). Source: <https://registry.npmjs.org/skill-wayfinder>.
- Homebrew: free (404 on formula and cask). Source: <https://formulae.brew.sh/api/formula/skill-wayfinder.json>.
- crates.io: **free** (HTTP 404). Source: <https://crates.io/api/v1/crates/skill-wayfinder>.
- GitHub collisions: no repo with that exact name; nearby names exist (`wayfinder-openclaw-skill`, `laravel-wayfinder-skill`). Source: GitHub repo search for "skill-wayfinder" sorted by stars.

### waypoint

- npm: taken. Package `waypoint`, "Waypoint provides browser and server side routing." Latest 0.2.8 published 2012-02-09 (dormant). 120 downloads last week. Sources: <https://registry.npmjs.org/waypoint>, <https://api.npmjs.org/downloads/point/last-week/waypoint>.
- Homebrew: free in core (404 on formula and cask). Sources: <https://formulae.brew.sh/api/formula/waypoint.json>, <https://formulae.brew.sh/api/cask/waypoint.json>.
- crates.io: taken. Crate `waypoint`, "a Farcaster synchronization tool built in Rust." Newest 2025.12.1, updated 2025-12-12. 4,533 total downloads. Source: <https://crates.io/api/v1/crates/waypoint>.
- GitHub collisions: high. `imakewebthings/waypoints` 10,311 stars (scroll library), `hashicorp/waypoint` 4,721 stars (build/deploy tool, repository archived 2024-01-08), `civiccc/react-waypoint` 4,042 stars. Sources: GitHub repo search for "waypoint" sorted by stars; <https://github.com/hashicorp/waypoint>.
- Commercial conflict: HashiCorp discontinued the open-source Waypoint but continues a commercial successor, HCP Waypoint. The name remains an active HashiCorp product name in the developer-tools space. Source: <https://www.hashicorp.com/en/blog/a-new-vision-for-hcp-waypoint>.

### waymark

- npm: taken. Package `waymark`, "Type-safe React router that just works." Latest 0.6.2 published 2026-02-05 (active, new). 8 downloads last week. Sources: <https://registry.npmjs.org/waymark>, <https://api.npmjs.org/downloads/point/last-week/waymark>.
- Homebrew: free (404 on formula and cask). Sources: <https://formulae.brew.sh/api/formula/waymark.json>, <https://formulae.brew.sh/api/cask/waymark.json>.
- crates.io: taken. Crate `waymark`, "Pathfinding and spatial queries on navigation meshes." 0.1.0, created 2026-02-23. 530 total downloads, 385 recent. Source: <https://crates.io/api/v1/crates/waymark>.
- GitHub collisions: medium. Top exact-theme results are Final Fantasy XIV "waymark" plugins (196 and 145 stars), `waymarkedtrails/waymarked-trails-site` (125 stars), and a WordPress mapping plugin `OpenGIS/waymark-wp` (28 stars). No single dominant developer tool. Source: GitHub repo search for "waymark" sorted by stars.

### wayfare

- npm: taken. Package `wayfare`, latest 0.2.0 published 2025-08-10, small project (13 downloads last week; description field contains raw HTML). Sources: <https://registry.npmjs.org/wayfare>, <https://api.npmjs.org/downloads/point/last-week/wayfare>.
- Homebrew: free (404 on formula and cask). Sources: <https://formulae.brew.sh/api/formula/wayfare.json>, <https://formulae.brew.sh/api/cask/wayfare.json>.
- crates.io: **free** (HTTP 404). Source: <https://crates.io/api/v1/crates/wayfare>.
- GitHub collisions: low to medium. Exact name: `iwoplaza/wayfare` 19 stars. Near-name: `choojs/wayfarer` 326 stars (trie-based router) and `stronnag/wayfarer` 137 stars. Source: GitHub repo search for "wayfare" sorted by stars.

### portolan

- npm: **free** (HTTP 404). Source: <https://registry.npmjs.org/portolan>.
- Homebrew: free (404 on formula and cask). Sources: <https://formulae.brew.sh/api/formula/portolan.json>, <https://formulae.brew.sh/api/cask/portolan.json>.
- crates.io: **free** (HTTP 404). Source: <https://crates.io/api/v1/crates/portolan>.
- GitHub collisions: low. Top result `portolan-sdi/portolan-cli` (12 stars) is itself a CLI, for cloud-native geospatial data; also `arosales/portolan` (8 stars, Helm chart visualization) and `fitnr/portolan` (6 stars, compass-point converter). All small. Source: GitHub repo search for "portolan" sorted by stars.
- Note: "portolan" is a generic historical term (portolan charts, medieval nautical maps), which lowers trademark risk but is less obvious to type/spell than the "way\*" names.

### @wayfinder (npm scope)

- No published packages under the scope — registry search `scope:wayfinder` returns total 0. Source: <https://registry.npmjs.org/-/v1/search?text=scope:wayfinder&size=10>.
- **Ownership of the scope name is unverified**: the registry user endpoint returns 401 for every account (including known-existing ones), and npmjs.com returns 403 to non-browser clients, so anonymous confirmation of whether a user/org named `wayfinder` already holds the scope was not possible.
- GitHub org `wayfinder` is taken (not the same namespace, but the analogous name). Source: <https://github.com/wayfinder>.

## Collision notes: existing software called "Wayfinder"

The plain word is crowded. Checked 2026-08-02:

1. **Appvia Wayfinder** — a commercial self-service Kubernetes/cloud platform by Appvia Ltd, sold on AWS Marketplace and UK G-Cloud. Its official CLI is documented as "the Wayfinder CLI"; the binary is **`wf`**, installed via curl from their release bucket (not Homebrew core). This is the closest thing to an existing, commercially backed "Wayfinder CLI". Sources: <https://docs.appvia.io/wayfinder>, <https://docs.appvia.io/wayfinder/cli>.
2. **Laravel Wayfinder** — "Generate TypeScript representations of your Laravel actions and routes". Active and popular: `laravel/wayfinder` (~1.8k stars), Packagist `laravel/wayfinder` v0.1.20 (2026-05), npm `@laravel/vite-plugin-wayfinder`. Note: `@laravel/wayfinder` itself is 404 on npm — Laravel ships the npm side as a Vite plugin. Sources: <https://github.com/laravel/wayfinder>, <https://repo.packagist.org/p2/laravel/wayfinder.json>, <https://registry.npmjs.org/@laravel%2fvite-plugin-wayfinder>.
3. **AR.IO WayFinder** — a gateway-routing product with an npm CLI already named `@ar.io/wayfinder-cli` (v0.0.4, published 2026-01), plus `wayfinder-core` / `wayfinder-react`. Source: <https://registry.npmjs.org/@ar.io%2fwayfinder-cli>.
4. **`wayfinder-cli` crate** — brand-new (July 2026) and active TTRPG terminal tool on crates.io; also claims the **`wf`** binary name (same as Appvia). Source: <https://crates.io/api/v1/crates/wayfinder-cli>.
5. **Wayfinder (video game)** — Airship Syndicate's ARPG, on Steam and still actively promoted in 2026. Not developer tooling, but it dominates general web search for the bare word. Sources: <https://en.wikipedia.org/wiki/Wayfinder_(video_game)>, <https://store.steampowered.com/news/app/1171690/view/3653035411216123334>.
6. **Wayfinder OSS** — the historic GitHub org `wayfinder` (mapping software, registered 2010) holds the exact GitHub org name. Source: <https://github.com/wayfinder>.
7. **Ecosystem adjacency** — npm search for "wayfinder" already shows 2026-era companion tools that operate on "wayfinder maps" / wayfinder workflows (for example `@mingrath/wfdash`, `pi-wayfinder-guard`, `@wyattjoh/wayfinder-pi`), so the plain term is in live use in this project's own niche. Source: <https://registry.npmjs.org/-/v1/search?text=wayfinder&size=15>.

## Trademark risk (shallow check)

- **WAYFINDER (Airship Syndicate Entertainment Inc.)** — a registered USPTO trademark covering downloadable game software (the 2024 video game "Wayfinder"). Different goods class than developer tools, but it is a live registration on the exact word. Sources: <https://uspto.report/TM/88648494>, <https://en.wikipedia.org/wiki/Wayfinder_(video_game)>.
- **Appvia Wayfinder** — direct commercial use of "Wayfinder" for a developer-facing CLI product (see collision notes). Sources: <https://docs.appvia.io/wayfinder>, <https://docs.appvia.io/wayfinder/getting-started/architecture>.
- **Laravel Wayfinder** — not a trademark finding, but a prominent first-party Laravel developer tool with the same name; high confusion/discoverability risk in the dev-tools space. Source: <https://laravel.com/blog/laravel-wayfinder-end-to-end-type-safety-for-php-and-typescript>.
- **Wayfindr** — the exact string "Wayfindr" is the name of a UK nonprofit behind an ITU-adopted accessible-navigation standard. Sources: <https://www.wayfindr.net/about-wayfindr>, <https://www.wayfindr.net/open-standard>.
- **Waypoint** — active HashiCorp commercial product name (HCP Waypoint); the legacy open-source tool is archived but well known. High conflict risk in developer tooling. Source: <https://www.hashicorp.com/en/blog/a-new-vision-for-hcp-waypoint>.
- **WAYF** — established Danish identity-federation service with the exact string as its brand. Source: <https://wayf.dk/en>.
- This check is shallow. No full USPTO/EUIPO/UKIPO clearance search was performed. Only obvious, easily findable conflicts are listed. `wayfndr`, `skill-wayfinder`, `waymark`, `wayfare`, and `portolan` were not searched against trademark databases at all.

## Method and limits

- Survey date: 2026-08-02, two independent passes merged into this document. All availability claims are point-in-time; registries change daily and names can be squatted at any moment.
- npm: `GET https://registry.npmjs.org/<name>` (404 = free) plus `https://api.npmjs.org/downloads/point/last-week/<name>` for weekly downloads.
- Homebrew: `GET https://formulae.brew.sh/api/formula/<name>.json` and `GET https://formulae.brew.sh/api/cask/<name>.json` (404 = no core formula/cask). Third-party taps were not checked; anyone can name a formula anything in their own tap.
- crates.io: `GET https://crates.io/api/v1/crates/<name>` with a User-Agent header (404 = free).
- GitHub: `gh search repos` — checked for prominent collisions only, since repo names are org-scoped and literal availability is not the relevant question.
- Where the two passes disagreed, the claim was re-verified against the registry API before merging (npm `wayfinder`: last publish is 2017-08-03; the 2022-06-28 timestamp is the registry document's `modified` field, not a publish). The four fully-clean names (`wayf`, `wayfndr`, `skill-wayfinder`, `portolan`) were re-verified as 404 on npm, crates.io, and Homebrew at merge time.
- Trademark: general web search only for obvious conflicts. Not checked: USPTO/EUIPO/UKIPO databases directly (except one USPTO record surfaced by web search), PyPI, RubyGems, Go module paths, domain names, social handles.
- npm scope ownership (`@wayfinder`) could not be verified anonymously; see the scope section.
