import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { inDir, onTerminal, scopeFile, writeConfig } from './fixtures/config.js';
import { runCli } from './fixtures/runCli.js';
import { withTempDir } from './fixtures/tempDir.js';

describe('wayfinder tracker show', () => {
  it('reports no tracker when none is configured', async () => {
    await withTempDir(async (dir) => {
      const result = await runCli(['tracker', 'show'], inDir(dir));
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('tracker: null');
    });
  });

  it('reports the effective value and the scope that supplied it', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', { tracker: { value: 'github cli' } });
      const result = await runCli(['tracker', 'show'], inDir(dir));
      expect(result.stdout).toContain('value: github cli');
      expect(result.stdout).toContain('scope: project');
    });
  });

  it('emits JSON under --json, and TOON without it', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', { tracker: { value: 'github cli', doc: './t.md' } });
      const json = await runCli(['tracker', 'show', '--json'], inDir(dir));
      expect(JSON.parse(json.stdout)).toEqual({
        tracker: { value: 'github cli', scope: 'project', doc: './t.md' },
      });
      const toon = await runCli(['tracker', 'show'], inDir(dir));
      expect(() => JSON.parse(toon.stdout)).toThrow();
    });
  });

  it('resolves local over project over user', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'user', { tracker: { value: 'jira mcp' } });
      writeConfig(dir, 'project', { tracker: { value: 'github cli' } });
      writeConfig(dir, 'local', { tracker: { value: 'local' } });
      const result = await runCli(['tracker', 'show'], inDir(dir));
      expect(result.stdout).toContain('value: local');
      expect(result.stdout).toContain('scope: local');
    });
  });

  it('follows XDG_CONFIG_HOME for the user scope when it is set', async () => {
    await withTempDir(async (dir) => {
      const xdg = join(dir, 'xdg');
      const file = join(xdg, 'wayfinder', 'config.json');
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify({ tracker: { value: 'linear mcp' } }), 'utf8');
      const result = await runCli(['tracker', 'show'], {
        home: dir,
        cwd: dir,
        isTTY: false,
        env: { XDG_CONFIG_HOME: xdg },
      });
      expect(result.stdout).toContain('value: linear mcp');
      expect(result.stdout).toContain('scope: user');
    });
  });
});

describe('wayfinder tracker resolves wholesale', () => {
  it('never pairs a project value with a user doc', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'user', { tracker: { value: 'jira mcp', doc: './user-doc.md' } });
      writeConfig(dir, 'project', { tracker: { value: 'github cli' } });
      writeFileSync(join(dir, 'user-doc.md'), 'USER DOC BODY\n', 'utf8');
      const { stdout } = await runCli(['skill', 'tracker'], inDir(dir));
      // Project supplied the value wholesale; the shipped github doc renders.
      expect(stdout).toContain('## Issue tracker: github cli');
      expect(stdout).toContain('Use the [`gh`]');
      // The user-scope doc never leaks into a project-scope resolution.
      expect(stdout).not.toContain('USER DOC BODY');
    });
  });
});

describe('wayfinder tracker set', () => {
  it('writes the value to the project config by default', async () => {
    await withTempDir(async (dir) => {
      const result = await runCli(['tracker', 'set', 'github', 'cli'], inDir(dir));
      expect(result.exitCode).toBe(0);
      const written = JSON.parse(readFileSync(scopeFile(dir, 'project'), 'utf8'));
      expect(written).toEqual({ tracker: { value: 'github cli' } });
      // The written value round-trips through show.
      const show = await runCli(['tracker', 'show'], inDir(dir));
      expect(show.stdout).toContain('value: github cli');
      expect(show.stdout).toContain('scope: project');
    });
  });

  it('writes the user scope under --user', async () => {
    await withTempDir(async (dir) => {
      await runCli(['tracker', 'set', 'linear', 'mcp', '--user'], inDir(dir));
      const written = JSON.parse(readFileSync(scopeFile(dir, 'user'), 'utf8'));
      expect(written).toEqual({ tracker: { value: 'linear mcp' } });
    });
  });

  it('stores the doc path, not a copy', async () => {
    await withTempDir(async (dir) => {
      await runCli(['tracker', 'set', 'github', 'cli', '--doc', './docs/t.md'], inDir(dir));
      const written = JSON.parse(readFileSync(scopeFile(dir, 'project'), 'utf8'));
      expect(written.tracker).toEqual({ value: 'github cli', doc: './docs/t.md' });
    });
  });

  it('preserves other keys already in the config file', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', { ticketSkills: { 'pre-mortem': { when: 'risky' } } });
      await runCli(['tracker', 'set', 'local'], inDir(dir));
      const written = JSON.parse(readFileSync(scopeFile(dir, 'project'), 'utf8'));
      expect(written.ticketSkills).toEqual({ 'pre-mortem': { when: 'risky' } });
      expect(written.tracker).toEqual({ value: 'local' });
    });
  });

  it('refuses to write over a malformed config rather than clobbering it', async () => {
    await withTempDir(async (dir) => {
      const file = scopeFile(dir, 'project');
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, '{ this is not json', 'utf8');
      const result = await runCli(['tracker', 'set', 'github', 'cli'], inDir(dir));
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('is not valid JSON');
      // The malformed file is left untouched, never overwritten.
      expect(readFileSync(file, 'utf8')).toBe('{ this is not json');
    });
  });

  it('exits non-zero with a named example when no value is given and no TTY', async () => {
    await withTempDir(async (dir) => {
      const result = await runCli(['tracker', 'set'], inDir(dir));
      expect(result.exitCode).not.toBe(0);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain('tracker set needs a tracker value');
      expect(result.stderr).toContain('wayfinder tracker set "github cli"');
    });
  });
});

