import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * The temporary-directory fixture. File-writing commands (`init`, `tracker set`,
 * `ticket-skill add`, all in later tickets) run against a throwaway tree passed
 * in as `home` and `cwd`. This creates that tree, hands it to a callback, and
 * removes it afterwards — even if the callback throws.
 */
export async function withTempDir(fn: (dir: string) => void | Promise<void>): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), 'wayfinder-test-'));
  try {
    await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
