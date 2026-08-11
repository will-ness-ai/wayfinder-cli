#!/usr/bin/env node
import { run } from './cli.js';
import type { CliEnv } from './env.js';
import { homedir } from 'node:os';

const env: CliEnv = {
  home: homedir(),
  cwd: process.cwd(),
  isTTY: Boolean(process.stdout.isTTY),
  env: process.env,
};

const result = await run(process.argv.slice(2), env);
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exitCode = result.exitCode;
