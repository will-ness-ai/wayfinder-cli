import { readContent } from './content.js';
import { parseSource } from './frontmatter.js';
import type { SkillEntry } from './registry.js';

/**
 * Render one skill to the markdown a `wayfinder skill <id>` call prints.
 *
 * The render is raw here: one source file in, one document out, frontmatter
 * stripped and nothing added. Composition — inlined dependencies and children
 * blocks — arrives in later tickets.
 */
export function renderSkill(entry: SkillEntry): string {
  const { body } = parseSource(readContent(entry.source));
  return ensureTrailingNewline(body);
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

function ensureTrailingNewline(text: string): string {
  return text.endsWith('\n') ? text : `${text}\n`;
}
