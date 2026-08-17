---
name: cut-a-release
description: Cut a release of wayfinder-cli — check the pending changesets, merge the Version Packages pull request, and confirm npm, the GitHub Release, and the Homebrew tap all carry it.
disable-model-invocation: true
---

Releases are changeset-driven. Merging a changeset opens a *Version Packages* pull request; merging that one publishes. Nobody types a version.

So this skill has two jobs: make sure the pending changesets say the right thing, then drive the Version Packages pull request through and confirm all three channels. [docs/release-system.md](../../../docs/release-system.md) holds the rules each step applies.

## 1. Read what is pending

```sh
pnpm changeset status --verbose
```

It prints the next version and the changeset that earns it.

**No changesets pending** — nothing is waiting to release. Check whether that is right:

```sh
git diff --stat $(git describe --tags --abbrev=0)..HEAD -- src/ content/ package.json README.md
```

A change to any of those paths with no changeset is a missed changeset, not a finished release. Write one with `pnpm changeset`, open a pull request, and start again. If the diff is empty, report that there is nothing to release, and stop.

**Done when:** you can state the next version and every change it carries.

## 2. Check the bump and the wording

Read each pending changeset against the diff it describes:

```sh
git diff $(git describe --tags --abbrev=0)..HEAD -- src/ content/
git diff $(git describe --tags --abbrev=0)..HEAD -- test/__snapshots__/
```

The snapshot diff is the important one. It holds the exact bytes an agent will read after the release, so it decides patch against minor against major. Apply [the bump rule](../../../docs/release-system.md#the-bump-rule).

Each summary becomes a line in the changelog and in the GitHub Release. Read it as a person deciding whether to upgrade. A summary that names a file rather than a behaviour needs rewriting — edit the changeset file directly and commit.

**Done when:** every pending changeset carries the right bump, and a summary that reads as a patch note.

## 3. Merge the Version Packages pull request

```sh
gh-axi pr list
```

The `Release` workflow opens and maintains it. It bumps `package.json` and writes `CHANGELOG.md`. Read the changelog diff — it is the release notes, exactly as they will publish.

Tell the human the version and what it carries, and wait for their agreement. Merging publishes to npm, and a published version is permanent, so this is the last reversible moment.

```sh
gh-axi pr merge <n> --squash
```

**Done when:** the human agrees, and the pull request is merged.

## 4. Watch the publish

```sh
gh-axi run list
```

The merge starts a second `Release` run. It runs `select-mode`, then `pack` — which runs lint, typecheck, and tests before it builds — then `publish`, then `tap`.

A failure in `pack` means the release did not go out. Fix the fault on `main` and let the workflow run again; no version was consumed.

**Done when:** the run has concluded.

## 5. Confirm all three channels

```sh
npm view wayfinder-cli version
gh-axi release view v<version>
gh-axi api repos/will-ness-ai/homebrew-tap/commits --jq '.[0].commit.message'
```

Check each one:

- npm serves the new version on `latest`.
- The GitHub Release exists, and its notes are the changelog entry.
- The tap's newest commit names the new version.

An absent `HOMEBREW_TAP_TOKEN` leaves the release green and writes a notice to the job summary, so a lagging tap is a real result, not a failure. Report every channel, including one that lagged.

**Done when:** all three report the new version, or you have named the one that did not, and why.

## A bad version shipped

A published version is permanent. Publish forward, and deprecate backward — follow [Rollback](../../../docs/release-system.md#rollback).
