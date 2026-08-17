# Release system: what this repo should adopt at one maintainer

Survey date: **2026-08-16**. All external claims come from primary sources: the Semantic Versioning specification, npm's own documentation, GitHub's own documentation, and each release tool's own repository. Every load-bearing claim gives its source. Claims that no primary source confirms are marked **unverified**.

The settled parts of the pipeline are constraints here, not questions. [docs/decisions/release-pipeline.md](../decisions/release-pipeline.md) records them: tag-driven releases, CI as the only publisher, trusted publishing with provenance, `gh release create --generate-notes`, and an automatic Homebrew tap bump. This document takes all five as given.

## Summary

- **Keep the manual flow.** `npm version <bump>` plus `git push --follow-tags` costs two commands per release. No tool surveyed here costs less, and each one costs more elsewhere. Reject release-please, changesets, and semantic-release. Reasons in §3.
- **Declare the public API in prose, in the README.** SemVer obliges this before it obliges anything else, and this repo has not done it. The public API is the command surface, the rendered skill text, and the config file schema. The `run(argv, env)` seam is **not** in it, and prose is the only cheap way to say so.
- **Set the content rule: a reword is a patch, a new instruction is a minor, a renamed served id or a dropped CLI pointer is a major.** The skill text is the product, so it needs a stated rule, not an assumption.
- **Stay on `0.x` until the command surface stops moving, then declare `1.0.0`.** One unreleased commit on `main` today changes what bare `wayfinder` prints. Clause 4 makes that free now. After `1.0.0` it is a major. Ship the surface changes first, then declare.
- **Skip `CHANGELOG.md`. Skip Conventional Commits.** Both duplicate work the generated notes already do at this scale. Add `.github/release.yml` instead: about 12 lines, and it removes the research and prototype pull requests from the notes.
- **Release on demand.** A merged pull request that changes `src/`, `content/`, `README.md`, or `package.json` triggers a release. Four of the five unreleased commits on `main` change only `site/`, and they need no release at all. No primary source prescribes a cadence for a project this size — that claim is **unverified** everywhere it is made.
- **Five real gaps, in order of size.** (1) No workflow runs `pnpm test`, `pnpm lint`, or `pnpm typecheck`, so a red test suite cannot stop a publish. (2) Nothing verifies the published tarball. (3) A prerelease version would silently take the `latest` dist-tag. (4) No written rollback. (5) No `SECURITY.md`, so "which versions get fixes" has no answer.

## Against the recorded decision

- **Agrees** with every credential and channel choice in [docs/decisions/release-pipeline.md](../decisions/release-pipeline.md), and with the tag-driven trigger. The registry confirms the design works: `wayfinder-cli@0.1.1` carries a SLSA provenance attestation and a `trustedPublisher` record naming GitHub OIDC (`npm view wayfinder-cli@0.1.1 --json`, run 2026-08-16).
- **Adds** what the decision does not cover: a public-API declaration, a bump rule for the skill text, a test gate before the publish, a tarball check after it, a dist-tag rule, and a rollback.
- **Changes** one claim. The decision calls `packaging/homebrew/wayfinder-cli.rb` "the canonical formula". `scripts/bump-tap.sh` rewrites only the clone of the tap repo, so the in-repo file still reads `0.1.0` with a zeroed `sha256`. Either the script must also rewrite the in-repo file, or the word "canonical" must go.

## What the pipeline does today

Measured on this branch on the survey date.

| Fact | Value |
|---|---|
| Published versions | `0.1.0`, `0.1.1`. `latest` → `0.1.1` |
| Git tags | `v0.1.1` only. The bootstrap publish left no tag |
| Commits since `v0.1.1` | 5. One changes `src/`; four change only `site/` |
| Tarball | 72 files, 58.2 kB packed, 185.4 kB unpacked |
| Workflows | `Release` (tag), `Pages` (push to `main`), `Site check` (pull request) |
| Workflows that run the test suite | **None** |
| `exports` field in `package.json` | None |

The three workflows do not collide. `Release` fires on `v*` tags. `Pages` and `Site check` never touch the npm package, and `site/` is a separate pnpm project that the `files` field excludes. A release changes nothing about the site, and a site deploy changes nothing about the package.

## 1. Versioning

### What SemVer obliges first

