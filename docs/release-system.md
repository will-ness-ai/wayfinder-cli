# The release system

Releases are **changeset-driven**. A pull request that changes the package carries a changeset. Merging it opens a *Version Packages* pull request. Merging that one publishes.

The version number, the changelog, the git tag, and the GitHub Release are all outputs of that flow. Nobody types a version.

This file holds the rules. Three other files hold the rest, and none is repeated here:

- [`.github/workflows/release.yml`](../.github/workflows/release.yml) — the jobs, in order.
- [docs/decisions/release-pipeline.md](decisions/release-pipeline.md) — why the credentials and the two channels are what they are.
- [docs/research/release-system.md](research/release-system.md) — the primary sources behind every rule below.

To cut a release, run the [`cut-a-release`](../.claude/skills/cut-a-release/SKILL.md) skill.

## The changeset is the patch note

```sh
pnpm changeset
```

The prompt asks for a bump and a summary, then writes a file under [`.changeset/`](../.changeset/README.md). Commit it with the change that earns it.

A pull request that changes only `site/`, `docs/`, or `.github/` needs no changeset. **No changeset means no release, and no line in the notes.** That is the whole filter: an installer reads only the changes that reached the package.

Write the summary for a person deciding whether to upgrade. Name the behaviour that changed, never the file.

## The public API

SemVer requires a declaration before any bump rule can apply. Three surfaces are public:

- **The command surface** — the commands, the flags, the exit codes, and the shape of the TOON and JSON payloads.
- **The rendered skill text** — the bytes of `wayfinder skill <id>`, and the set of served ids.
- **The config schema** — `tracker.value`, `tracker.doc`, `ticketSkills`, and the three scopes.

The module exports under `dist/` are **internal**. They carry no version promise. `run(argv, env)` is importable today, because the package declares no `exports` field, and `site/src/lib/renders.ts` imports it through the package specifier on purpose. That absence is deliberate: an `exports` field breaks the site build.

## The bump rule

The skill text is the product, and prose has no compiler. So the bump is a judgement. This is the rule the changeset prompt is asking you to apply.

| Bump | The change |
|---|---|
| **patch** | A reword that keeps the same instruction. A typo. A clearer sentence. A tracker doc that names the same command. |
| **minor** | A new instruction. A new section. A new served id. A new tracker value with its doc. A new command or flag. |
| **major** | A renamed or removed served id. A removed CLI pointer that a ticket-carried pointer names. A renamed or removed config key. A changed `--json` payload shape. |

`test/__snapshots__/skill.test.ts.snap` holds the bytes of every render, so the diff shows the change before you pick. Read the diff, then choose.

The package is on `0.x`, where SemVer makes a breaking change free. The rule still applies. It is what tells you the surface has stopped moving, and it is what `1.0.0` will promise.

## What CI checks

The `pack` job runs `pnpm lint`, `pnpm typecheck`, and `pnpm test` before it builds. A red snapshot suite stops the publish.

Run the same three before you open a pull request. CI is the backstop, not the first reader.

## Prereleases

Prerelease mode is a state in `.changeset/pre.json`, not a flag on one release:

```sh
pnpm changeset pre enter next   # every release is now 1.0.0-next.N, on the `next` dist-tag
pnpm changeset pre exit         # back to normal releases
```

The tag name is both the version suffix and the npm dist-tag, so `next` keeps a release candidate away from everyone running `npm install wayfinder-cli`. Enter prerelease mode for the run-up to `1.0.0`, and exit before the real one.

## Rollback

A published version is permanent. npm allows an unpublish only inside 72 hours of the publish, and only while no other package depends on this one. A used `package@version` can never be used again.

Publish forward, and deprecate backward:

```sh
npm deprecate wayfinder-cli@0.2.0 "Broken render. Use 0.2.1."
```

The message reaches everyone who installs that version. An empty message reverses it. Fix the fault, write a patch changeset, and release again.
