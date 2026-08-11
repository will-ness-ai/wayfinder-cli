import { readContent } from './content.js';
import { parseSource } from './frontmatter.js';
import { findSkill, type SkillEntry } from './registry.js';

/**
 * Render one skill to the markdown a `wayfinder skill <id>` call prints.
 *
 * The render composes. A host with inline dependencies renders each dependency
 * raw — frontmatter stripped, headings demoted, no framing prose added — from
 * the dependency's single source file, in place of its own reference body. A
 * host with no inlines renders its own body raw. Either way, a host with
 * disclosed children ends with a children block: one runnable command per child,
 * each with the condition that makes the fetch worth making. No source file ever
 * holds a copy of another.
 */
export function renderSkill(entry: SkillEntry): string {
  const sections =
    entry.inlines.length > 0
      ? entry.inlines.map(inlineBody)
      : [parseSource(readContent(entry.source)).body];

  if (entry.children.length > 0) {
    sections.push(childrenBlock(entry.children));
  }

  return `${sections.map((section) => section.trimEnd()).join('\n\n')}\n`;
}

/** One row of the `wayfinder skills` listing. */
export interface SkillListing {
  id: string;
  description: string;
  children: string[];
  origin: SkillEntry['origin'];
}

/** Build the listing row for one served entry, reading its description. */
export function listingFor(entry: SkillEntry): SkillListing {
  const { frontmatter } = parseSource(readContent(entry.source));
  return {
    id: entry.id,
    description: frontmatter.description ?? '',
    children: entry.children,
    origin: entry.origin,
  };
}

/** Compose one inlined dependency: its body, frontmatter stripped, headings demoted one level. */
function inlineBody(dependencyId: string): string {
  const dependency = findSkill(dependencyId);
  if (!dependency) {
    throw new Error(`Inline edge points at unknown dependency "${dependencyId}".`);
  }
  const { body } = parseSource(readContent(dependency.source));
  return demoteHeadings(body);
}

/** Add one level to every ATX heading, leaving headings inside fenced code blocks alone. */
function demoteHeadings(body: string): string {
  let insideFence = false;
  return body
    .split('\n')
    .map((line) => {
      if (/^(```|~~~)/.test(line)) {
        insideFence = !insideFence;
        return line;
      }
      if (insideFence) return line;
      const heading = /^(#{1,6})\s/.exec(line);
      if (!heading) return line;
      const hashes = heading[1] ?? '';
      const level = Math.min(hashes.length + 1, 6);
      return `${'#'.repeat(level)}${line.slice(hashes.length)}`;
    })
    .join('\n');
}

/** The block that closes a render with sub-files: one command per child, plus when to run it. */
function childrenBlock(childIds: string[]): string {
  const rows = childIds.map((id) => {
    const child = findSkill(id);
    return `- \`wayfinder skill ${id}\` — when ${child?.when ?? ''}`;
  });
  return ['## Disclosed files', '', ...rows].join('\n');
}
