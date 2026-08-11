import type { Ask, CliEnv } from './env.js';
import { detectHarnesses, HARNESS_BASE, HARNESS_IDS, type HarnessId } from './init.js';

/**
 * The terminal forms, below the seam.
 *
 * Each form collects the same inputs its command's flags carry and returns a
 * completed argv, so the flag-driven path and the form path reach one code path
 * and can never diverge. They live below {@link run} because the injected
 * environment names the TTY state and the {@link Ask}: a test drives a form by
 * passing `isTTY: true` and a scripted `ask`, exactly as it drives every other
 * behaviour.
 *
 * A form never writes anything. It answers into argv, and `run` validates that
 * argv before any file is touched.
 */

/**
 * The `tracker set` form: value, optional doc, and scope. Any flag already on the
 * command line is kept and not re-asked. The value question gives up after three
 * empty answers — an EOF on stdin answers empty forever — and falls through with
 * no value, so `run` reports its usage error rather than looping.
 */
export async function trackerSetForm(ask: Ask, argv: string[], hasUser: boolean, doc?: string): Promise<string[]> {
  let value = '';
  for (let attempt = 0; attempt < 3 && value === ''; attempt += 1) {
    value = (await ask('Issue tracker (lower case, e.g. "github cli"): ')).trim();
  }
  if (value === '') return argv;

  const docAnswer = doc ?? (await ask('Tracker doc path (optional, Enter to skip): ')).trim();

  let user = hasUser;
  if (!user) {
    const scope = (await ask('Scope [project/user] (Enter for project): ')).trim();
    user = scope.toLowerCase() === 'user';
  }

  const completed = ['tracker', 'set', value];
  if (docAnswer !== '') completed.push('--doc', docAnswer);
  if (user) completed.push('--user');
  return completed;
}

/**
 * The `init` form: a multi-select over the install targets, then an optional
 * tracker value.
 *
 * The select numbers every target and marks the ones already present in the repo,
 * so the human sees what was detected rather than inferring it. Enter takes the
 * detected targets. With nothing detected there is no safe default — pressing
 * Enter must not create both harness directories in a repo that uses neither — so
 * the question repeats, then falls through with no selection and lets `run`
 * report the usage error that names the flag.
 */
export async function initForm(ask: Ask, env: CliEnv, argv: string[], tracker?: string): Promise<string[]> {
  const detected = detectHarnesses(env);
  const menu = HARNESS_IDS.map(
    (id, index) =>
      `  ${index + 1}) ${id} (${HARNESS_BASE[id]}/skills/)${detected.includes(id) ? '  [detected]' : ''}`,
  ).join('\n');
  const enterNote =
    detected.length > 0 ? `Enter for ${detected.join(',')}` : 'no default — this repo uses neither';

  let chosen: HarnessId[] = [];
  for (let attempt = 0; attempt < 3 && chosen.length === 0; attempt += 1) {
    const answer = (
      await ask(`Harnesses to install into:\n${menu}\nSelect by number, comma-separated (${enterNote}): `)
    ).trim();
    chosen = answer === '' ? detected : selectHarnesses(answer);
  }
  if (chosen.length === 0) return argv;

  const trackerAnswer =
    tracker ?? (await ask('Tracker for this project (optional, Enter to skip): ')).trim();

  const completed = ['init', '--harness', chosen.join(',')];
  if (trackerAnswer !== '') completed.push('--tracker', trackerAnswer);
  return completed;
}

/**
 * Read a multi-select answer as install targets. Each entry is a menu number or
 * an id, so both `1,2` and `claude,agents` select the same pair. An entry that
 * names neither is dropped: the question repeats, which teaches the format better
 * than an error that ends the command.
 */
function selectHarnesses(answer: string): HarnessId[] {
  const chosen: HarnessId[] = [];
  for (const raw of answer.split(',')) {
    const entry = raw.trim();
    if (entry === '') continue;
    const byNumber = HARNESS_IDS[Number(entry) - 1];
    const id = byNumber ?? HARNESS_IDS.find((known) => known === entry);
    if (id !== undefined && !chosen.includes(id)) chosen.push(id);
  }
  return chosen;
}
