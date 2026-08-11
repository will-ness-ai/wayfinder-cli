#!/usr/bin/env node
import { homedir } from 'node:os';
import { run } from './cli.js';
import { readlineAsk } from './prompt.js';
import type { CliEnv } from './env.js';

/**
 * The process boundary, and nothing more. It builds a {@link CliEnv} from
 * `process` — including the {@link CliEnv.ask} readline is backed by — hands it
 * to {@link run}, and writes what comes back. Every decision, the terminal forms
 * included, lives below the seam where a test can drive it.
 */
const ask = readlineAsk();
const env: CliEnv = {
  home: homedir(),
  cwd: process.cwd(),
  isTTY: Boolean(process.stdout.isTTY),
  env: process.env,
  ask: ask.question,
};

try {
  const result = await run(process.argv.slice(2), env);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exitCode = result.exitCode;
} finally {
  ask.close();
}
