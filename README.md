# wayfinder-cli

**Your agent's planning skills, served.** Composed for your harness,
substituted for your issue tracker, and extended with the skills your team
registers.

`wayfinder` is a content server: it prints planning skills as rendered markdown
for a coding agent to read.

```sh
npm install -g wayfinder-cli
```

## Documentation

**[will-ness-ai.github.io/wayfinder-cli](https://will-ness-ai.github.io/wayfinder-cli/)**

The site holds the quickstart, every command and flag, the config scopes, the
tracker values, ticket-skill registration, a cheatsheet, and the rendered text
of every skill the CLI serves.

A Homebrew tap ships the same build:

```sh
brew install will-ness-ai/tap/wayfinder-cli
```

New to wayfinding? This CLI serves the method. It does not teach it. Start at
[aihero.dev/skills-wayfinder](https://www.aihero.dev/skills-wayfinder).

Skill content is forked and adapted from
[mattpocock/skills](https://github.com/mattpocock/skills) (MIT). See
[content/ATTRIBUTION.md](content/ATTRIBUTION.md).

## Releasing

For maintainers. Releases are tag-driven and on demand: push a version tag, and
CI does the rest. Decided in
[Distribution mechanics (#14)](https://github.com/will-ness-ai/wayfinder-cli/issues/14).

To cut a release:

1. On `main`, run `npm version <major|minor|patch>`. This bumps `package.json`
   and creates the `v*` tag.
2. Push the commit and the tag: `git push --follow-tags`.
3. CI takes over on the `v*` tag. It builds, publishes `wayfinder-cli` to npm
   through trusted publishing with provenance (no stored npm token), creates
   the GitHub Release with generated notes, then bumps the Homebrew tap formula
   to the new tarball URL and checksum.

CI is the only publisher. The bootstrap publish that first created the package
on npm has run, and trusted publishing is enabled, so every release from here
goes through the tag flow above.

The tap formula wraps the published npm tarball (`depends_on "node"` plus
`std_npm_args`), so it always installs exactly what CI published. The release
workflow updates the tap with a fine-grained token scoped to the tap repo only.
The tap is a second channel, not a gate on the first: with
`HOMEBREW_TAP_TOKEN` absent, the bump reports the gap in the job summary and
the npm release still succeeds.

The docs site deploys on every push to `main`, through a separate workflow.
[site/README.md](site/README.md) holds its conventions.
