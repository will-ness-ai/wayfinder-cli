# .changeset — one file per released change

A **changeset** is a markdown file that says which bump a change earns and what
to tell the reader. It is the patch note, written while the change is fresh.

```sh
pnpm changeset
```

The prompt asks for the bump and the summary, then writes a file here. Commit it
with the change.

The bump comes from the rule in
[docs/release-system.md](../docs/release-system.md#the-bump-rule). The summary is
read by a person deciding whether to upgrade, so name the behaviour that changed,
never the file that changed.

**A pull request that changes only `site/`, `docs/`, or `.github/` needs no
changeset.** No changeset means no release, and no line in the release notes.
That is how this directory keeps the notes free of work an installer never sees.

`changelog` is set to the built-in generator, so no token is needed to build the
notes. `@changesets/changelog-github` would add pull request links and author
credit, at the cost of a stored `GITHUB_TOKEN`.

CI reads this directory. See [docs/release-system.md](../docs/release-system.md).
