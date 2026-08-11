# Build tooling

The foundation ticket ([#35](https://github.com/will-ness-ai/wayfinder-cli/issues/35)) had to settle the package manager, the bundler, the test runner, and the TOON encoder. The v1 spec left each one open as a build-time choice ([spec, Further Notes](../spec/wayfinder-cli-v1.md#further-notes)). The choices, and why:

| Concern | Choice | Why |
|---|---|---|
| Package manager | **pnpm** | The lane's verification runs `pnpm typecheck`, `pnpm lint`, `pnpm test`. The lockfile is committed for reproducible installs. |
| Build | **`tsc`** (no bundler) | The CLI ships its `content/` tree as files read from disk at runtime, so nothing needs bundling. `tsc` emits ESM to `dist/` with declarations and source maps, and honours "no runtime TypeScript loader" from spec §1. `tsconfig.build.json` builds `src/`; `tsconfig.json` typechecks `src/` and `test/`. |
| Test runner | **Vitest** | Native ESM, and first-class snapshot support. The render is long prose whose exact wording is the deliverable, so committed snapshots are the right tool (spec, Testing Decisions). |
| Linter | **ESLint** + typescript-eslint | Flat config, `recommended` rule sets. Not named by the spec, but a green `pnpm lint` is a lane requirement. |
| TOON encoder | **`@toon-format/toon`** | The reference encoder for the format. List and status commands print TOON by default; the encoder handles nested rows and empty arrays out of the box. |

## The test seam

One seam, fixed by the spec: the CLI entry point `run(argv, env)` in `src/cli.ts`. It never touches `process`; it takes an argv array plus a `CliEnv` naming the home directory, the working directory, the TTY state, and the environment variables, and returns `{ stdout, stderr, exitCode }`. The real entry point `src/bin.ts` builds a `CliEnv` from `process` and hands it in.

Two fixtures sit on the seam. `test/fixtures/runCli.ts` drives a command with a neutral default environment and returns its bytes for snapshotting. `test/fixtures/tempDir.ts` supplies a throwaway directory tree for the file-writing commands that later tickets add.
