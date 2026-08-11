import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { parseArgv } from './cli.js';
import type { CliEnv } from './env.js';
import { detectHarnesses, HARNESS_IDS } from './init.js';

/**
 * The `tracker set` terminal form. It collects the same three inputs the flags
 * carry — value, optional doc, and whether to write the user scope — and returns
 * an argv that {@link run} handles exactly like the flag-driven path, so the two
 * modes can never diverge. This runs only on a TTY, and only when no value was
 * passed; every tested path drives the flags instead.
 *
 * Any doc or scope flag already on the command line is kept and not re-asked.
 * The value prompt gives up after a few empty answers (for example an EOF on
 * stdin) and falls through with no value, so `run` reports the usage error
 * rather than the form looping forever.
 */
export async function promptTrackerSet(rawArgv: string[]): Promise<string[]> {
  const { flags, options } = parseArgv(rawArgv);
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    let value = '';
    for (let attempt = 0; attempt < 3 && value === ''; attempt += 1) {
      value = (await rl.question('Issue tracker (lower case, e.g. "github cli"): ')).trim();
    }

    const doc =
      options.doc ??
      (await rl.question('Operations doc path (optional, Enter to skip): ')).trim();

    let user = flags.has('user');
    if (!user) {
      const scope = (await rl.question('Scope [project/user] (Enter for project): ')).trim();
      user = scope.toLowerCase() === 'user';
    }

    const argv = ['tracker', 'set'];
    if (value !== '') argv.push(value);
    if (doc !== undefined && doc !== '') argv.push('--doc', doc);
    if (user) argv.push('--user');
    return argv;
  } finally {
    rl.close();
  }
}

/**
 * The `init` terminal form. It collects the same two inputs the flags carry — the
 * harnesses to install into and an optional tracker value — and returns an argv
 * that {@link run} handles exactly like the flag-driven path, so the two modes
 * can never diverge. This runs only on a TTY, and only when no `--harness` was
 * passed; every tested path drives the flags instead.
 *
 * Detected harnesses seed the default, so pressing Enter installs into what the
 * repo already uses. With no harness detected the default offers every harness,
 * so pressing Enter installs into all of them — the prompt names exactly what
 * Enter will do, and `run` still validates the answer before writing.
 */
export async function promptInit(rawArgv: string[], env: CliEnv): Promise<string[]> {
  const { options } = parseArgv(rawArgv);
  const detected = detectHarnesses(env);
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const suggested = (detected.length > 0 ? detected : HARNESS_IDS).join(',');
    const answer = (
      await rl.question(`Harnesses to install into [${HARNESS_IDS.join(',')}] (Enter for ${suggested}): `)
    ).trim();
    const harness = answer !== '' ? answer : suggested;

    const tracker =
      options.tracker ?? (await rl.question('Tracker for this project (optional, Enter to skip): ')).trim();

    const argv = ['init'];
    if (harness !== '') argv.push('--harness', harness);
    if (tracker !== undefined && tracker !== '') argv.push('--tracker', tracker);
    return argv;
  } finally {
    rl.close();
  }
}
