# Release pipeline

[Ticket #38](https://github.com/will-ness-ai/wayfinder-cli/issues/38) built the
distribution described in the [v1 spec, §11](../spec/wayfinder-cli-v1.md#11-distribution-and-release).
A maintainer bumps the version and pushes a tag; the release reaches npm and
Homebrew with nothing else to remember.

## Cutting a release

1. On the default branch, run `npm version <major|minor|patch>`. This bumps
   `package.json` and creates the `v*` tag.
2. `git push --follow-tags`. The pushed tag is the only trigger.

## What CI does

[`.github/workflows/release.yml`](../../.github/workflows/release.yml) fires on
the `v*` tag and runs the whole sequence in one job:

1. **Build** — `pnpm install --frozen-lockfile` then `pnpm build`.
2. **Publish to npm** — `npm publish --provenance --access public`.
3. **GitHub Release** — `gh release create <tag> --generate-notes`.
4. **Bump the tap** — [`scripts/bump-tap.sh`](../../scripts/bump-tap.sh)
   rewrites the tap formula's `url` and `sha256` to the just-published tarball.

## Credentials

- **npm: trusted publishing (OIDC), no stored token.** The `release` job holds
  `id-token: write`; npm mints a short-lived credential from it, and
  `--provenance` attaches a verifiable build attestation. No npm token lives on
  any laptop or in any repository secret. Node 22 ships an older npm, so the job
  updates npm first, since trusted publishing needs a recent CLI.
- **Homebrew tap: `HOMEBREW_TAP_TOKEN`.** A fine-grained token scoped to
  `will-ness-ai/homebrew-tap` with contents-write, and the pipeline's only
  long-lived credential. A silently lagging tap is the most likely failure in
  this design, so the bump runs in CI, never by hand.

## The Homebrew formula

[`packaging/homebrew/wayfinder-cli.rb`](../../packaging/homebrew/wayfinder-cli.rb)
is the canonical formula, mirrored into the tap. It wraps the published npm
tarball (`depends_on "node"` + `std_npm_args`), so npm stays the single source
of truth and a release changes exactly two lines — `url` and `sha256`. Homebrew
core is a post-v1 concern: core's notability audit fails a brand-new repo.

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
