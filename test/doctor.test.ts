import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { inDir, installHarnessSkill, writeConfig } from './fixtures/config.js';
import { runCli } from './fixtures/runCli.js';
import { withTempDir } from './fixtures/tempDir.js';

describe('wayfinder doctor', () => {
  it('reports a registered ticket skill that resolves to no installed harness skill', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', { ticketSkills: { 'pre-mortem': { when: 'risky' } } });
      const result = await runCli(['doctor'], inDir(dir));
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout).toContain('pre-mortem');
      expect(result.stdout).toContain('no installed harness skill');
      expect(result.stdout).toMatchSnapshot();
    });
  });

  it('passes a ticket skill installed under any of the checked harness locations', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', { ticketSkills: { 'pre-mortem': { when: 'risky' } } });
      // Project scope, agents target — one of the four locations counts as installed.
      installHarnessSkill(dir, '.agents', 'pre-mortem');
      const result = await runCli(['doctor'], inDir(dir));
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatchSnapshot();
    });
  });

  it('finds a user-scope harness skill through the home directory', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'user', { ticketSkills: { 'frontend-loop': { when: 'ui' } } });
      installHarnessSkill(dir, '.claude', 'frontend-loop');
      const result = await runCli(['doctor'], inDir(dir));
      expect(result.exitCode).toBe(0);
    });
  });

  it('reports a tracker doc path that does not resolve', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', { tracker: { value: 'acme', doc: './missing.md' } });
      const result = await runCli(['doctor'], inDir(dir));
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout).toContain('./missing.md');
      expect(result.stdout).toContain('does not resolve');
      expect(result.stdout).toMatchSnapshot();
    });
  });

  it('does not flag a tracker doc that resolves', async () => {
    await withTempDir(async (dir) => {
      mkdirSync(join(dir, '.wayfinder', 'docs'), { recursive: true });
      writeFileSync(join(dir, '.wayfinder', 'docs', 'acme.md'), '## Ops\n', 'utf8');
      writeConfig(dir, 'project', { tracker: { value: 'acme', doc: './docs/acme.md' } });
      const result = await runCli(['doctor'], inDir(dir));
      expect(result.exitCode).toBe(0);
    });
  });

  it('reports a clean bill when nothing is registered and no doc is attached', async () => {
    await withTempDir(async (dir) => {
      const result = await runCli(['doctor'], inDir(dir));
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatchSnapshot();
    });
  });

  it('emits JSON under --json, and TOON without it', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', { ticketSkills: { 'pre-mortem': { when: 'risky' } } });

      const json = await runCli(['doctor', '--json'], inDir(dir));
      const parsed: unknown = JSON.parse(json.stdout);
      expect(parsed).toEqual({
        problems: [
          {
            kind: 'ticket-skill',
            subject: 'pre-mortem',
            detail: expect.stringContaining('no installed harness skill'),
          },
        ],
      });
      // A finding still exits non-zero, whichever way it is rendered.
      expect(json.exitCode).not.toBe(0);

      const toon = await runCli(['doctor'], inDir(dir));
      expect(() => JSON.parse(toon.stdout)).toThrow();
    });
  });
});
