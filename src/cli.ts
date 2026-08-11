import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';
import { encode } from '@toon-format/toon';
import { resolveConfig, scopeFiles, type Scope } from './config.js';
import type { CliEnv, CliResult } from './env.js';
import {
  buildStub,
  HARNESS_IDS,
  isHarnessId,
  lineDiff,
  stubPath,
  type HarnessId,
} from './init.js';
import { findSkill, registry } from './registry.js';
import { listingFor, renderSkill } from './render.js';
import { readVersion } from './version.js';
import { help, quickstart } from './text.js';

/**
 * The CLI entry point and the single test seam. It never touches `process`: it
 * takes an argv array (the args after the binary name) plus a {@link CliEnv},
 * and returns the bytes to write and the exit code.
 */
export async function run(argv: string[], env: CliEnv): Promise<CliResult> {
  const parsed = parseArgv(argv);

  if (parsed.flags.has('help')) return ok(help);
  if (parsed.flags.has('version')) return ok(`${readVersion()}\n`);

  const command = parsed.positionals[0];
  if (command === undefined) return ok(quickstart);

  switch (command) {
    case 'skill':
      return renderCommand(parsed.positionals[1], env);
    case 'skills':
      return skillsCommand(parsed.flags.has('json'));
    case 'tracker':
      return trackerCommand(parsed, env);
    case 'init':
      return initCommand(parsed, env);
    default:
      return usageError(
        `Unknown command "${command}". Run \`wayfinder --help\` to see what is served.`,
      );
  }
}

function renderCommand(id: string | undefined, env: CliEnv): CliResult {
  if (id === undefined) {
    return usageError('Usage: wayfinder skill <id>. Run `wayfinder skills` to see every served id.');
  }
  const entry = findSkill(id);
  if (!entry) {
    return usageError(
      `Unknown skill id "${id}". Run \`wayfinder skills\` to see every served id.`,
    );
  }
  return ok(renderSkill(entry, resolveConfig(env)));
}

function skillsCommand(asJson: boolean): CliResult {
  const skills = registry.map(listingFor);
  const payload = { skills };
  const rendered = asJson ? JSON.stringify(payload, null, 2) : encode(payload);
  return ok(`${rendered}\n`);
}

function trackerCommand(parsed: ParsedArgv, env: CliEnv): CliResult {
  const sub = parsed.positionals[1];
  switch (sub) {
    case 'show':
      return trackerShow(env);
    case 'set':
      return trackerSet(parsed, env);
    default:
      return usageError(
        'Usage: wayfinder tracker <show|set>. Run `wayfinder --help` for the setup page.',
      );
  }
}

function trackerShow(env: CliEnv): CliResult {
  const { tracker } = resolveConfig(env);
  if (!tracker) {
    return ok(
      'No tracker is configured.\n' +
        'Set one with `wayfinder tracker set "<value>"`, for example `wayfinder tracker set "github cli"`.\n',
    );
  }
  return ok(`tracker: ${tracker.value}\nscope: ${tracker.scope}\n`);
}

/**
 * `wayfinder tracker set [<value>] [--doc <path>] [--user]`. The value is the
 * positional words after `set`; a doc path and the user scope are flags. With no
 * value and no TTY this is a usage error — the interactive form runs in the entry
 * point before `run` is reached, so `run` stays a pure, flag-driven transform.
 */
function trackerSet(parsed: ParsedArgv, env: CliEnv): CliResult {
  const value = parsed.positionals.slice(2).join(' ').trim();
  if (value === '') {
    return usageError(
      'tracker set needs a tracker value: name your issue tracker, lower case.\n' +
        'For example:\n\n' +
        '  wayfinder tracker set "github cli"\n\n' +
        'Or run it on a terminal with no value to fill it in interactively.',
    );
  }

  const scope: Scope = parsed.flags.has('user') ? 'user' : 'project';
  const file = scopeFiles(env)[scope];
  const doc = parsed.options.doc;

  let existing: Record<string, unknown>;
  try {
    existing = readConfigForWrite(file);
  } catch {
    return usageError(
      `The ${scope} config at ${file} is not valid JSON. Fix it before setting the tracker.`,
    );
  }
  existing.tracker = { value, ...(doc ? { doc } : {}) };
  writeConfig(file, existing);

  const docNote = doc ? ` with doc \`${doc}\`` : '';
  return ok(`Set tracker to "${value}"${docNote} in ${scope} config (${file}).\n`);
}

/**
 * `wayfinder init [--harness <ids>] [--tracker <value>]`. It writes exactly one
 * stub skill per selected harness — never one per served skill — so a skill the
 * human keeps installed is never overwritten. `init` is the only writer of the
 * stub: `tracker set` and every registration mutation leave it alone. A second
 * run repairs a damaged stub and reports a diff of what it changed.
 *
 * The interactive form runs at the process boundary on a TTY and folds its
 * answers back into `--harness`, so `run` stays a pure, flag-driven transform.
 * With no `--harness` and no TTY this is a usage error that names the flag.
 */
function initCommand(parsed: ParsedArgv, env: CliEnv): CliResult {
  const harnesses = parseHarnesses(parsed.options.harness);
  if (harnesses instanceof Error) return usageError(harnesses.message);

  const reports: string[] = [];

  if (parsed.options.tracker !== undefined) {
    const trackerReport = writeInitTracker(parsed.options.tracker, env);
    if (trackerReport instanceof Error) return usageError(trackerReport.message);
    reports.push(trackerReport);
  }

  const stub = buildStub();
  for (const harness of harnesses) {
    reports.push(writeStub(stub, stubPath(env, harness), env.cwd));
  }
  reports.push('Next: have your agent run `wayfinder skill wayfinder`.');
  return ok(`${reports.join('\n')}\n`);
}

