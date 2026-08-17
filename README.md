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

For maintainers. Releases are changeset-driven. Distribution was decided in
[Distribution mechanics (#14)](https://github.com/will-ness-ai/wayfinder-cli/issues/14).

A change that reaches the package carries a changeset:

```sh
pnpm changeset
```

Merging it opens a *Version Packages* pull request. Merging that one publishes:
CI runs the checks, builds, publishes `wayfinder-cli` to npm through trusted
publishing with provenance (no stored npm token), tags the commit, creates the
GitHub Release from the changelog entry, then bumps the Homebrew tap formula to
the new tarball URL and checksum.

Nobody types a version. A pull request that changes only `site/`, `docs/`, or
`.github/` carries no changeset and triggers no release.

[docs/release-system.md](docs/release-system.md) holds the rules: what the
public API is, which change earns which bump, how prereleases work, and how to
roll one back. The steps are the [`cut-a-release`](.claude/skills/cut-a-release/SKILL.md)
skill.

CI is the only publisher. The bootstrap publish that first created the package
on npm has run, and trusted publishing is enabled.

The tap formula wraps the published npm tarball (`depends_on "node"` plus
`std_npm_args`), so it always installs exactly what CI published. The release
workflow updates the tap with a fine-grained token scoped to the tap repo only.
The tap is a second channel, not a gate on the first: with
`HOMEBREW_TAP_TOKEN` absent, the bump reports the gap in the job summary and
the npm release still succeeds.

The docs site deploys on every push to `main`, through a separate workflow.
[site/README.md](site/README.md) holds its conventions.
