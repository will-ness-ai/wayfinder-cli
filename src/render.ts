import { readContent } from './content.js';
import { parseSource } from './frontmatter.js';
import { demoteHeadings } from './markdown.js';
import { findSkill, type SkillEntry } from './registry.js';
import type { ResolvedConfig } from './config.js';
import { renderTrackerBlock, trackerPointerLine } from './tracker.js';

/**
 * The upstream tracker line in `to-spec` and `to-tickets`. The render replaces
 * it with the tracker-naming pointer, so the source files stay byte-close to the
 * fork and carry no build markers.
 */
const TRACKER_LINE_ANCHOR =
  'The issue tracker and its label vocabulary should have been provided to you.';

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
 *
 * Two renders read the resolved config: the `tracker` entry, whose whole render
 * is the tracker block, and the `trackerPointer` skills, whose tracker line names
 * the configured tracker.
 */
export function renderSkill(entry: SkillEntry, config: ResolvedConfig): string {
  if (entry.origin === 'tracker') {
    return `${renderTrackerBlock(config).trimEnd()}\n`;
  }

  const sections =
    entry.inlines.length > 0 ? entry.inlines.map(inlineBody) : [ownBody(entry, config)];

  if (entry.children.length > 0) {
    sections.push(childrenBlock(entry.children));
  }

  return `${sections.map((section) => section.trimEnd()).join('\n\n')}\n`;
}

/** The host's own body, with the tracker line named when the entry carries a pointer. */
function ownBody(entry: SkillEntry, config: ResolvedConfig): string {
  const { body } = parseSource(readContent(sourceOf(entry)));
  if (entry.trackerPointer) {
    return body.replace(TRACKER_LINE_ANCHOR, trackerPointerLine(config));
  }
  return body;
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
  return {
    id: entry.id,
    description: descriptionOf(entry),
    children: entry.children,
    origin: entry.origin,
  };
}

/** The listing description: a built-in string, or the source frontmatter's. */
function descriptionOf(entry: SkillEntry): string {
  if (entry.source === undefined) return entry.description ?? '';
  return parseSource(readContent(entry.source)).frontmatter.description ?? '';
}

/** Compose one inlined dependency: its body, frontmatter stripped, headings demoted one level. */
function inlineBody(dependencyId: string): string {
  const dependency = findSkill(dependencyId);
  if (!dependency) {
    throw new Error(`Inline edge points at unknown dependency "${dependencyId}".`);
  }
  const { body } = parseSource(readContent(sourceOf(dependency)));
  return demoteHeadings(body);
}

/** The source path of an entry the render must read, or a clear error if it has none. */
function sourceOf(entry: SkillEntry): string {
  if (entry.source === undefined) {
    throw new Error(`Skill "${entry.id}" has no source file to render.`);
  }
  return entry.source;
}

/** The block that closes a render with sub-files: one command per child, plus when to run it. */
function childrenBlock(childIds: string[]): string {
  const rows = childIds.map((id) => {
    const child = findSkill(id);
    if (!child) {
      throw new Error(`Children block points at unknown child "${id}".`);
    }
    return `- \`wayfinder skill ${id}\` — when ${child.when ?? ''}`;
  });
  return ['## Disclosed files', '', ...rows].join('\n');
}
