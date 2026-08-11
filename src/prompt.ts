import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

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
  const preset = presetFlags(rawArgv);
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    let value = '';
    for (let attempt = 0; attempt < 3 && value === ''; attempt += 1) {
      value = (await rl.question('Issue tracker (lower case, e.g. "github cli"): ')).trim();
    }

    const doc =
      preset.doc ??
      (await rl.question('Operations doc path (optional, Enter to skip): ')).trim();

    let user = preset.user;
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

/** The doc and scope flags already present on the command line, if any. */
function presetFlags(rawArgv: string[]): { doc?: string; user: boolean } {
  const preset: { doc?: string; user: boolean } = { user: false };
  for (let i = 2; i < rawArgv.length; i += 1) {
    const arg = rawArgv[i];
    if (arg === '--doc') {
      i += 1;
      if (rawArgv[i] !== undefined) preset.doc = rawArgv[i];
    } else if (arg === '--user') {
      preset.user = true;
    }
  }
  return preset;
}