describe('the tracker set form', () => {
  it('fills the value, the doc, and the scope from the answers', async () => {
    await withTempDir(async (dir) => {
      const env = onTerminal(dir, ['github cli', './docs/t.md', 'user']);
      const result = await runCli(['tracker', 'set'], env);
      expect(result.exitCode).toBe(0);
      const written: unknown = JSON.parse(readFileSync(scopeFile(dir, 'user'), 'utf8'));
      expect(written).toEqual({ tracker: { value: 'github cli', doc: './docs/t.md' } });
    });
  });

  it('takes the project scope when the scope answer is empty', async () => {
    await withTempDir(async (dir) => {
      const result = await runCli(['tracker', 'set'], onTerminal(dir, ['local', '', '']));
      expect(result.exitCode).toBe(0);
      const written: unknown = JSON.parse(readFileSync(scopeFile(dir, 'project'), 'utf8'));
      expect(written).toEqual({ tracker: { value: 'local' } });
    });
  });

  it('does not re-ask for a flag already on the command line', async () => {
    await withTempDir(async (dir) => {
      const env = onTerminal(dir, ['github cli', '']);
      await runCli(['tracker', 'set', '--doc', './flagged.md', '--user'], env);
      expect(env.asked.join('\n')).not.toContain('Tracker doc path');
      expect(env.asked.join('\n')).not.toContain('Scope [project/user]');
      const written: unknown = JSON.parse(readFileSync(scopeFile(dir, 'user'), 'utf8'));
      expect(written).toEqual({ tracker: { value: 'github cli', doc: './flagged.md' } });
    });
  });

  it('gives up on an unanswerable prompt and reports the usage error', async () => {
    await withTempDir(async (dir) => {
      // An EOF answers empty forever; the form must stop rather than loop.
      const env = onTerminal(dir, []);
      const result = await runCli(['tracker', 'set'], env);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('tracker set needs a tracker value');
      expect(env.asked).toHaveLength(3);
    });
  });

  it('never runs on a TTY when the value is already given', async () => {
    await withTempDir(async (dir) => {
      const env = onTerminal(dir, ['should not be read']);
      await runCli(['tracker', 'set', 'github', 'cli'], env);
      expect(env.asked).toEqual([]);
    });
  });
});

describe('the local scope stays out of git', () => {
  it('writes an ignore rule beside the local config the first time it is created', async () => {
    await withTempDir(async (dir) => {
      await runCli(['ticket-skill', 'add', 'pre-mortem', '--when', 'risky', '--scope', 'local'], inDir(dir));
      const ignore = readFileSync(join(dir, '.wayfinder', '.gitignore'), 'utf8');
      expect(ignore).toBe('local.json\n');
    });
  });

  it('leaves an existing ignore file alone rather than duplicating the rule', async () => {
    await withTempDir(async (dir) => {
      mkdirSync(join(dir, '.wayfinder'), { recursive: true });
      writeFileSync(join(dir, '.wayfinder', '.gitignore'), 'local.json\nnotes.md\n', 'utf8');
      await runCli(['ticket-skill', 'add', 'pre-mortem', '--when', 'risky', '--scope', 'local'], inDir(dir));
      expect(readFileSync(join(dir, '.wayfinder', '.gitignore'), 'utf8')).toBe('local.json\nnotes.md\n');
    });
  });

  it('appends the rule to an unrelated ignore file without eating its last line', async () => {
    await withTempDir(async (dir) => {
      mkdirSync(join(dir, '.wayfinder'), { recursive: true });
      writeFileSync(join(dir, '.wayfinder', '.gitignore'), 'notes.md', 'utf8');
      await runCli(['ticket-skill', 'add', 'pre-mortem', '--when', 'risky', '--scope', 'local'], inDir(dir));
      expect(readFileSync(join(dir, '.wayfinder', '.gitignore'), 'utf8')).toBe('notes.md\nlocal.json\n');
    });
  });

  it('plants no ignore rule for the project scope', async () => {
    await withTempDir(async (dir) => {
      await runCli(['tracker', 'set', 'github', 'cli'], inDir(dir));
      expect(existsSync(join(dir, '.wayfinder', '.gitignore'))).toBe(false);
    });
  });
});

