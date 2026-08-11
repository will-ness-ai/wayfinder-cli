import { encode } from '@toon-format/toon';
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
export async function run(argv: string[], _env: CliEnv): Promise<CliResult> {
  const { flags, positionals } = parseArgv(argv);

  if (flags.has('help')) return ok(help);
  if (flags.has('version')) return ok(`${readVersion()}\n`);

  const command = positionals[0];
  if (command === undefined) return ok(quickstart);

  switch (command) {
    case 'skill':
      return renderCommand(positionals[1]);
    case 'skills':
      return skillsCommand(flags.has('json'));
    default:
      return usageError(
        `Unknown command "${command}". Run \`wayfinder --help\` to see what is served.`,
      );
  }
}

function renderCommand(id: string | undefined): CliResult {
  if (id === undefined) {
    return usageError('Usage: wayfinder skill <id>. Run `wayfinder skills` to see every served id.');
  }
  const entry = findSkill(id);
  if (!entry) {
    return usageError(
      `Unknown skill id "${id}". Run \`wayfinder skills\` to see every served id.`,
    );
  }
  return ok(renderSkill(entry));
}

function skillsCommand(asJson: boolean): CliResult {
  const skills = registry.map(listingFor);
  const payload = { skills };
  const rendered = asJson ? JSON.stringify(payload, null, 2) : encode(payload);
  return ok(`${rendered}\n`);
}

type Flag = 'help' | 'version' | 'json';

interface ParsedArgv {
  flags: Set<Flag>;
  positionals: string[];
}

function parseArgv(argv: string[]): ParsedArgv {
  const flags = new Set<Flag>();
  const positionals: string[] = [];
  for (const arg of argv) {
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
      default:
        positionals.push(arg);
    }
  }
  return { flags, positionals };
}

function ok(stdout: string): CliResult {
  return { stdout, stderr: '', exitCode: 0 };
}

function usageError(message: string): CliResult {
  return { stdout: '', stderr: `${message}\n`, exitCode: 1 };
}
