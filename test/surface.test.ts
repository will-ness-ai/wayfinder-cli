import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runCli } from './fixtures/runCli.js';
import { withTempDir } from './fixtures/tempDir.js';

describe('the top-level surface', () => {
  it('prints the agent quickstart for bare wayfinder', async () => {
    const result = await runCli([]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('wayfinder skill wayfinder');
    expect(result.stdout).toContain('wayfinder skills');
    expect(result.stdout).toMatchSnapshot();
  });

  it('prints the full setup page for --help', async () => {
    const result = await runCli(['--help']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('USAGE');
    expect(result.stdout).toMatchSnapshot();
  });

  it('prints the version for --version and -V', async () => {
    // The expectation comes from package.json, the source of truth, rather than
    // from the module under test — a test that called `readVersion` would agree
    // with it however wrong it got.
    const manifest: unknown = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
    );
    const version =
      typeof manifest === 'object' && manifest !== null && 'version' in manifest
        ? String(manifest.version)
        : '';
    expect(version).not.toBe('');

    for (const flag of ['--version', '-V']) {
      const result = await runCli([flag]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe(version);
    }
  });

  it('exits non-zero and points at help for an unknown command', async () => {
    const result = await runCli(['nonsense']);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('nonsense');
    expect(result.stderr).toContain('wayfinder --help');
  });

  it('drives the no-TTY path against a temporary directory tree', async () => {
    await withTempDir(async (dir) => {
      const result = await runCli(['skills'], { home: dir, cwd: dir, isTTY: false });
      expect(result.exitCode).toBe(0);
    });
  });
});
