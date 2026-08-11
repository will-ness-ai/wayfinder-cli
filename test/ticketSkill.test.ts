import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

function readConfig(dir: string, scope: Scope): Record<string, unknown> {
  return JSON.parse(readFileSync(scopeFile(dir, scope), 'utf8')) as Record<string, unknown>;
}

function inDir(dir: string): { home: string; cwd: string; isTTY: false } {
  return { home: dir, cwd: dir, isTTY: false };
}

describe('wayfinder ticket-skill add', () => {
  it('registers a name and when sentence in the project scope by default', async () => {
    await withTempDir(async (dir) => {
      const result = await runCli(
        ['ticket-skill', 'add', 'pre-mortem', '--when', 'the ticket carries deploy risk'],
        inDir(dir),
      );
      expect(result.exitCode).toBe(0);
      expect(readConfig(dir, 'project')).toEqual({
        ticketSkills: { 'pre-mortem': { when: 'the ticket carries deploy risk' } },
      });
    });
  });

  it('writes the chosen scope under --scope', async () => {
    await withTempDir(async (dir) => {
      await runCli(
        ['ticket-skill', 'add', 'frontend-loop', '--when', 'the ticket is frontend', '--scope', 'user'],
        inDir(dir),
      );
      expect(readConfig(dir, 'user')).toEqual({
        ticketSkills: { 'frontend-loop': { when: 'the ticket is frontend' } },
      });
    });
  });

  it('carries only the three schema fields — no source, host, during, or readiness', async () => {
    await withTempDir(async (dir) => {
      await runCli(['ticket-skill', 'add', 'pre-mortem', '--when', 'risky'], inDir(dir));
      const stored = readConfig(dir, 'project').ticketSkills as Record<string, unknown>;
      expect(Object.keys(stored['pre-mortem'] as object)).toEqual(['when']);
    });
  });

  it('requires a when sentence, naming the flag with an example when it is missing', async () => {
    await withTempDir(async (dir) => {
      const result = await runCli(['ticket-skill', 'add', 'pre-mortem'], inDir(dir));
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain('--when');
      expect(result.stderr).toContain('wayfinder ticket-skill add pre-mortem --when');
    });
  });

  it('refuses to overwrite a name already registered in the scope', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', { ticketSkills: { 'pre-mortem': { when: 'old' } } });
      const result = await runCli(
        ['ticket-skill', 'add', 'pre-mortem', '--when', 'new'],
        inDir(dir),
      );
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('already registered');
      // The prior registration is untouched.
      expect(readConfig(dir, 'project')).toEqual({
        ticketSkills: { 'pre-mortem': { when: 'old' } },
      });
    });
  });

  it('preserves a tracker key already in the config file', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', { tracker: { value: 'github cli' } });
      await runCli(['ticket-skill', 'add', 'pre-mortem', '--when', 'risky'], inDir(dir));
      const written = readConfig(dir, 'project');
      expect(written.tracker).toEqual({ value: 'github cli' });
      expect(written.ticketSkills).toEqual({ 'pre-mortem': { when: 'risky' } });
    });
  });

  it('rejects an unknown scope, naming the valid ones', async () => {
    await withTempDir(async (dir) => {
      const result = await runCli(
        ['ticket-skill', 'add', 'pre-mortem', '--when', 'risky', '--scope', 'global'],
        inDir(dir),
      );
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Unknown scope "global"');
      expect(result.stderr).toContain('local, project, user');
    });
  });
});

describe('wayfinder ticket-skill edit', () => {
  it('changes the when sentence of an existing registration', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', { ticketSkills: { 'pre-mortem': { when: 'old' } } });
      const result = await runCli(
        ['ticket-skill', 'edit', 'pre-mortem', '--when', 'the ticket carries migration risk'],
        inDir(dir),
      );
      expect(result.exitCode).toBe(0);
      expect(readConfig(dir, 'project')).toEqual({
        ticketSkills: { 'pre-mortem': { when: 'the ticket carries migration risk' } },
      });
    });
  });

  it('refuses to edit a name not registered in the scope', async () => {
    await withTempDir(async (dir) => {
      const result = await runCli(
        ['ticket-skill', 'edit', 'pre-mortem', '--when', 'new'],
        inDir(dir),
      );
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('No ticket skill "pre-mortem" is registered');
    });
  });
});

describe('wayfinder ticket-skill remove', () => {
  it('deletes a registration held directly in the scope', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', {
        ticketSkills: { 'pre-mortem': { when: 'risky' }, 'frontend-loop': { when: 'ui' } },
      });
      await runCli(['ticket-skill', 'remove', 'pre-mortem'], inDir(dir));
      expect(readConfig(dir, 'project').ticketSkills).toEqual({
        'frontend-loop': { when: 'ui' },
      });
    });
  });

  it('writes a tombstone to hide a registration inherited from a broader scope', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'user', { ticketSkills: { 'pre-mortem': { when: 'risky' } } });
      const result = await runCli(
        ['ticket-skill', 'remove', 'pre-mortem', '--scope', 'project'],
        inDir(dir),
      );
      expect(result.exitCode).toBe(0);
      expect(readConfig(dir, 'project').ticketSkills).toEqual({ 'pre-mortem': null });
      // The tombstone hides the inherited registration from the effective list.
      const list = await runCli(['ticket-skill', 'list', '--json'], inDir(dir));
      const payload = JSON.parse(list.stdout) as { ticketSkills: Array<{ name: string }> };
      expect(payload.ticketSkills).toEqual([]);
    });
  });
});

describe('wayfinder ticket-skill list', () => {
  it('shows each effective registration with its scope, as a union across scopes', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'user', { ticketSkills: { 'frontend-loop': { when: 'ui work' } } });
      writeConfig(dir, 'project', { ticketSkills: { 'pre-mortem': { when: 'risky work' } } });
      const result = await runCli(['ticket-skill', 'list', '--json'], inDir(dir));
      expect(result.exitCode).toBe(0);
      const payload = JSON.parse(result.stdout) as {
        ticketSkills: Array<{ name: string; when: string; scope: string }>;
      };
      const byName = Object.fromEntries(payload.ticketSkills.map((s) => [s.name, s]));
      expect(byName['pre-mortem']).toEqual({
        name: 'pre-mortem',
        when: 'risky work',
        scope: 'project',
      });
      expect(byName['frontend-loop']).toEqual({
        name: 'frontend-loop',
        when: 'ui work',
        scope: 'user',
      });
    });
  });

  it('defaults to TOON, not JSON', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', { ticketSkills: { 'pre-mortem': { when: 'risky' } } });
      const result = await runCli(['ticket-skill', 'list'], inDir(dir));
      expect(() => JSON.parse(result.stdout)).toThrow();
      expect(result.stdout).toContain('pre-mortem');
    });
  });
});
