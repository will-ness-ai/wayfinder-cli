/**
 * The served set. A skill **id** is logical: it carries no `.md` and no
 * directory name. Each entry names the single source file the render reads and
 * the child ids the skill discloses.
 *
 * Sub-tree ids (`prototype/logic`, the domain-modeling formats) and the
 * `tracker` id arrive in later tickets; this foundation serves the eight forked
 * skills, each rendered raw from its own source file.
 */
export interface SkillEntry {
  /** The logical id, as typed after `wayfinder skill`. */
  id: string;
  /** The source file to render, relative to the content root. */
  source: string;
  /** Disclosed child ids, in listing order. */
  children: string[];
  /** Where the row comes from. Every forked skill is `core`. */
  origin: 'core';
}

export const registry: SkillEntry[] = [
  { id: 'wayfinder', source: 'skills/wayfinder/SKILL.md', children: [], origin: 'core' },
  { id: 'grilling', source: 'skills/grilling/SKILL.md', children: [], origin: 'core' },
  {
    id: 'domain-modeling',
    source: 'skills/domain-modeling/SKILL.md',
    children: ['domain-modeling/adr-format', 'domain-modeling/context-format'],
    origin: 'core',
  },
  {
    id: 'grill-with-docs',
    source: 'skills/grill-with-docs/SKILL.md',
    children: ['domain-modeling/adr-format', 'domain-modeling/context-format'],
    origin: 'core',
  },
  { id: 'research', source: 'skills/research/SKILL.md', children: [], origin: 'core' },
  {
    id: 'prototype',
    source: 'skills/prototype/SKILL.md',
    children: ['prototype/logic', 'prototype/ui'],
    origin: 'core',
  },
  { id: 'to-spec', source: 'skills/to-spec/SKILL.md', children: [], origin: 'core' },
  { id: 'to-tickets', source: 'skills/to-tickets/SKILL.md', children: [], origin: 'core' },
];

/** Look up a served entry by its logical id. */
export function findSkill(id: string): SkillEntry | undefined {
  return registry.find((entry) => entry.id === id);
}
