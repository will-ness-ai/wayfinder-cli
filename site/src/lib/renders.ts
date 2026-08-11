/**
 * The skill renders, captured from the CLI at build time.
 *
 * The site imports the CLI's one seam — `run(argv, env)` from `src/cli.ts` —
 * rather than shelling out to the `wayfinder` binary. There is no PATH lookup,
 * no global install, and no subprocess. Measured in wayfinder ticket #47.
 *
 * Nothing here is committed. Every page regenerates from the CLI on every
 * build, so the site cannot drift from what the CLI prints.
 */
import type { CliEnv, CliResult } from 'wayfinder-cli/dist/env.js';

/**
 * The absolute path of `site/fixture/`, injected by `astro.config.ts`.
 *
 * Vite bundles this module into `dist/.prerender/`, so `import.meta.url` here
 * would name a build chunk rather than this file. The config is loaded from
 * its real location, so it is the one place that can resolve the path.
 */
declare const __FIXTURE_DIR__: string;

/** The CLI's one seam: argv in, bytes and an exit code out. */
type Run = (argv: string[], env: CliEnv) => Promise<CliResult>;

/**
 * The CLI is loaded at run time, through a specifier the bundler cannot read.
 *
 * `site/` links the CLI with `link:..`, and Vite treats a linked package as
 * source: a static import gets inlined into the build chunk. The CLI finds its
 * own `content/` tree with `import.meta.url`, so inlined it looks for the
 * skills under `dist/.prerender/` and every render fails. `ssr.external` does
 * not lift a linked package out, so the specifier is hidden instead.
 *
 * Node resolves it from the chunk's own directory, walking up to
 * `site/node_modules/wayfinder-cli` — the symlink to the repo root — and
 * follows it to the real path, where `../content` is the shipped tree.
 *
 * The type import above is erased at compile time, so it costs nothing here.
 */
const CLI_SEAM = 'wayfinder-cli/dist/cli.js';

let seam: Promise<Run> | undefined;

function cliRun(): Promise<Run> {
  seam ??= import(/* @vite-ignore */ CLI_SEAM).then((module) => module.run as Run);
  return seam;
}

/**
 * The fixture config every render on this site is produced with.
 *
 * The render reads the config, so an unconfigured capture would print the
 * tracker block's notice-and-ask state and an empty Ticket skills block —
 * neither of which shows what the CLI does. The fixture pins both.
 *
 * It is a real directory, `site/fixture/`, holding a real project-scope config.
 * A reader can reproduce any page byte for byte:
 *
 *     cd site/fixture && node ../../dist/bin.js skill wayfinder
 *
 * `home` and `cwd` both point at it, so the user scope resolves under the
 * fixture too and the machine running the build never leaks its own config in.
 * `env` is empty for the same reason: a real `XDG_CONFIG_HOME` would escape it.
 */
const env = { home: __FIXTURE_DIR__, cwd: __FIXTURE_DIR__, isTTY: false, env: {} };

/** The tracker value in the fixture. Every skill page states it. */
export const FIXTURE_TRACKER = 'github cli';

/** The ticket skills registered in the fixture. Every skill page names them. */
export const FIXTURE_TICKET_SKILLS = ['grill-design', 'pre-mortem'];

/** One served id and its captured stdout. */
export interface SkillRender {
  /** The served id, for example `prototype` or `prototype/ui`. */
  id: string;
  /** The id that discloses this one, when it is a supporting file. */
  parent?: string;
  /** The supporting files this render discloses. Empty for most ids. */
  children: string[];
  /** The command that produced the text, without the `$`. */
  command: string;
  /** The verbatim stdout, with the single trailing newline dropped. */
  text: string;
}

interface Listing {
  skills: { id: string; description: string; children: string[] }[];
}

/** Run one command through the seam, or throw with what the CLI said. */
async function capture(argv: string[]): Promise<string> {
  const run = await cliRun();
  const result = await run(argv, env);
  if (result.exitCode !== 0) {
    throw new Error(`\`wayfinder ${argv.join(' ')}\` exited ${result.exitCode}: ${result.stderr}`);
  }
  return result.stdout;
}

/**
 * Both exports below are read once per page, and there are nineteen pages. The
 * CLI is cheap, but a build should still capture each render exactly once.
 */
let listingPromise: Promise<Listing> | undefined;
let rendersPromise: Promise<SkillRender[]> | undefined;

/** What `wayfinder skills` serves: the top-level ids and their children. */
export function servedSkills(): Promise<Listing['skills']> {
  listingPromise ??= capture(['skills', '--json']).then((json) => JSON.parse(json) as Listing);
  return listingPromise.then((listing) => listing.skills);
}

/**
 * Every served id, with its render. One page is built per entry.
 *
 * The id list comes from `wayfinder skills`, never from a list written here, so
 * a skill added to the CLI gets a page with no edit to the site.
 *
 * Two parents disclose the same supporting file — `domain-modeling` and
 * `grill-with-docs` both disclose the ADR and glossary formats — so the first
 * parent to claim an id keeps it, and each id renders exactly once.
 */
export function skillRenders(): Promise<SkillRender[]> {
  rendersPromise ??= buildRenders();
  return rendersPromise;
}

async function buildRenders(): Promise<SkillRender[]> {
  const pages: Omit<SkillRender, 'text'>[] = [];
  const claimed = new Set<string>();

  for (const skill of await servedSkills()) {
    claimed.add(skill.id);
    pages.push({ id: skill.id, children: skill.children, command: `wayfinder skill ${skill.id}` });

    for (const child of skill.children) {
      if (claimed.has(child)) continue;
      claimed.add(child);
      pages.push({
        id: child,
        parent: skill.id,
        children: [],
        command: `wayfinder skill ${child}`,
      });
    }
  }

  return Promise.all(
    pages.map(async (page) => ({
      ...page,
      // The render always ends in exactly one newline. Splitting it as it
      // stands would count a phantom blank line at the foot of every page.
      text: (await capture(['skill', page.id])).replace(/\n$/, ''),
    })),
  );
}
