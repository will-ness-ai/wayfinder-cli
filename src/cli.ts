import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { encode } from '@toon-format/toon';
import { isRecord, resolveConfig, scopeFiles, type Scope } from './config.js';
import type { CliEnv, CliResult } from './env.js';
import { initForm, trackerSetForm } from './forms.js';
import {
  buildStub,
  HARNESS_IDS,
  harnessSkillInstalled,
  isHarnessId,
  lineDiff,
  stubPath,
  type HarnessId,
} from './init.js';
import { findSkill, registry } from './registry.js';
import { listingFor, renderSkill } from './render.js';
import { trackerDocProblem } from './tracker.js';
import { readVersion } from './version.js';
import { help } from './text.js';

/**
 * The CLI entry point and the single test seam. It never touches `process`: it
 * takes an argv array (the args after the binary name) plus a {@link CliEnv},
 * and returns the bytes to write and the exit code.
 */
export async function run(argv: string[], env: CliEnv): Promise<CliResult> {
  const parsed = parseArgv(argv);

  if (parsed.flags.has('help')) return ok(help);
  if (parsed.flags.has('version')) return ok(`${readVersion()}\n`);

  // Bare `wayfinder` is an agent's first call, so it renders the wayfinder skill
  // rather than a page that tells the agent to call again. `--help` keeps the
  // developer's page, so the two audiences still read their own text.
  const command = parsed.positionals[0];
  if (command === undefined) return renderCommand('wayfinder', env);

  switch (command) {
    case 'skill':
      return renderCommand(parsed.positionals[1], env);
    case 'skills':
      return skillsCommand(parsed);
    case 'tracker':
      return trackerCommand(parsed, env);
    case 'ticket-skill':
      return ticketSkillCommand(parsed, env);
    case 'doctor':
      return doctorCommand(parsed, env);
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

function skillsCommand(parsed: ParsedArgv): CliResult {
  return ok(structured({ skills: registry.map(listingFor) }, parsed));
}

async function trackerCommand(parsed: ParsedArgv, env: CliEnv): Promise<CliResult> {
  const sub = parsed.positionals[1];
  switch (sub) {
    case 'show':
      return trackerShow(parsed, env);
    case 'set':
      return trackerSet(parsed, env);
    default:
      return usageError(
        'Usage: wayfinder tracker <show|set>. Run `wayfinder --help` for the setup page.',
      );
  }
}

/**
 * `wayfinder tracker show` reports the effective tracker and the scope that
 * supplied it. It is a status command, so it prints TOON by default and JSON
 * under `--json`, the same contract as every other list and status command.
 * An unset tracker is a state, not an error: the payload says so and exits zero.
 */
function trackerShow(parsed: ParsedArgv, env: CliEnv): CliResult {
  const { tracker } = resolveConfig(env);
  const payload = tracker
    ? {
        tracker: {
          value: tracker.value,
          scope: tracker.scope,
          ...(tracker.doc !== undefined ? { doc: tracker.doc } : {}),
        },
      }
    : { tracker: null };
  return ok(structured(payload, parsed));
}

/**
 * `wayfinder tracker set [<value>] [--doc <path>] [--user]`. The value is the
 * positional words after `set`; a doc path and the user scope are flags.
 *
 * Dual mode resolves here, below the seam: on a TTY with no value the form fills
 * the argv in and this same function acts on the result, so the two modes reach
 * one code path. With no value and no TTY it is a usage error that names what to
 * pass.
 */
async function trackerSet(requested: ParsedArgv, env: CliEnv): Promise<CliResult> {
  const answered = await fillTrackerSet(requested, env);
  const value = answered.positionals.slice(2).join(' ').trim();

  if (value === '') {
    return usageError(
      'tracker set needs a tracker value: name your issue tracker, lower case.\n' +
        'For example:\n\n' +
        '  wayfinder tracker set "github cli"\n\n' +
        'Or run it on a terminal with no value to fill it in on a form.',
    );
  }

  const scope: Scope = answered.flags.has('user') ? 'user' : 'project';
  const file = scopeFiles(env)[scope];
  const doc = answered.options.doc;

  let existing: Record<string, unknown>;
  try {
    existing = readConfigForWrite(file);
  } catch {
    return usageError(
      `The ${scope} config at ${file} is not valid JSON. Fix it before setting the tracker.`,
    );
  }
  existing.tracker = { value, ...(doc ? { doc } : {}) };
  writeConfig(file, existing, scope, env);

  const docNote = doc ? ` with doc \`${doc}\`` : '';
  return ok(`Set tracker to "${value}"${docNote} in ${scope} config (${file}).\n`);
}

/** Run the `tracker set` form when a TTY offers one and no value was passed; otherwise pass through. */
async function fillTrackerSet(requested: ParsedArgv, env: CliEnv): Promise<ParsedArgv> {
  const hasValue = requested.positionals.slice(2).join(' ').trim() !== '';
  if (hasValue || !env.isTTY || !env.ask) return requested;
  return parseArgv(
    await trackerSetForm(
      env.ask,
      requested.positionals.slice(0, 2),
      requested.flags.has('user'),
      requested.options.doc,
    ),
  );
}

/**
 * `wayfinder ticket-skill <add|edit|remove|list>`. A ticket skill is a harness
 * skill charting assigns to each ticket its when sentence makes relevant; the CLI
 * only points at it, and the harness serves and invokes it. The registration
 * schema carries three fields and no more: name, when sentence, and scope.
 */
function ticketSkillCommand(parsed: ParsedArgv, env: CliEnv): CliResult {
  switch (parsed.positionals[1]) {
    case 'add':
      return ticketSkillWrite(parsed, env, 'add');
    case 'edit':
      return ticketSkillWrite(parsed, env, 'edit');
    case 'remove':
      return ticketSkillRemove(parsed, env);
    case 'list':
      return ticketSkillList(parsed, env);
    default:
      return usageError(
        'Usage: wayfinder ticket-skill <add|edit|remove|list>. Run `wayfinder --help` for the setup page.',
      );
  }
}

/**
 * `add` and `edit` share one writer: both register `{ when }` under the name in
 * the chosen scope, differing only in the guard. `add` refuses a name already
 * registered in that scope, so it never silently overwrites; `edit` refuses a
 * name not yet registered there, so it never registers by surprise. A tombstone
 * counts as unregistered, so `add` may re-register over a hidden inheritance.
 */
function ticketSkillWrite(parsed: ParsedArgv, env: CliEnv, mode: 'add' | 'edit'): CliResult {
  const name = parsed.positionals[2]?.trim();
  if (!name) return usageError(TICKET_SKILL_NAME_USAGE);
  const when = parsed.options.when?.trim();
  if (!when) return usageError(WHEN_USAGE);
  const scope = parseScope(parsed.options.scope);
  if (scope instanceof Error) return usageError(scope.message);

  const file = scopeFiles(env)[scope];
  let existing: Record<string, unknown>;
  try {
    existing = readConfigForWrite(file);
  } catch {
    return usageError(malformedConfig(scope, file));
  }
  const skills = ticketSkillsFor(existing);

  if (mode === 'add' && skills[name] != null) {
    return usageError(
      `Ticket skill "${name}" is already registered in ${scope} config. ` +
        `Change its when sentence with \`wayfinder ticket-skill edit ${name} --when "..."\`.`,
    );
  }
  if (mode === 'edit' && skills[name] == null) {
    return usageError(
      `No ticket skill "${name}" is registered in ${scope} config. ` +
        `Register it with \`wayfinder ticket-skill add ${name} --when "..."\`.`,
    );
  }

  skills[name] = { when };
  existing.ticketSkills = skills;
  writeConfig(file, existing, scope, env);
  const verb = mode === 'add' ? 'Registered' : 'Updated';
  return ok(`${verb} ticket skill "${name}" in ${scope} config.\n`);
}

/**
 * `remove` unregisters a name at one scope. A name registered directly in that
 * scope is deleted; a name only inherited from a broader scope is hidden with a
 * `null` tombstone, so the one command covers both the local cleanup and the
 * inherited-registration hide the union resolution reads.
 */
function ticketSkillRemove(parsed: ParsedArgv, env: CliEnv): CliResult {
  const name = parsed.positionals[2]?.trim();
  if (!name) return usageError(TICKET_SKILL_NAME_USAGE);
  const scope = parseScope(parsed.options.scope);
  if (scope instanceof Error) return usageError(scope.message);

  const file = scopeFiles(env)[scope];
  let existing: Record<string, unknown>;
  try {
    existing = readConfigForWrite(file);
  } catch {
    return usageError(malformedConfig(scope, file));
  }
  const skills = ticketSkillsFor(existing);

  let report: string;
  if (skills[name] != null) {
    delete skills[name];
    report = `Removed ticket skill "${name}" from ${scope} config.`;
  } else {
    skills[name] = null;
    report = `Hid inherited ticket skill "${name}" in ${scope} config with a tombstone.`;
  }
  existing.ticketSkills = skills;
  writeConfig(file, existing, scope, env);
  return ok(`${report}\n`);
}

/** `list` shows each effective registration with its scope: TOON by default, JSON under `--json`. */
function ticketSkillList(parsed: ParsedArgv, env: CliEnv): CliResult {
  const { ticketSkills } = resolveConfig(env);
  return ok(structured({ ticketSkills }, parsed));
}

/**
 * `wayfinder doctor`. It reports each registered ticket-skill name that resolves
 * to no installed harness skill — checked across the `claude` and `agents` targets
 * in project scope and user scope — and a tracker doc path that no longer resolves.
 * A clean run exits zero; any finding exits non-zero, so the check gates in CI.
 */
function doctorCommand(parsed: ParsedArgv, env: CliEnv): CliResult {
  const config = resolveConfig(env);
  const problems: DoctorProblem[] = [];

  for (const skill of config.ticketSkills) {
    if (!harnessSkillInstalled(env, skill.name)) {
      problems.push({
        kind: 'ticket-skill',
        subject: skill.name,
        detail:
          `Ticket skill "${skill.name}" (${skill.scope} scope) resolves to no installed harness skill. ` +
          `Install it in a harness, or remove it with \`wayfinder ticket-skill remove ${skill.name}\`.`,
      });
    }
  }

  const docProblem = trackerDocProblem(config);
  if (docProblem && config.tracker?.doc !== undefined) {
    problems.push({ kind: 'tracker-doc', subject: config.tracker.doc, detail: docProblem });
  }

  const rendered = structured({ problems }, parsed);
  return { stdout: rendered, stderr: '', exitCode: problems.length === 0 ? 0 : 1 };
}

/** One `doctor` finding: what kind of thing is broken, which one, and what to do. */
interface DoctorProblem {
  kind: 'ticket-skill' | 'tracker-doc';
  subject: string;
  detail: string;
}

/**
 * Render a status or list payload: TOON by default, JSON under `--json`. Every
 * command that reports state shares it, so no surface can drift into ad-hoc prose
 * that a caller cannot parse.
 */
function structured(payload: object, parsed: ParsedArgv): string {
  const rendered = parsed.flags.has('json') ? JSON.stringify(payload, null, 2) : encode(payload);
  return `${rendered}\n`;
}

/**
 * The stored `ticketSkills` map, as a writable object. A missing or non-object
 * key starts empty, and every stored entry is checked rather than asserted: an
 * entry of the wrong shape is dropped, so a rewrite never carries a malformed
 * registration back to disk under a type that claims it is sound.
 */
function ticketSkillsFor(existing: Record<string, unknown>): Record<string, { when: string } | null> {
  const raw = existing.ticketSkills;
  if (!isRecord(raw)) return {};

  const skills: Record<string, { when: string } | null> = {};
  for (const [name, entry] of Object.entries(raw)) {
    if (entry === null) {
      skills[name] = null;
    } else if (isRecord(entry) && typeof entry.when === 'string') {
      skills[name] = { when: entry.when };
    }
  }
  return skills;
}

/** Resolve the `--scope` flag to a scope, defaulting to project, or a named usage error. */
function parseScope(raw: string | undefined): Scope | Error {
  if (raw === undefined) return 'project';
  if (raw === 'local' || raw === 'project' || raw === 'user') return raw;
  return new Error(
    `Unknown scope "${raw}". Use one of local, project, user.\n\n` +
      '  wayfinder ticket-skill add pre-mortem --when "..." --scope project',
  );
}

function malformedConfig(scope: Scope, file: string): string {
  return `The ${scope} config at ${file} is not valid JSON. Fix it before registering a ticket skill.`;
}

const TICKET_SKILL_NAME_USAGE =
  'ticket-skill needs a skill name: the harness skill to register.\n\n' +
  '  wayfinder ticket-skill add pre-mortem --when "the ticket carries deploy or migration risk"';

const WHEN_USAGE =
  'ticket-skill needs a when sentence: the condition that makes the skill relevant to a ticket.\n' +
  '--when "<sentence>"  Required. The relevance condition charting reads to assign the skill.\n\n' +
  'For example:\n\n' +
  '  wayfinder ticket-skill add pre-mortem --when "the ticket carries deploy or migration risk"';

/**
 * `wayfinder init [--harness <ids>] [--tracker <value>]`. It writes exactly one
 * stub skill per selected harness — never one per served skill — so a skill the
 * human keeps installed is never overwritten. `init` is the only writer of the
 * stub: `tracker set` and every registration mutation leave it alone. A second
 * run repairs a damaged stub and reports a diff of what it changed.
 *
 * Dual mode resolves here, below the seam: on a TTY with no `--harness` the
 * multi-select fills the argv in and this same function acts on the result. With
 * no `--harness` and no TTY it is a usage error that names the flag.
 */
async function initCommand(requested: ParsedArgv, env: CliEnv): Promise<CliResult> {
  const parsed = await fillInit(requested, env);
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

/** Run the `init` multi-select when a TTY offers one and no `--harness` was passed; otherwise pass through. */
async function fillInit(requested: ParsedArgv, env: CliEnv): Promise<ParsedArgv> {
  if (requested.options.harness !== undefined || !env.isTTY || !env.ask) return requested;
  return parseArgv(await initForm(env.ask, env, ['init'], requested.options.tracker));
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
  'Or run it on a terminal with no flags to pick the harnesses from a form.';

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
  const doc = isRecord(prior) && typeof prior.doc === 'string' ? prior.doc : undefined;
  existing.tracker = doc ? { value, doc } : { value };
  writeConfig(file, existing, 'project', env);
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
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) {
    throw new Error('A config file must hold a JSON object.');
  }
  return parsed;
}

/**
 * Write a config back as pretty JSON, creating its directory on the first write.
 * Writing the local scope also plants the ignore rule beside it: local config is
 * one developer's override and must never reach a commit, so the CLI that
 * creates the file is what keeps it out of git.
 */
function writeConfig(
  file: string,
  config: Record<string, unknown>,
  scope: Scope,
  env: CliEnv,
): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  if (scope === 'local') ignoreLocalConfig(env);
}

/** The name of the local-scope config file, as its sibling ignore rule spells it. */
const LOCAL_CONFIG_IGNORE = 'local.json';

/**
 * Keep `.wayfinder/local.json` out of git with an ignore file beside it, rather
 * than by editing the repo's root `.gitignore` — a file the CLI does not own and
 * a developer may have arranged deliberately. An existing rule is left alone.
 */
function ignoreLocalConfig(env: CliEnv): void {
  const ignoreFile = join(dirname(scopeFiles(env).local), '.gitignore');
  let existing = '';
  if (existsSync(ignoreFile)) {
    existing = readFileSync(ignoreFile, 'utf8');
    if (existing.split('\n').some((line) => line.trim() === LOCAL_CONFIG_IGNORE)) return;
  }
  const separator = existing === '' || existing.endsWith('\n') ? '' : '\n';
  writeFileSync(ignoreFile, `${existing}${separator}${LOCAL_CONFIG_IGNORE}\n`, 'utf8');
}

type Flag = 'help' | 'version' | 'json' | 'user';

export interface ParsedArgv {
  flags: Set<Flag>;
  options: { doc?: string; harness?: string; tracker?: string; when?: string; scope?: string };
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
      case '--when':
        i += 1;
        if (argv[i] !== undefined) options.when = argv[i];
        break;
      case '--scope':
        i += 1;
        if (argv[i] !== undefined) options.scope = argv[i];
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