describe('wayfinder skill tracker states', () => {
  it('renders the notice-and-ask block when no tracker is configured', async () => {
    await withTempDir(async (dir) => {
      const { stdout } = await runCli(['skill', 'tracker'], inDir(dir));
      expect(stdout).toMatchSnapshot();
    });
  });

  it('names the tracker and defers to the agent when the value ships no doc', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', { tracker: { value: 'jira mcp' } });
      const { stdout } = await runCli(['skill', 'tracker'], inDir(dir));
      expect(stdout).toMatchSnapshot();
    });
  });

  it('carries the whole shipped doc when the value resolves one', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', { tracker: { value: 'github cli' } });
      const { stdout } = await runCli(['skill', 'tracker'], inDir(dir));
      expect(stdout).toMatchSnapshot();
    });
  });

  it('derives the shipped filename by lower-casing and hyphenating whitespace', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', { tracker: { value: 'GitHub   CLI' } });
      const { stdout } = await runCli(['skill', 'tracker'], inDir(dir));
      // 'GitHub   CLI' → github-cli.md, so the shipped doc renders.
      expect(stdout).toContain('## Issue tracker: GitHub   CLI');
      expect(stdout).toContain('Use the [`gh`]');
    });
  });
});

describe('the tracker doc under --doc', () => {
  it('carries an attached doc, resolved against the config file that holds it', async () => {
    await withTempDir(async (dir) => {
      // The project config lives in `.wayfinder/`, so a relative doc resolves from there.
      mkdirSync(join(dir, '.wayfinder', 'docs'), { recursive: true });
      writeFileSync(join(dir, '.wayfinder', 'docs', 'acme.md'), '## Ops\n\nAcme steps here.\n', 'utf8');
      writeConfig(dir, 'project', { tracker: { value: 'acme', doc: './docs/acme.md' } });
      const { stdout } = await runCli(['skill', 'tracker'], inDir(dir));
      expect(stdout).toContain('## Issue tracker: acme');
      expect(stdout).toContain('Acme steps here.');
      // The doc's own heading demotes one level under the block title.
      expect(stdout).toContain('### Ops');
    });
  });

  it('degrades to the no-doc block when the attached path does not resolve', async () => {
    await withTempDir(async (dir) => {
      writeConfig(dir, 'project', { tracker: { value: 'acme', doc: './missing.md' } });
      const { stdout } = await runCli(['skill', 'tracker'], inDir(dir));
      expect(stdout).toContain('## Issue tracker: acme');
      expect(stdout).toContain('No operations prose ships');
    });
  });

  it('replaces the shipped doc rather than merging with it', async () => {
    await withTempDir(async (dir) => {
      mkdirSync(join(dir, '.wayfinder', 'docs'), { recursive: true });
      writeFileSync(join(dir, '.wayfinder', 'docs', 'gh.md'), 'ATTACHED GITHUB DOC\n', 'utf8');
      writeConfig(dir, 'project', { tracker: { value: 'github cli', doc: './docs/gh.md' } });
      const { stdout } = await runCli(['skill', 'tracker'], inDir(dir));
      expect(stdout).toContain('ATTACHED GITHUB DOC');
      // The shipped github-cli.md never merges in.
      expect(stdout).not.toContain('Use the [`gh`]');
    });
  });
});

describe('the to-spec and to-tickets tracker line', () => {
  for (const id of ['to-spec', 'to-tickets']) {
    it(`names the configured tracker and points at wayfinder skill tracker in ${id}`, async () => {
      await withTempDir(async (dir) => {
        writeConfig(dir, 'project', { tracker: { value: 'github cli' } });
        const { stdout } = await runCli(['skill', id], inDir(dir));
        expect(stdout).toContain("This repo's issue tracker is **github cli**.");
        expect(stdout).toContain('run `wayfinder skill tracker` first');
        // The doc is never inlined into these standalone renders.
        expect(stdout).not.toContain('Use the [`gh`]');
      });
    });

    it(`drops the label-vocabulary clause from ${id}`, async () => {
      const { stdout } = await runCli(['skill', id]);
      expect(stdout).not.toContain('label vocabulary');
      expect(stdout).not.toContain('should have been provided to you');
    });
  }

  it('points at wayfinder skill tracker even when none is configured', async () => {
    await withTempDir(async (dir) => {
      const { stdout } = await runCli(['skill', 'to-spec'], inDir(dir));
      expect(stdout).toContain('No issue tracker is configured');
      expect(stdout).toContain('`wayfinder skill tracker`');
    });
  });
});
