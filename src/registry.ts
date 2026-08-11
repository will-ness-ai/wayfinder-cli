/**
 * The served set. A skill **id** is logical: it carries no `.md` and no
 * directory name. Each entry names the single source file the render reads, the
 * dependencies it inlines at render, and the child ids it discloses.
 *
 * Two tiers share one shape:
 *
 * - **Listed** entries are the rows `wayfinder skills` prints. They are the
 *   forked skills.
 * - **Sub-tree** entries are the disclosed leaves (`prototype/logic`, the
 *   domain-modeling formats). They serve through `wayfinder skill <id>` but do
 *   not list on their own; they appear only as a parent's child.
 */
export interface SkillEntry {
  /** The logical id, as typed after `wayfinder skill`. */
  id: string;
  /** The source file to render, relative to the content root. */
  source: string;
  /**
   * Dependency ids to inline at render, in order, each composed raw from its own
   * single source file. A host with inlines renders its composition, not its own
   * body — the source body is the reference the composition replaces.
   */
  inlines: string[];
  /** Disclosed child ids, in listing and children-block order. */
  children: string[];
  /** Where the row comes from. Every forked skill is `core`. */
  origin: 'core';
  /**
   * The firing condition a parent's children block prints beside this id's
   * command. Set on disclosed sub-tree leaves; the fetch is worth making only
   * when this moment arrives.
   */
  when?: string;
}

/** The forked skills, in listing order. These are the rows `wayfinder skills` prints. */
export const registry: SkillEntry[] = [
  { id: 'wayfinder', source: 'skills/wayfinder/SKILL.md', inlines: [], children: [], origin: 'core' },
  { id: 'grilling', source: 'skills/grilling/SKILL.md', inlines: [], children: [], origin: 'core' },
  {
    id: 'domain-modeling',
    source: 'skills/domain-modeling/SKILL.md',
    inlines: [],
    children: ['domain-modeling/adr-format', 'domain-modeling/context-format'],
    origin: 'core',
  },
  {
    id: 'grill-with-docs',
    source: 'skills/grill-with-docs/SKILL.md',
    inlines: ['grilling', 'domain-modeling'],
    children: ['domain-modeling/adr-format', 'domain-modeling/context-format'],
    origin: 'core',
  },
  { id: 'research', source: 'skills/research/SKILL.md', inlines: [], children: [], origin: 'core' },
  {
    id: 'prototype',
    source: 'skills/prototype/SKILL.md',
    inlines: [],
    children: ['prototype/logic', 'prototype/ui'],
    origin: 'core',
  },
  { id: 'to-spec', source: 'skills/to-spec/SKILL.md', inlines: [], children: [], origin: 'core' },
  { id: 'to-tickets', source: 'skills/to-tickets/SKILL.md', inlines: [], children: [], origin: 'core' },
];

/**
 * The disclosed sub-tree leaves. Each serves through `wayfinder skill <id>` and
 * carries the firing condition its parent's children block shows.
 */
const subtree: SkillEntry[] = [
  {
    id: 'prototype/logic',
    source: 'skills/prototype/LOGIC.md',
    inlines: [],
    children: [],
    origin: 'core',
    when: 'the question is whether a logic or state model feels right',
  },
  {
    id: 'prototype/ui',
    source: 'skills/prototype/UI.md',
    inlines: [],
    children: [],
    origin: 'core',
    when: 'the question is what a UI should look like',
  },
  {
    id: 'domain-modeling/adr-format',
    source: 'skills/domain-modeling/ADR-FORMAT.md',
    inlines: [],
    children: [],
    origin: 'core',
    when: 'you are recording an architectural decision',
  },
  {
    id: 'domain-modeling/context-format',
    source: 'skills/domain-modeling/CONTEXT-FORMAT.md',
    inlines: [],
    children: [],
    origin: 'core',
    when: 'you are writing or updating the glossary',
  },
];

/** Every served entry: the listed forked skills plus the disclosed sub-tree leaves. */
export const served: SkillEntry[] = [...registry, ...subtree];

/** Look up a served entry by its logical id. */
export function findSkill(id: string): SkillEntry | undefined {
  return served.find((entry) => entry.id === id);
}
