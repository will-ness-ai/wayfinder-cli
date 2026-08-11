#!/usr/bin/env node
import { homedir } from 'node:os';
import { parseArgv, run } from './cli.js';
import { promptInit, promptTrackerSet } from './prompt.js';
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

  if (rawArgv[0] === 'tracker' && rawArgv[1] === 'set') {
    // A positional beyond `tracker set` is the value word: the flags already
    // carry the answer, so no form is needed.
    if (parseArgv(rawArgv).positionals.length > 2) return rawArgv;
    return promptTrackerSet(rawArgv);
  }

  if (rawArgv[0] === 'init') {
    // `--harness` already carries the selection, so the form is only for the
    // bare `init` invocation.
    if (parseArgv(rawArgv).options.harness !== undefined) return rawArgv;
    return promptInit(rawArgv, cliEnv);
  }

  return rawArgv;
}
