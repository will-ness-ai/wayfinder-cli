import { describe, expect, it } from 'vitest';
import { runCli } from './fixtures/runCli.js';

interface SkillsPayload {
  skills: Array<{ id: string; description: string; children: string[]; origin: string }>;
}

describe('wayfinder skills', () => {
  it('lists every served id with description and children as TOON by default', async () => {
    const result = await runCli(['skills']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatchSnapshot();
  });

  it('emits parseable JSON under --json', async () => {
    const result = await runCli(['skills', '--json']);
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout) as SkillsPayload;
    const ids = payload.skills.map((row) => row.id);
    expect(ids).toContain('wayfinder');
    expect(ids).toContain('to-tickets');
    expect(ids).toHaveLength(9);
  });

  it('serves the tracker row with origin tracker', async () => {
    const result = await runCli(['skills', '--json']);
    const payload = JSON.parse(result.stdout) as SkillsPayload;
    const tracker = payload.skills.find((row) => row.id === 'tracker');
    expect(tracker?.origin).toBe('tracker');
    expect(tracker?.description.length).toBeGreaterThan(0);
  });

  it('reports the children of skills that disclose sub-files', async () => {
    const result = await runCli(['skills', '--json']);
    const payload = JSON.parse(result.stdout) as SkillsPayload;
    const prototype = payload.skills.find((row) => row.id === 'prototype');
    expect(prototype?.children).toEqual(['prototype/logic', 'prototype/ui']);
    const grilling = payload.skills.find((row) => row.id === 'grilling');
    expect(grilling?.children).toEqual([]);
  });

  it('carries a description drawn from each source frontmatter', async () => {
    const result = await runCli(['skills', '--json']);
    const payload = JSON.parse(result.stdout) as SkillsPayload;
    for (const row of payload.skills) {
      expect(row.description.length).toBeGreaterThan(0);
    }
  });

  it('defaults to TOON, not JSON', async () => {
    const result = await runCli(['skills']);
    expect(() => JSON.parse(result.stdout)).toThrow();
    expect(result.stdout).toContain('skills[9]:');
  });
});
