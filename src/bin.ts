#!/usr/bin/env node
import { homedir } from 'node:os';
import { run } from './cli.js';
import { promptTrackerSet } from './prompt.js';
import type { CliEnv } from './env.js';

const env: CliEnv = {
  home: homedir(),
  cwd: process.cwd(),
  isTTY: Boolean(process.stdout.isTTY),
  env: process.env,
};

const argv = await withInteractiveForm(process.argv.slice(2), env);

const result = await run(argv, env);
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exitCode = result.exitCode;

/**
 * The process boundary owns the one interactive path. On a TTY, `tracker set`
 * with no value runs a terminal form and folds the answers back into argv, so
 * {@link run} still sees a complete, flag-driven command and stays pure. Every
 * other invocation, and every non-TTY run, passes straight through.
 */
async function withInteractiveForm(rawArgv: string[], cliEnv: CliEnv): Promise<string[]> {
  if (!cliEnv.isTTY) return rawArgv;
  if (rawArgv[0] !== 'tracker' || rawArgv[1] !== 'set') return rawArgv;
  if (hasTrackerValue(rawArgv)) return rawArgv;
  return promptTrackerSet(rawArgv);
}

/** Whether `tracker set` already carries a value word, so no form is needed. */
function hasTrackerValue(rawArgv: string[]): boolean {
  const rest = rawArgv.slice(2);
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === '--doc') {
      i += 1;
      continue;
    }
    if (arg === '--user') continue;
    if (arg !== undefined && !arg.startsWith('--')) return true;
  }
  return false;
}
