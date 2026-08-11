import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runCli } from './fixtures/runCli.js';
import { withTempDir } from './fixtures/tempDir.js';

type Scope = 'local' | 'project' | 'user';

function scopeFile(dir: string, scope: Scope): string {
  switch (scope) {
    case 'local':
      return join(dir, '.wayfinder', 'local.json');
    case 'project':
      return join(dir, '.wayfinder', 'config.json');
    case 'user':
      return join(dir, '.config', 'wayfinder', 'config.json');
  }
}

function writeConfig(dir: string, scope: Scope, config: unknown): void {
  const file = scopeFile(dir, scope);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(config, null, 2), 'utf8');
}

/** Install a harness skill under one of the four locations doctor checks. */
function installHarnessSkill(root: string, base: '.claude' | '.agents', name: string): void {
  const file = join(root, base, 'skills', name, 'SKILL.md');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `---\nname: ${name}\n---\n\nBody.\n`, 'utf8');
}

function inDir(dir: string): { home: string; cwd: string; isTTY: false } {
  return { home: dir, cwd: dir, isTTY: false };
}

describe('wayfinder doctor', () => {
  it('reports a registered ticket skill that resolves to no installed harness skill', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', { ticketSkills: { 'pre-mortem': { when: 'risky' } } });
      const result = await runCli(['doctor'], inDir(dir));
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout).toContain('pre-mortem');
      expect(result.stdout).toContain('no installed harness skill');
    });
  });

  it('passes a ticket skill installed under any of the checked harness locations', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', { ticketSkills: { 'pre-mortem': { when: 'risky' } } });
      // Project scope, agents target — one of the four locations counts as installed.
      installHarnessSkill(dir, '.agents', 'pre-mortem');
      const result = await runCli(['doctor'], inDir(dir));
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('no problems found');
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
      expect(result.stdout).toContain('Tracker doc "./missing.md"');
      expect(result.stdout).toContain('does not resolve');
    });
  });

  it('does not flag a tracker doc that resolves', async () => {
    await withTempDir(async (dir) => {
      mkdirSync(join(dir, '.wayfinder', 'docs'), { recursive: true });
      writeFileSync(join(dir, '.wayfinder', 'docs', 'acme.md'), '## Ops\n', 'utf8');
      writeConfig(dir, 'project', { tracker: { value: 'acme', doc: './docs/acme.md' } });
      const result = await runCli(['doctor'], inDir(dir));
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('no problems found');
    });
  });

  it('reports a clean bill when nothing is registered and no doc is attached', async () => {
    await withTempDir(async (dir) => {
      const result = await runCli(['doctor'], inDir(dir));
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('no problems found');
    });
  });
});
