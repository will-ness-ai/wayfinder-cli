import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runCli } from './fixtures/runCli.js';
import { withTempDir } from './fixtures/tempDir.js';

/** Write a project-scope config into a temp tree used as both home and cwd. */
function writeProjectConfig(dir: string, config: unknown): void {
  const file = join(dir, '.wayfinder', 'config.json');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(config, null, 2), 'utf8');
}

/** Render the wayfinder skill against a temp tree with the given config. */
function renderWayfinder(dir: string): ReturnType<typeof runCli> {
  return runCli(['skill', 'wayfinder'], { home: dir, cwd: dir, isTTY: false, env: {} });
}

describe('the wayfinder render', () => {
  it('inlines the grilling body once, anchored at its reference site', async () => {
    const { stdout } = await runCli(['skill', 'wayfinder']);
    const grillingLine = (await runCli(['skill', 'grilling'])).stdout.trim().split('\n')[0] ?? '';
    // The grilling body composes in from grilling's single source file...
    expect(stdout).toContain(grillingLine);
    // ...exactly once. No source file holds a second copy.
    expect(stdout.split(grillingLine)).toHaveLength(2);
    // The reference site is chart mode, which needs the protocol before any ticket exists.
    const chartIndex = stdout.indexOf('### Chart the map');
    expect(stdout.indexOf(grillingLine)).toBeGreaterThan(chartIndex);
  });

  it('retargets decision-conversation references to grill-with-docs and drops subagents', async () => {
    const { stdout } = await runCli(['skill', 'wayfinder']);
    expect(stdout).toContain('`wayfinder skill grill-with-docs`');
    expect(stdout).not.toContain('subagent');
    expect(stdout).not.toContain('/domain-modeling');
    expect(stdout).not.toContain('/grilling');
    // The parallel-work line stays; it covers the case the deleted exception used to.
    expect(stdout).toContain('run unblocked tickets in parallel');
  });

  it('has no children block, being a single-file skill', async () => {
    const { stdout } = await runCli(['skill', 'wayfinder']);
    expect(stdout).not.toContain('## Disclosed files');
  });

  it('inserts the composed body verbatim, not as a replacement pattern', async () => {
    // `$&`/`$$` are `String.replace` patterns; the grilling body is composed in
    // through a function replacer, so no such sequence survives into the render.
    const { stdout } = await runCli(['skill', 'wayfinder']);
    expect(stdout).not.toContain('wayfinder:inline grilling');
  });

  it('appends the notice-and-ask block when no tracker is configured', async () => {
    await withTempDir(async (dir) => {
      const result = await renderWayfinder(dir);
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toMatchSnapshot();
    });
  });

  it('names the tracker when a value resolves to no shipped doc', async () => {
    await withTempDir(async (dir) => {
      writeProjectConfig(dir, { tracker: { value: 'notion' } });
      const result = await renderWayfinder(dir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatchSnapshot();
    });
  });

  it('carries the whole tracker doc when a value resolves to a shipped doc', async () => {
    await withTempDir(async (dir) => {
      writeProjectConfig(dir, { tracker: { value: 'github cli' } });
      const result = await renderWayfinder(dir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatchSnapshot();
    });
  });
});

describe('the wayfinder skill-planning section', () => {
  it('replaces Ticket Types, rendering the core entries from the registry', async () => {
    await withTempDir(async (dir) => {
      const { stdout } = await renderWayfinder(dir);
      expect(stdout).toContain('## Skill planning');
      expect(stdout).not.toContain('## Ticket Types');
      // Core entries, in registry order: grill-with-docs (default), research, prototype.
      expect(stdout).toContain(
        '- `wayfinder skill grill-with-docs` — the default decision conversation',
      );
      expect(stdout).toContain('- `wayfinder skill research` — when a fact outside');
      expect(stdout).toContain('- `wayfinder skill prototype` — when the open question');
      const order = ['grill-with-docs', 'research', 'prototype'].map((id) =>
        stdout.indexOf(`wayfinder skill ${id}`),
      );
      expect(order).toEqual([...order].sort((a, b) => a - b));
    });
  });

  it('states the one-rule readiness mapping with the literal label strings', async () => {
    await withTempDir(async (dir) => {
      const { stdout } = await renderWayfinder(dir);
      expect(stdout).toContain('`ready-for-agent`');
      expect(stdout).toContain('`ready-for-human`');
    });
  });

  it('names how to register when no ticket skills are configured', async () => {
    await withTempDir(async (dir) => {
      const { stdout } = await renderWayfinder(dir);
      expect(stdout).toContain('### Ticket skills');
      expect(stdout).toContain('No ticket skills are registered');
    });
  });

  it('renders one row per effective registration, each with its when sentence', async () => {
    await withTempDir(async (dir) => {
      writeProjectConfig(dir, {
        ticketSkills: {
          'pre-mortem': { when: 'the ticket carries deploy or migration risk' },
          'frontend-loop': { when: 'the ticket changes the UI' },
        },
      });
      const result = await renderWayfinder(dir);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(
        '- **pre-mortem** — when the ticket carries deploy or migration risk',
      );
      expect(result.stdout).toContain('- **frontend-loop** — when the ticket changes the UI');
      expect(result.stdout).not.toContain('No ticket skills are registered');
      expect(result.stdout).toMatchSnapshot();
    });
  });
});
