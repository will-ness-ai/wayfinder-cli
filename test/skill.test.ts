import { describe, expect, it } from 'vitest';
import { runCli } from './fixtures/runCli.js';
import { served } from '../src/registry.js';

describe('wayfinder skill <id>', () => {
  for (const entry of served) {
    it(`renders ${entry.id} against a committed snapshot`, async () => {
      const result = await runCli(['skill', entry.id]);
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toMatchSnapshot();
    });
  }

  it('strips frontmatter from the render', async () => {
    const result = await runCli(['skill', 'wayfinder']);
    expect(result.stdout.startsWith('---')).toBe(false);
    expect(result.stdout).not.toContain('disable-model-invocation');
    expect(result.stdout).not.toContain('name: wayfinder');
  });

  it('exits non-zero and names the id for an unknown skill', async () => {
    const result = await runCli(['skill', 'does-not-exist']);
    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('does-not-exist');
    expect(result.stderr).toContain('wayfinder skills');
  });

  it('reports a usage error when no id is given', async () => {
    const result = await runCli(['skill']);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('wayfinder skill <id>');
  });

  describe('composition', () => {
    it('inlines grilling and domain-modeling into grill-with-docs, raw', async () => {
      const { stdout } = await runCli(['skill', 'grill-with-docs']);
      // The grilling body, verbatim.
      expect(stdout).toContain('Interview me relentlessly about every aspect of this');
      // The domain-modeling body, with its top heading demoted one level.
      expect(stdout).toContain('## Domain Modeling');
      expect(stdout).not.toContain('\n# Domain Modeling');
      // No framing prose, and the upstream harness-command reference is gone.
      expect(stdout).not.toContain('Run a `/grilling` session');
    });

    it('composes grill-with-docs from single source files, holding no copy', async () => {
      const composed = (await runCli(['skill', 'grill-with-docs'])).stdout;
      const grilling = (await runCli(['skill', 'grilling'])).stdout.trim();
      const domainModeling = (await runCli(['skill', 'domain-modeling'])).stdout;
      // Every grilling line the source holds appears in the composition.
      for (const line of grilling.split('\n')) {
        if (line.trim()) expect(composed).toContain(line);
      }
      // The domain-modeling render carries its own children block; the inline does not.
      expect(domainModeling).toContain('## Disclosed files');
    });

    it('points grill-with-docs at the format leaves without inlining them', async () => {
      const { stdout } = await runCli(['skill', 'grill-with-docs']);
      expect(stdout).toContain('`wayfinder skill domain-modeling/adr-format`');
      expect(stdout).toContain('`wayfinder skill domain-modeling/context-format`');
      // Body unique to the format leaves never appears inline.
      expect(stdout).not.toContain('use sequential numbering');
      expect(stdout).not.toContain('**Be opinionated.**');
    });
  });

  describe('children block', () => {
    it('ends a render with sub-files with one command-and-condition row per child', async () => {
      const { stdout } = await runCli(['skill', 'prototype']);
      expect(stdout).toContain('## Disclosed files');
      expect(stdout).toContain(
        '- `wayfinder skill prototype/logic` — when the question is whether a logic or state model feels right',
      );
      expect(stdout).toContain(
        '- `wayfinder skill prototype/ui` — when the question is what a UI should look like',
      );
    });

    it('omits the block from a render with no sub-files', async () => {
      for (const id of ['grilling', 'research', 'to-spec', 'to-tickets', 'wayfinder']) {
        const { stdout } = await runCli(['skill', id]);
        expect(stdout).not.toContain('## Disclosed files');
      }
    });
  });

  describe('the disclosed sub-tree ids', () => {
    const leafIds = [
      'prototype/logic',
      'prototype/ui',
      'domain-modeling/adr-format',
      'domain-modeling/context-format',
    ];

    for (const id of leafIds) {
      it(`serves ${id} raw from its own source file`, async () => {
        const result = await runCli(['skill', id]);
        expect(result.exitCode).toBe(0);
        expect(result.stderr).toBe('');
        expect(result.stdout.length).toBeGreaterThan(0);
        // A leaf has no sub-files of its own.
        expect(result.stdout).not.toContain('## Disclosed files');
      });
    }

    it('keeps the leaves off the `wayfinder skills` listing', async () => {
      const { stdout } = await runCli(['skills', '--json']);
      const listedIds = (JSON.parse(stdout) as { skills: Array<{ id: string }> }).skills.map(
        (row) => row.id,
      );
      for (const id of leafIds) {
        expect(listedIds).not.toContain(id);
      }
    });
  });
});
