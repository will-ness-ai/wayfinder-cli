import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Ask, CliEnv } from '../../src/env.js';

/** The three config scopes, as the tests name them. */
export type Scope = 'local' | 'project' | 'user';

/**
 * Where each scope's config file belongs under a temporary tree.
 *
 * These paths are spelled out here rather than imported from `src/config.ts`
 * on purpose: the layout is part of the contract the spec fixes, so a test that
 * asserted it by calling the implementation would agree with any change to it.
 */
export function scopeFile(dir: string, scope: Scope): string {
  switch (scope) {
    case 'local':
      return join(dir, '.wayfinder', 'local.json');
    case 'project':
      return join(dir, '.wayfinder', 'config.json');
    case 'user':
      return join(dir, '.config', 'wayfinder', 'config.json');
  }
}

/** Plant a config file at one scope of a temporary tree. */
export function writeConfig(dir: string, scope: Scope, config: unknown): void {
  const file = scopeFile(dir, scope);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(config, null, 2), 'utf8');
}

/** Install a harness skill under one of the four locations `doctor` checks. */
export function installHarnessSkill(root: string, base: '.claude' | '.agents', name: string): void {
  const file = join(root, base, 'skills', name, 'SKILL.md');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `---\nname: ${name}\n---\n\nBody.\n`, 'utf8');
}

/** An injected environment rooted at one temporary directory, with no terminal. */
export function inDir(dir: string): Pick<CliEnv, 'home' | 'cwd' | 'isTTY'> {
  return { home: dir, cwd: dir, isTTY: false };
}

/**
 * An injected environment with a terminal and a scripted set of answers — how a
 * test drives a form. Answers are consumed in order; once they run out every
 * further question answers empty, which is the EOF each form's give-up counter
 * reads. `asked` records the questions, so a test can assert what the human saw.
 */
export function onTerminal(
  dir: string,
  answers: string[],
): Pick<CliEnv, 'home' | 'cwd' | 'isTTY' | 'ask'> & { asked: string[] } {
  const remaining = [...answers];
  const asked: string[] = [];
  const ask: Ask = async (question) => {
    asked.push(question);
    return remaining.shift() ?? '';
  };
  return { home: dir, cwd: dir, isTTY: true, ask, asked };
}
