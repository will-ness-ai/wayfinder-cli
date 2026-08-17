# Release pipeline

[Ticket #38](https://github.com/will-ness-ai/wayfinder-cli/issues/38) built the
distribution described in the [v1 spec, §11](../spec/wayfinder-cli-v1.md#11-distribution-and-release).
The release reaches npm and Homebrew with nothing to remember.

This record holds the *why*. The rules — the public API, the bump rule, the
changeset, and the rollback — live in
[docs/release-system.md](../release-system.md), and the steps are the
[`cut-a-release`](../../.claude/skills/cut-a-release/SKILL.md) skill.

## Why the trigger changed

The original design was tag-driven: `npm version <bump>`, then
`git push --follow-tags`, with the pushed `v*` tag as the only trigger.
Changesets replaced it, decided in [#76](https://github.com/will-ness-ai/wayfinder-cli/pull/76).

Two problems drove the change. The generated release notes listed 28 pull
requests for v0.1.1, 22 of them research, prototype, and site work that no
installer sees; the documented fix, `.github/release.yml`, filters on pull
request labels this repo does not apply. And the maintainer chose the bump from
memory, at release time, long after the change was written.

A changeset fixes both at once. It is written with the change, by the person who
made it, and a pull request that touches no package file simply has none — so it
never reaches the notes, and no label is needed.

The tag survives as an *output*. `changesets/action/publish` creates it after npm
accepts the tarball. A `push: tags` trigger could not have survived: GitHub starts
no workflow run from an event a `GITHUB_TOKEN` created, so the publish has to
happen inside the same run.

## What CI does

[`.github/workflows/release.yml`](../../.github/workflows/release.yml) fires on
every push to the default branch, and splits into five jobs:

1. **select-mode** — reads `.changeset/` and picks `version` or `publish`.
2. **version** — opens or updates the *Version Packages* pull request, which
   bumps `package.json` and writes `CHANGELOG.md`.
3. **pack** — runs `pnpm lint`, `pnpm typecheck`, and `pnpm test`, then builds
   and packs the tarball. This is the gate the tag-driven pipeline never had: a
   red snapshot suite used to reach npm.
4. **publish** — uploads what `pack` produced, then creates the git tag and the
   GitHub Release from the changelog entry.
5. **tap** — [`scripts/bump-tap.sh`](../../scripts/bump-tap.sh) rewrites the tap
   formula's `url` and `sha256`, reading the version from what npm accepted.

The split is npm's recommended shape for trusted publishing: `id-token: write`
is granted to `publish` alone, so no other job can mint a registry credential.

## Credentials

- **npm: trusted publishing (OIDC), no stored token.** The `publish` job alone
  holds `id-token: write`; npm mints a short-lived credential from it and
  attaches a verifiable build attestation. `NPM_CONFIG_PROVENANCE` states that
  intent, and keeps the attestation if the trusted-publisher configuration is
  ever lost. No npm token lives on any laptop or in any repository secret. Node
  22 ships an older npm, so the job updates npm first, since trusted publishing
  needs a recent CLI.
- **The changelog generator is the built-in one, not `@changesets/changelog-github`.**
  The GitHub generator adds pull request links and author credit, and it needs a
  stored `GITHUB_TOKEN` with `read:user` and `repo:status`. At one maintainer,
  author credit is worth nothing and a second long-lived credential is worth
  less than nothing.
- **Homebrew tap: `HOMEBREW_TAP_TOKEN`.** A fine-grained token scoped to
  `will-ness-ai/homebrew-tap` with contents-write, and the pipeline's only
  long-lived credential. A silently lagging tap is the most likely failure in
  this design, so the bump runs in CI, never by hand.

## The Homebrew formula

[`packaging/homebrew/wayfinder-cli.rb`](../../packaging/homebrew/wayfinder-cli.rb)
is the seed formula: the file the tap was created from. The live formula is the
one in the tap, and [`scripts/bump-tap.sh`](../../scripts/bump-tap.sh) rewrites
that clone alone. So the seed keeps its `0.1.0` url and its zeroed `sha256`, and
it is never the version to read.

The formula wraps the published npm tarball (`depends_on "node"` +
`std_npm_args`), so npm stays the single source of truth and a release changes
exactly two lines — `url` and `sha256`. Homebrew core is a post-v1 concern:
core's notability audit fails a brand-new repo.

Install: `brew install will-ness-ai/tap/wayfinder-cli`.

## One-time bootstrap (human step)

npm requires a package to exist before trusted publishing can be configured, so
the very first publish is manual and claims the name:

1. From a clean checkout at the release version, `pnpm install && pnpm build`.
2. `npm publish --access public` with a maintainer's npm login.
3. On npmjs.com, configure trusted publishing for `wayfinder-cli` to trust this
   repository's `Release` workflow.

There is **no placeholder publish** — this first real publish claims the name.
Every publish after it goes through the tag flow above.
