import { describe, expect, it } from 'vitest';
import { runCli } from './fixtures/runCli.js';
import { registry } from '../src/registry.js';

describe('wayfinder skill <id>', () => {
  for (const entry of registry) {
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
});