/**
 * Parse the `--harness` flag into a de-duplicated list of valid install targets.
 * A missing flag or an unknown id is a usage error that names the flag, describes
 * a good value, and shows one example — the dual-mode style setup commands share.
 */
function parseHarnesses(flag: string | undefined): HarnessId[] | Error {
  const ids = (flag ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id !== '');
  if (ids.length === 0) return new Error(HARNESS_USAGE);

  const chosen: HarnessId[] = [];
  for (const id of ids) {
    if (!isHarnessId(id)) {
      return new Error(
        `Unknown harness "${id}". Valid install targets are ${HARNESS_IDS.join(', ')}.\n\n` +
          '  wayfinder init --harness claude,agents',
      );
    }
    if (!chosen.includes(id)) chosen.push(id);
  }
  return chosen;
}

const HARNESS_USAGE =
  'init needs at least one harness to install the stub into.\n' +
  '--harness <ids>  The agent harnesses to write the stub into, comma-separated.\n' +
  '                 Valid ids: claude (.claude/skills/), agents (.agents/skills/).\n\n' +
  'For example:\n\n' +
  '  wayfinder init --harness claude,agents\n\n' +
  'Or run it on a terminal with no flags to pick the harnesses interactively.';

/**
 * Write the stub to one harness, and report what happened. A first write reports
 * the new file; an identical stub reports no change; a differing stub is repaired
 * and its line diff reported, so a repair never writes silently.
 */
function writeStub(stub: string, path: string, cwd: string): string {
  const rel = relative(cwd, path);
  let existing: string | undefined;
  try {
    existing = readFileSync(path, 'utf8');
  } catch {
    existing = undefined;
  }

  if (existing === stub) return `${rel} is already up to date.`;

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, stub, 'utf8');

  if (existing === undefined) return `Wrote ${rel} (new stub).`;
  const diff = lineDiff(existing, stub)
    .map((line) => `  ${line}`)
    .join('\n');
  return `Repaired ${rel}:\n${diff}`;
}

/**
 * `--tracker <value>` records the tracker in project config, the same write the
 * interactive form's tracker question performs. It stores the value only; `--doc`
 * is `tracker set`'s job. A malformed config is refused rather than clobbered.
 */
function writeInitTracker(raw: string, env: CliEnv): string | Error {
  const value = raw.trim();
  if (value === '') {
    return new Error(
      'init --tracker needs a value: name your issue tracker, lower case.\n\n' +
        '  wayfinder init --harness claude --tracker "github cli"',
    );
  }
  const file = scopeFiles(env).project;
  let existing: Record<string, unknown>;
  try {
    existing = readConfigForWrite(file);
  } catch {
    return new Error(`The project config at ${file} is not valid JSON. Fix it before running init.`);
  }
  // Store the value only, but preserve a doc a prior `tracker set --doc` attached:
  // recording the tracker here must never silently drop the developer's doc path.
  const prior = existing.tracker;
  const doc =
    prior && typeof prior === 'object' && typeof (prior as { doc?: unknown }).doc === 'string'
      ? (prior as { doc: string }).doc
      : undefined;
  existing.tracker = doc ? { value, doc } : { value };
  writeConfig(file, existing);
  return `Set tracker to "${value}" in project config (${relative(env.cwd, file)}).`;
}

/**
 * Read the config to write into, preserving every other key. A missing file is
 * the normal first write and starts from empty; a file that exists but is
 * malformed throws, so a set never silently clobbers `ticketSkills` or a doc.
 * (Resolution reads tolerantly — see `resolveConfig` — because a broken config
 * must never crash a read command. Writing is strict, so it never destroys data.)
 */
function readConfigForWrite(file: string): Record<string, unknown> {
  let raw: string;
  try {
    raw = readFileSync(file, 'utf8');
  } catch {
    return {};
  }
  return JSON.parse(raw) as Record<string, unknown>;
}

/** Write a config back as pretty JSON, creating its directory on the first write. */
function writeConfig(file: string, config: Record<string, unknown>): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

type Flag = 'help' | 'version' | 'json' | 'user';

export interface ParsedArgv {
  flags: Set<Flag>;
  options: { doc?: string; harness?: string; tracker?: string };
  positionals: string[];
}

/**
 * Parse an argv into flags, options, and positionals. The flag vocabulary:
 * `--doc`, `--harness`, and `--tracker` each consume the next word, `--user` is
 * boolean, everything else is a positional. The process boundary shares this
 * parser (see `bin.ts`), so its read of a command can never drift from the one
 * {@link run} acts on.
 */
export function parseArgv(argv: string[]): ParsedArgv {
  const flags = new Set<Flag>();
  const options: ParsedArgv['options'] = {};
  const positionals: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--help':
      case '-h':
        flags.add('help');
        break;
      case '--version':
      case '-V':
        flags.add('version');
        break;
      case '--json':
        flags.add('json');
        break;
      case '--user':
        flags.add('user');
        break;
      case '--doc':
        i += 1;
        if (argv[i] !== undefined) options.doc = argv[i];
        break;
      case '--harness':
        i += 1;
        if (argv[i] !== undefined) options.harness = argv[i];
        break;
      case '--tracker':
        i += 1;
        if (argv[i] !== undefined) options.tracker = argv[i];
        break;
      default:
        if (arg !== undefined) positionals.push(arg);
    }
  }
  return { flags, options, positionals };
}

function ok(stdout: string): CliResult {
  return { stdout, stderr: '', exitCode: 0 };
}

function usageError(message: string): CliResult {
  return { stdout: '', stderr: `${message}\n`, exitCode: 1 };
}
