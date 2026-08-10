# wayfinder-cli

A CLI that serves the wayfinder planning skills to coding agents as rendered, configurable content — with ticket-skill registration and tracker-specific prose.

Status: planning. The effort is charted as a wayfinder map on this repo's issues. The locked v1 spec is [docs/spec/wayfinder-cli-v1.md](docs/spec/wayfinder-cli-v1.md).

Skill content is forked and adapted from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT).

## Releasing

Releases are tag-driven and on-demand: push a version tag, and CI does the rest. Decided in [Distribution mechanics (#14)](https://github.com/will-ness-ai/wayfinder-cli/issues/14).

To cut a release:

1. On `main`, run `npm version <major|minor|patch>`. This bumps `package.json` and creates the `v*` tag.
2. Push the commit and the tag: `git push --follow-tags`.
3. CI takes over on the `v*` tag: it builds, publishes `wayfinder-cli` to npm via trusted publishing with provenance (no stored npm token), creates the GitHub Release with generated notes, then bumps the Homebrew tap formula to the new tarball URL and checksum.

CI is the only publisher. The one manual publish is the bootstrap that first creates the package on npm; after that, trusted publishing is enabled on the package and every release goes through the tag flow above.

Distribution channels:

- **npm**: package `wayfinder-cli`, installs the `wayfinder` binary.
- **Homebrew**: personal tap — `brew install will-ness-ai/tap/wayfinder-cli`. The formula wraps the published npm tarball (`depends_on "node"` + `std_npm_args`), so it always installs exactly what CI published. The release workflow updates the tap with a fine-grained token scoped to the tap repo only.
