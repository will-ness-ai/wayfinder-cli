import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runCli } from './fixtures/runCli.js';
import { withTempDir } from './fixtures/tempDir.js';

/** Every config and harness file resolves from the temp dir as both home and cwd. */
function inDir(dir: string): { home: string; cwd: string; isTTY: false } {
  return { home: dir, cwd: dir, isTTY: false };
}

function stubFile(dir: string, harness: 'claude' | 'agents'): string {
  const base = harness === 'claude' ? '.claude' : '.agents';
  return join(dir, base, 'skills', 'wayfinder', 'SKILL.md');
}

describe('wayfinder init', () => {
  it('writes exactly one stub to the selected harness', async () => {
    await withTempDir(async (dir) => {
      const result = await runCli(['init', '--harness', 'claude'], inDir(dir));
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Wrote .claude/skills/wayfinder/SKILL.md (new stub).');
      expect(existsSync(stubFile(dir, 'claude'))).toBe(true);
      // The stub is the whole deliverable, so it is asserted against a snapshot.
      expect(readFileSync(stubFile(dir, 'claude'), 'utf8')).toMatchSnapshot();
    });
  });

  it('writes one stub per selected harness under --harness claude,agents', async () => {
    await withTempDir(async (dir) => {
      const result = await runCli(['init', '--harness', 'claude,agents'], inDir(dir));
      expect(result.exitCode).toBe(0);
      expect(existsSync(stubFile(dir, 'claude'))).toBe(true);
      expect(existsSync(stubFile(dir, 'agents'))).toBe(true);
      // The two harnesses carry the identical stub.
      expect(readFileSync(stubFile(dir, 'claude'), 'utf8')).toBe(
        readFileSync(stubFile(dir, 'agents'), 'utf8'),
      );
    });
  });

  it('never writes one stub per served skill, and leaves a human-kept skill alone', async () => {
    await withTempDir(async (dir) => {
      // A skill the developer keeps installed under the same harness.
      const kept = join(dir, '.claude', 'skills', 'to-spec', 'SKILL.md');
      mkdirSync(join(dir, '.claude', 'skills', 'to-spec'), { recursive: true });
      writeFileSync(kept, 'MY OWN TO-SPEC\n', 'utf8');

      await runCli(['init', '--harness', 'claude'], inDir(dir));

      // Exactly one stub is written — for the wayfinder id, not one per served skill.
      expect(existsSync(stubFile(dir, 'claude'))).toBe(true);
      expect(existsSync(join(dir, '.claude', 'skills', 'grilling', 'SKILL.md'))).toBe(false);
      expect(existsSync(join(dir, '.claude', 'skills', 'prototype', 'SKILL.md'))).toBe(false);
      // The human-kept skill is untouched.
      expect(readFileSync(kept, 'utf8')).toBe('MY OWN TO-SPEC\n');
    });
  });

  it('is idempotent: a second run reports the stub is already up to date', async () => {
    await withTempDir(async (dir) => {
      await runCli(['init', '--harness', 'claude'], inDir(dir));
      const again = await runCli(['init', '--harness', 'claude'], inDir(dir));
      expect(again.exitCode).toBe(0);
      expect(again.stdout).toContain('.claude/skills/wayfinder/SKILL.md is already up to date.');
    });
  });

  it('repairs a damaged stub and reports a diff of what changed', async () => {
    await withTempDir(async (dir) => {
      await runCli(['init', '--harness', 'claude'], inDir(dir));
      const path = stubFile(dir, 'claude');
      const good = readFileSync(path, 'utf8');
      // A developer (or a bad merge) mangles the start line.
      writeFileSync(path, good.replace('Your next action MUST', 'do whatever'), 'utf8');

      const result = await runCli(['init', '--harness', 'claude'], inDir(dir));
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Repaired .claude/skills/wayfinder/SKILL.md:');
      expect(result.stdout).toContain('- do whatever');
      expect(result.stdout).toContain('+ Your next action MUST');
      // The stub is restored to the canonical content.
      expect(readFileSync(path, 'utf8')).toBe(good);
    });
  });

  it('exits non-zero and names the flag when no harness is given and no TTY', async () => {
    await withTempDir(async (dir) => {
      const result = await runCli(['init'], inDir(dir));
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain('--harness');
      expect(result.stderr).toContain('wayfinder init --harness claude,agents');
    });
  });

  it('rejects an unknown harness id with the valid ids', async () => {
    await withTempDir(async (dir) => {
      const result = await runCli(['init', '--harness', 'vscode'], inDir(dir));
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Unknown harness "vscode"');
      expect(result.stderr).toContain('claude, agents');
    });
  });
});

describe('wayfinder init stub content', () => {
  it('carries the hardened start line and no tracker or registration material', async () => {
    await withTempDir(async (dir) => {
      await runCli(['init', '--harness', 'claude'], inDir(dir));
      const stub = readFileSync(stubFile(dir, 'claude'), 'utf8');
      expect(stub).toContain('Your next action MUST be to run `wayfinder skill wayfinder`');
      // The command map lists the served planning skills, with children noted.
      expect(stub).toContain('- `grilling` —');
      expect(stub).toContain('- `prototype` —');
      expect(stub).toContain('(children: logic, ui)');
      // It never carries tracker or registration material.
      expect(stub).not.toContain('wayfinder skill tracker');
      expect(stub).not.toContain('ticketSkills');
      expect(stub).not.toContain('tracker set');
    });
  });
});

describe('init and the tracker', () => {
  it('records the tracker in project config under --tracker', async () => {
    await withTempDir(async (dir) => {
      const result = await runCli(
        ['init', '--harness', 'claude', '--tracker', 'github cli'],
        inDir(dir),
      );
      expect(result.exitCode).toBe(0);
      const config = JSON.parse(readFileSync(join(dir, '.wayfinder', 'config.json'), 'utf8'));
      expect(config.tracker).toEqual({ value: 'github cli' });
    });
  });

  it('preserves a doc attached by tracker set --doc when recording the value', async () => {
    await withTempDir(async (dir) => {
      await runCli(['tracker', 'set', 'github', 'cli', '--doc', './docs/gh.md'], inDir(dir));
      await runCli(['init', '--harness', 'claude', '--tracker', 'linear mcp'], inDir(dir));
      const config = JSON.parse(readFileSync(join(dir, '.wayfinder', 'config.json'), 'utf8'));
      // The value updates, but the developer's doc path is never silently dropped.
      expect(config.tracker).toEqual({ value: 'linear mcp', doc: './docs/gh.md' });
    });
  });

  it('leaves the stub alone when tracker set writes config', async () => {
    await withTempDir(async (dir) => {
      await runCli(['init', '--harness', 'claude'], inDir(dir));
      const before = readFileSync(stubFile(dir, 'claude'), 'utf8');
      await runCli(['tracker', 'set', 'github', 'cli'], inDir(dir));
      // tracker set never touches the stub — init is its only writer.
      expect(readFileSync(stubFile(dir, 'claude'), 'utf8')).toBe(before);
    });
  });
});