Clause 1 comes before the bump rules: "Software using Semantic Versioning MUST declare a public API. This API could be declared in the code itself or exist strictly in documentation. However it is done, it SHOULD be precise and comprehensive" (<https://semver.org/spec/v2.0.0.html>).

This repo has not declared one. Until it does, no bump rule can be applied, because there is nothing to apply it against. The clause also gives the cheap route: a declaration in documentation is enough.

The bump rules then read: MAJOR "if any backward incompatible changes are introduced to the public API" (clause 8), MINOR "if new, backward compatible functionality is introduced to the public API" (clause 7), PATCH "if only backward compatible bug fixes are introduced" (clause 6).

### What the public API is here

Four candidate surfaces ship in the tarball. The proposed declaration:

| Surface | In the public API? | Why |
|---|---|---|
| Command surface — commands, flags, exit codes, and the TOON and JSON payload shapes | **Yes** | A human and an agent both type these. The site documents every one |
| Rendered skill text — the bytes of `wayfinder skill <id>`, including every served id | **Yes** | This is the product. An agent reads it and acts on it |
| Config file schema — `tracker.value`, `tracker.doc`, `ticketSkills`, and the three scopes | **Yes** | A project commits these files. A schema change breaks a committed file |
| `dist/**` module exports, including `run(argv, env)` | **No** | One consumer, in this repo. See below |

### The `run(argv, env)` seam

`package.json` has no `exports` field, and `npm pack --dry-run` shows the tarball ships every `dist/*.js` and `dist/*.d.ts`. So any consumer can write `import { run } from 'wayfinder-cli/dist/cli.js'` today, with types. The seam is public by default, whether or not anyone wants it.

`site/src/lib/renders.ts` is the only consumer, and `site/package.json` links the CLI with `link:..`. The site imports through the package specifier on purpose: the file records that Vite inlines a linked package on a static import, and an inlined CLI resolves `content/` to the wrong directory and fails every render.

So an `exports` field that hid `dist/` would break the site build. An `exports` field that listed `./dist/cli.js` would keep the site building, but it would publish the seam as a supported entry point — the opposite of the intent.

**Verdict: declare the seam internal in the README, and add no `exports` field.** Clause 1 accepts a documentation-only declaration, so this is compliant, not a shortcut. Record the residual risk: a consumer who imports `dist/` gets no SemVer promise, and nothing in the package stops them.

### The bump rule for skill text

The skill text is prose that an agent acts on. It has no compiler, so "backward incompatible" needs a stated meaning. The proposed rule:

- **Patch** — a reword that keeps the same instruction. A typo fix. A clearer sentence. A tracker doc correction that names the same command.
- **Minor** — a new instruction, a new section, a new served id, a new registered skill row, a new tracker value with its own tracker doc. This is clause 7: new, backward compatible functionality.
- **Major** — a renamed or removed served id, a removed CLI pointer that a ticket-carried pointer names, a removed or renamed config key, a changed `--json` payload shape. Each one breaks a caller that works today, which is clause 8.

The rename of the frontend prototyping skill to `grill-design` (pull request #55) is the worked example. It changed a served id, so under this rule it is a major. It shipped under `0.x`, where clause 4 makes it free.

The snapshot suite makes the rule cheap to apply. `test/__snapshots__/skill.test.ts.snap` holds the bytes of every render, so a content edit shows its own diff before the release. Read the diff, then pick the bump.

### Leaving `0.x`

Clause 4: "Major version zero (0.y.z) is for initial development. Anything MAY change at any time. The public API SHOULD NOT be considered stable." Clause 5: "Version 1.0.0 defines the public API."

The FAQ gives the test: "If your software is being used in production, it should probably already be 1.0.0. If you have a stable API on which users have come to depend, you should be 1.0.0" (<https://semver.org/spec/v2.0.0.html>).

Two conditions are not met yet:

1. **No public API is declared.** Clause 5 says `1.0.0` defines it. There is nothing to define.
2. **The surface is still moving.** Commit `5de7045` on `main` makes bare `wayfinder` render the wayfinder skill. That changes what an existing caller gets. Under `1.x` it is a major.

**Verdict: ship the pending surface changes as `0.1.2` or `0.2.0`, add the public-API declaration, then declare `1.0.0`.** Do not declare `1.0.0` with the declaration still missing.

Two smaller spec facts, both settled: the FAQ says to release `0.1.0` first and increment the minor for each `0.x` release, which this repo already does. And "'v1.2.3' is not a semantic version. However, prefixing a semantic version with a 'v' is a common way (in English) to indicate it is a version number" — so the `v*` tag names are a convention, and the version inside `package.json` is the version.

## 2. Patch notes

### What `--generate-notes` actually produced

The best evidence is this repo's own release. `gh api repos/.../releases/tags/v0.1.1` returns a body with three parts:

1. `## What's Changed` — one bullet per merged pull request, in the form `<PR title> by @<author> in <PR URL>`. 28 bullets.
2. `## New Contributors` — one bullet per first-time contributor.
3. `**Full Changelog**` — a link.

Three facts follow from that body, and each one is a direct observation:

- **It uses pull request titles, not commit messages.** Every bullet matches a PR title.
- **It ignores direct commits.** `8011e20` ("0.1.1", the `npm version` commit) and `c3262e5` ("Initial commit") were pushed straight to `main`. Neither appears.
- **It scopes to the previous release, and there was none.** The v0.1.1 notes list every pull request the repository has ever merged, and the Full Changelog link points at `.../commits/v0.1.1` rather than a compare view. The bootstrap publish of `0.1.0` left no tag and no release, so the range had no start. The next release will not have this problem.

The REST endpoint behind the flag describes itself as generating a body that contains "information like the changes since last release and users who contributed" (<https://docs.github.com/en/rest/releases/releases>). `gh release create --generate-notes` is documented as "Automatically generate title and notes for the release via GitHub Release Notes API", and `--notes-start-tag` as "Tag to use as the starting point for generating release notes" (<https://cli.github.com/manual/gh_release_create>).

### What it needs from the repo

The GitHub docs state the whole contract: "Automatically generated release notes include a list of merged pull requests, a list of contributors to the release, and a link to a full changelog" (<https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes>).

So the notes need exactly two things from the repo: **pull request titles a user can read**, and **labels on the pull requests** if you want categories or exclusions. This repo already writes good PR titles. It does not label pull requests — the `wayfinder:<type>` labels sit on tickets, which are issues.

The optional config file is `.github/release.yml` or `.github/release.yaml`, and it is read from that path unless another is named (<https://docs.github.com/en/rest/releases/releases>). Its schema, per the same GitHub docs page:

| Field | Meaning |
|---|---|
| `changelog.exclude.labels` | "A list of labels that exclude a pull request from appearing in release notes." |
| `changelog.exclude.authors` | "A list of user or bot login handles whose pull requests are to be excluded from release notes." |
| `changelog.categories[*].title` | **Required.** "The title of a category of changes in release notes." |
| `changelog.categories[*].labels` | **Required.** Labels that qualify a pull request for this category. `*` is the catch-all |
| `changelog.categories[*].exclude.labels` | Excludes a pull request from that one category |
| `changelog.categories[*].exclude.authors` | Excludes an author from that one category |

The docs state no limit on the number of categories or labels — **unverified** whether a limit exists.

### Keep a Changelog — reject the file, keep one idea

Its criticism of commit logs is real: "Using commit log diffs as changelogs is a bad idea: they're full of noise. Things like merge commits, commits with obscure titles, documentation changes, etc." (<https://keepachangelog.com/en/1.1.0/>).

That criticism only half lands here. The generated notes are pull request titles, not commit diffs, so the merge-commit noise is already gone. The observed v0.1.1 body proves it. What survives is the other half: documentation changes. 22 of the 28 bullets are research, prototype, spec, and site work that no installer of the CLI cares about.

The remedy is `.github/release.yml`, not a second file. A hand-kept `CHANGELOG.md` at one maintainer costs an edit on every pull request and a merge conflict whenever two branches touch it, and it restates what the release page already holds. Keep a Changelog's own six change types (Added, Changed, Deprecated, Removed, Fixed, Security) are worth reusing as **category titles** in `.github/release.yml`, where they cost nothing to maintain.

One idea from it is worth taking whole: the `[YANKED]` marker for a pulled release. It maps onto the rollback in §5.

**Verdict: no `CHANGELOG.md`.** Revisit if the package ever gains a second maintainer or an external contributor, because the file's real value is telling other people what changed.

### Conventional Commits — reject, unless a tool arrives

The specification is clear and cheap to follow: commits are prefixed with a type, "`fix` type commits should be translated to `PATCH` releases. `feat` type commits should be translated to `MINOR` releases. Commits with `BREAKING CHANGE` in the commits, regardless of type, should be translated to `MAJOR` releases" (<https://www.conventionalcommits.org/en/v1.0.0/>). A `!` before the colon marks a breaking change.

Its own FAQ says the convention needs no tooling, and that a non-conforming commit is not fatal: "It simply means that commit will be missed by tools that are based on the spec."

That last sentence is the verdict. The value is tool-shaped. This repo runs no tool that reads commit types, and §3 rejects all three candidates. Adopting the convention would change every PR title from a readable sentence ("Give each tracker value its own cheatsheet row") into a typed one, and buy nothing.

There is also a fit problem. The type set does not describe this product. A reworded skill is neither a `feat` nor a `fix`, and the mapping would push content edits into the wrong bump.

**Verdict: reject.** Adopt it only together with release-please or semantic-release, never on its own.

## 3. Release flow

### Staying manual

Cost per release: `npm version <bump>` and `git push --follow-tags`. npm's documentation confirms what the first command does: it writes the new version back to `package.json`, and "If run in a git repo, it will also create a version commit and tag". It runs `preversion`, `version`, and `postversion` around the bump, and it accepts `major`, `minor`, `patch`, `premajor`, `preminor`, `prepatch`, `prerelease`, and `from-git` (<https://docs.npmjs.com/cli/v11/commands/npm-version>).

The flow already works with trusted publishing, with provenance, with the tap bump, and with `--generate-notes`. It is the only candidate that needs no change to any of them.

Its weakness is real and small: the maintainer chooses the bump. For a package whose value is prose, that is a feature, not a defect — no tool can read a skill diff and know whether the wording changed the instruction.

### release-please — reject

It "automates CHANGELOG generation, the creation of GitHub releases, and version bumps for your projects", and it keeps a Release PR open: "These Release PRs are kept up-to-date as additional work is merged. When you're ready to tag a release, simply merge the release PR" (<https://github.com/googleapis/release-please>).

Three facts decide it:

1. **It does not publish.** "It does not handle publication to package managers or handle complex branch management." The publish step stays ours, gated on `steps.release.outputs.release_created` (<https://github.com/googleapis/release-please-action>). So it replaces the version bump only.
2. **It requires Conventional Commits.** "Release Please assumes you are using Conventional Commit messages." §2 rejects that convention for this repo.
3. **It would silently break the tag trigger.** release-please creates the tag from inside a workflow. GitHub's documentation states that "events triggered by the GITHUB_TOKEN will not create a new workflow run", with only `workflow_dispatch` and `repository_dispatch` excepted (<https://docs.github.com/en/actions/concepts/security/github_token>). The current `Release` workflow fires on `push: tags: v*`. With the default token it would never run again. The fixes are a personal access token, a GitHub App token, or moving the whole publish into the release-please workflow. All three rewrite the pipeline that already works.

It also wants `release-please-config.json` and `.release-please-manifest.json`, and `contents: write`, `issues: write`, `pull-requests: write`.

Its payoff is a Release PR that accumulates changes while you keep merging. That pays when a maintainer cannot remember what has landed. Five unreleased commits, four of them site-only, is not that situation.

### changesets — reject

The per-change artifact is a file: developers run the CLI, which writes "a markdown file with YAML front matter" under `.changeset/`, holding the bump type and the description (<https://github.com/changesets/changesets>).

It handles trusted publishing well. The action's permissions block lists `contents: write`, `pull-requests: write`, and `id-token: write` "if using trusted publishing", and the README recommends the individual sub-actions "to tighten publish permissions" (<https://github.com/changesets/action>). Its outputs — `published`, `published-packages`, `has-changesets`, `pr-number` — could gate a following tap-bump step.

It fails on fit, not on capability. Changesets "has a focus on solving these problems for monorepos, keeping packages that rely on each other up to date, as well as making it easy to make changes to groups of packages". This is one package. The whole coordination problem it solves does not exist here. What remains is a markdown file written per pull request, by the same person who wrote the pull request title, saying the same thing.

### semantic-release — reject, but it is the only near miss

It is the only candidate that could replace the entire pipeline. It "automates the whole package release workflow including: determining the next version number, generating the release notes, and publishing the package" (<https://github.com/semantic-release/semantic-release>).

It fits the constraints better than the other two:

- **Trusted publishing works.** The npm plugin documents `id-token: write` for GitHub Actions and recommends trusted publishing over tokens, and it generates provenance attestations under that mode (<https://github.com/semantic-release/npm>).
- **The tap bump has a home.** `@semantic-release/exec` runs a shell command on the `success` step, which is exactly what `scripts/bump-tap.sh` needs.
- **dist-tags are built in.** Its `addChannel` step "Add a release to a dist-tag."

Two things reject it:

1. **The version decision moves to the commit log.** It reads Conventional Commits by default. §2 shows the type set does not describe a content change, so the mapping would be wrong on the most common kind of release this repo makes.
2. **It releases on every qualifying push to the default branch.** That is its whole model. §4 wants the opposite.

**If the flow is ever automated, pick this one.** It is the only tool that keeps the pipeline whole rather than splitting it.

### Comparison

Maintainer cost is per change, not per release.

| Candidate | Maintainer cost | Trusted publishing + provenance | Drives the tap | Drives the site | Verdict |
|---|---|---|---|---|---|
| **Manual `npm version`** | Two commands, at release time only | Works today, proven on the registry | Yes, unchanged | Untouched, deploys from `main` | **Keep** |
| release-please | Typed commit messages, every commit | Publish stays ours, so yes — but the tag trigger breaks | Only through a gated step | Untouched | Reject |
| changesets | A markdown file, every pull request | Yes, `id-token: write` documented | Only through a gated step | Untouched | Reject |
| semantic-release | Typed commit messages, every commit | Yes, documented and recommended | Yes, `@semantic-release/exec` | Untouched | Reject, revisit first |

No candidate drives the docs site, and none needs to. `Pages` deploys from `main` on every push, so the site is already current before any tag exists.

## 4. Cadence

**No primary source prescribes a cadence for a project of this size.** The SemVer specification is silent on it. Keep a Changelog is silent on it. npm's documentation is silent on it. Any claim that a small project should release weekly, or monthly, or per merge, is **unverified**.

What the primary sources do settle is what a release must be, not when. SemVer's FAQ answers the "won't I reach 42.0.0" worry with "This is a question of responsible development and foresight" — a statement about care, not about frequency.

So the cadence has to come from the repository's own shape. Two measured facts decide it:

- **Most merges do not change the package.** Of the five commits since `v0.1.1`, one touches `src/`. Four touch only `site/`, and the `files` field excludes `site/` from the tarball. A scheduled release would publish four identical tarballs.
- **A release costs two commands and about two minutes of CI.** There is no batching pressure to relieve.

**Verdict: on demand, and the trigger is content, not time.** A release is due when a merged pull request changes any of:

- `src/**` — the command surface.
- `content/**` — the rendered skill text, the tracker docs, or a served id.
- `package.json` — dependencies, `engines`, `bin`, or `files`.
- `README.md` — npm always ships the README, so a README edit changes what npmjs.com displays.

A pull request that changes only `site/`, `docs/`, or `.github/workflows/pages.yml` needs no release. It reaches the reader through the Pages deploy instead.

Batching is allowed and often right: four content edits in one week are one minor release, not four. The rule is that the batch closes when someone needs the change, not on a date.

## 5. What the pipeline is missing

Ordered by size. Each item names a primary source that treats the practice as standard.

### 5.1 No test runs before a publish — the largest gap

`.github/workflows/release.yml` runs `pnpm install`, `pnpm build`, then `npm publish`. No workflow in the repository runs `pnpm test`, `pnpm lint`, or `pnpm typecheck`. `Site check` runs on pull requests, but it runs `astro check` against `site/`, and the root ESLint config ignores `site/**`.

So the seven snapshot suites that hold the bytes of every render can be red, and the release still publishes. For a package whose product is that exact text, this is the wrong failure to leave open.

This one is not a "standard practice" citation. It is a local finding, and it does not need a source.

### 5.2 No release verification

Nothing installs the published tarball and runs it. npm supplies both halves of the check: `npm pack`, which writes the tarball "to the current working directory as `<name>-<version>.tgz`", and `npm publish --dry-run`, which "Indicates that you don't want npm to make any changes and that it should only report what it would have done" (<https://docs.npmjs.com/cli/v11/commands/npm-pack>, <https://docs.npmjs.com/cli/v11/commands/npm-publish>).

Consumers can verify what CI produced with `npm audit signatures`, which npm documents as the way to check "verified registry signatures" and "verified attestations" (<https://docs.npmjs.com/generating-provenance-statements>). CI should run the same check on itself.

The Homebrew formula already holds the right smoke test — `assert_match version.to_s, shell_output("#{bin}/wayfinder --version")` — but it runs only on `brew test`, after the release.

### 5.3 dist-tags and prerelease channels

Only `latest` exists today (`npm view wayfinder-cli dist-tags`). npm's rule is explicit: "the `latest` tag is used by npm to identify the current version of a package, and `npm install <pkg>` (without any `@<version>` or `@<tag>` specifier) installs the `latest` tag", and "Publishing a package sets the `latest` tag to the published version unless the `--tag` option is used" (<https://docs.npmjs.com/cli/v11/commands/npm-dist-tag>).

The current workflow hardcodes `npm publish --provenance --access public` with no `--tag`. So `npm version prerelease --preid rc` followed by a tag push would publish `1.0.0-rc.0` **to `latest`**, and every plain `npm install wayfinder-cli` would get the release candidate. The workflow has no defence against this.

npm also warns that "Tags that can be interpreted as valid semver ranges will be rejected", and recommends tags that do not begin with a number or the letter `v`. So `next` is a safe channel name.

A prerelease channel is worth having exactly once: on the run-up to `1.0.0`.

### 5.4 No rollback, and no `npm deprecate`

npm's unpublish policy is narrow. "For newly created packages, as long as no other packages in the npm Public Registry depend on your package, you can unpublish anytime within the first 72 hours after publishing" (<https://docs.npmjs.com/policies/unpublish>). After that window a package may be unpublished only if nothing depends on it, it had fewer than 300 downloads in the last week, and it has a single owner. The same page states the permanence rule: "Once `package@version` has been used, you can never use it again."

npm recommends deprecation instead: it "allows the package to be downloaded but publishes a clear warning message (that you get to write) every time the package is downloaded, and on the package's npmjs.com page". The command "will update the npm registry entry for a package, providing a deprecation warning to all who attempt to install it", and an empty string as the message reverses it (<https://docs.npmjs.com/cli/v11/commands/npm-deprecate>). Deprecation does not remove the version.

(The `npm-unpublish` command page states a 24-hour lock on republishing after a whole package is unpublished, and does not restate the 72-hour rule. Treat the policy page as authoritative and the difference as **unverified**.)

On the GitHub side, a release can be edited or deleted, but "with immutable releases enabled, you can only edit the title and notes after publishing" (<https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository>). `gh release view` exposes an `isImmutable` field, so the setting is live on this repository type.

The correct rollback is therefore: publish forward, deprecate backward, never unpublish.

### 5.5 No security policy or supported-versions statement

The repository holds no `SECURITY.md`. GitHub's guidance is to "add information about supported versions of your project and how to report a vulnerability" (<https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository>).

At one maintainer the honest answer is short: only the newest version is supported. Writing that down costs ten lines and stops the question.

### 5.6 Two smaller findings

- **The `--provenance` flag is now redundant, and harmless.** npm states that "When you publish using trusted publishing from GitHub Actions or GitLab CI/CD, npm automatically generates and publishes provenance attestations for your package. This happens by default" (<https://docs.npmjs.com/trusted-publishers>). Keep the flag: it documents the intent, and it protects the publish if the trusted-publisher configuration is ever lost.
- **The trusted-publishing floor is versioned.** npm documents "npm CLI version 11.5.1 or later and Node version 22.14.0 or higher". The workflow pins Node 22 and runs `npm install --global npm@latest`, so both hold today. A pinned older npm would break the publish silently.
- **The claim that a package must exist before trusted publishing can be configured is UNVERIFIED.** [docs/decisions/release-pipeline.md](../decisions/release-pipeline.md) and the [v1 spec §11](../spec/wayfinder-cli-v1.md#11-distribution-and-release) both state it. The current npm documentation does not. The bootstrap has already run, so nothing depends on the answer.

## Recommendation

### The flow, step by step

Unchanged from today, with one gate added in front and one check added behind.

1. Merge the work to `main`. The `Site check` workflow has already built `site/` on the pull request.
2. Decide whether a release is due: does the merge change `src/`, `content/`, `package.json`, or `README.md`? If not, stop. The Pages deploy has already shipped it.
3. Read `git diff v<last>..HEAD -- content/ src/` and the snapshot diff. Pick the bump with the §1 rule.
4. On `main`, run `npm version <major|minor|patch>`.
5. Run `git push --follow-tags`.
6. CI runs, in this order: install, **verify** (`pnpm lint`, `pnpm typecheck`, `pnpm test`), build, publish to npm, **smoke-check the published tarball**, create the GitHub Release, bump the tap.

For the `1.0.0` run-up only, steps 4 and 5 become `npm version prerelease --preid rc` and the same push. The workflow reads the version and publishes a prerelease to `next` instead of `latest`.

### The files that change

| File | Change |
|---|---|
| `.github/workflows/release.yml` | Add a verify step before `Build`: `pnpm lint`, `pnpm typecheck`, `pnpm test`. Derive the dist-tag from the version — publish `--tag next` when the version holds a `-`, and `--tag latest` otherwise. Add a smoke step after the publish: `npm pack`, install the tarball into a temporary directory, run `wayfinder --version`, and assert it equals the tag. Add `npm audit signatures` |
| `.github/workflows/release.yml` | Pass `--latest=false` to `gh release create` for a prerelease version, and add `--prerelease`. Both flags are documented on `gh release create` |
| `.github/release.yml` | **New, about 12 lines.** `changelog.exclude.labels` for `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, and `documentation`. Three categories, titled with Keep a Changelog's words: Added (`enhancement`), Fixed (`bug`), Changed (`*`) |
| `README.md` | **New section, "Public API".** Name the three public surfaces. State that `dist/**` module exports are internal and carry no SemVer promise. State the content bump rule in three lines |
| `README.md` | In "Releasing": add the release trigger from §4, and the rollback from §5.4 |
| `SECURITY.md` | **New, about 10 lines.** Only the newest published version is supported. Report through GitHub, not through a public issue |
| `scripts/bump-tap.sh` | Rewrite `packaging/homebrew/wayfinder-cli.rb` in this repository as well as the tap clone, so the word "canonical" stays true. Alternatively, delete the word from the decision record |
| `docs/decisions/release-pipeline.md` | Record the public-API declaration, the verify gate, the dist-tag rule, and the rollback |

### What must be done by hand, once

- **Label pull requests.** `.github/release.yml` reads labels from pull requests, and this repository labels issues. One label per pull request, at merge time. Without it the exclusions do nothing.
- **Decide the `1.0.0` moment.** Ship `5de7045` under `0.x` first. Then add the public-API declaration. Then bump to `1.0.0`.

### What to reject, and revisit when

- **`CHANGELOG.md`** — revisit when a second maintainer or an outside contributor arrives.
- **Conventional Commits** — revisit only together with a tool that reads them.
- **release-please and changesets** — revisit if this repository ever holds more than one published package.
- **semantic-release** — revisit if the release becomes a chore. It is the only tool that keeps this pipeline whole.

## Method and limits

- Three parallel surveys — SemVer and npm mechanics, release notes and changelog conventions, and the three release tools — merged here, then every decision-critical quote re-fetched directly from its source page.
- The local facts were measured on this branch on the survey date: `npm pack --dry-run`, `npm view wayfinder-cli`, `gh api` against the v0.1.1 release, `gh label list`, and `git log`. They are output, not estimates.
- **Not tested:** no candidate tool was installed, and no workflow change was run. Every cost figure for release-please, changesets, and semantic-release is read from their documentation.
- **Not weighed:** Homebrew core submission, which the v1 spec puts post-v1; and any registry other than npm.
- **Unverified and named above:** whether npm requires a package to exist before trusted publishing is configured; whether `.github/release.yml` limits the number of categories or labels; the difference between the npm unpublish policy page and the `npm-unpublish` command page; and every claim about a correct release cadence, which no primary source makes.
