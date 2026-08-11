import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { encode } from '@toon-format/toon';
import { resolveConfig, scopeFiles, type Scope } from './config.js';
import type { CliEnv, CliResult } from './env.js';
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
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(existing, null, 2)}\n`, 'utf8');

  const where = doc ? ` with doc \`${doc}\`` : '';
  return ok(`Set tracker to "${value}"${where} in ${scope} config (${file}).\n`);
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

type Flag = 'help' | 'version' | 'json' | 'user';

interface ParsedArgv {
  flags: Set<Flag>;
  options: { doc?: string };
  positionals: string[];
}

function parseArgv(argv: string[]): ParsedArgv {
  const flags = new Set<Flag>();
  const options: { doc?: string } = {};
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
