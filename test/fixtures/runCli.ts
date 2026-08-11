import { tmpdir } from 'node:os';
import { run } from '../../src/cli.js';
import type { CliEnv, CliResult } from '../../src/env.js';

/**
 * The snapshot fixture. Drive a real command through the CLI entry-point seam
 * and read back its bytes and exit code. Tests snapshot `result.stdout`.
 *
 * The injected environment is a neutral default — a non-TTY, an empty env, and
 * throwaway home/cwd — so a render depends only on the shipped content, not on
 * where the test happens to run. Callers override any field they exercise.
 */
export function runCli(argv: string[], overrides: Partial<CliEnv> = {}): Promise<CliResult> {
  const env: CliEnv = {
    home: tmpdir(),
    cwd: tmpdir(),
    isTTY: false,
    env: {},
    ...overrides,
  };
  return run(argv, env);
}
