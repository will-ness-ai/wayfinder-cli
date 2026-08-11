import { readContent } from './content.js';
import { parseSource } from './frontmatter.js';
import { demoteHeadings } from './markdown.js';
import { findSkill, registry, type SkillEntry } from './registry.js';
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
 * The marker in the wayfinder source that the skill-planning list composes in at:
 * the core planning entries built from the registry, followed by the config-driven
 * **Ticket skills** block. The source keeps the static prose around it.
 */
const SKILL_PLANNING_ANCHOR = '<!-- wayfinder:skill-planning -->';

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

  if (entry.trackerBlock) {
    sections.push(renderTrackerBlock(config));
  }

  return `${sections.map((section) => section.trimEnd()).join('\n\n')}\n`;
}

/**
 * The host's own body, with each render-time substitution applied: the tracker
 * line named when the entry carries a pointer, and each anchored dependency
 * composed in at its marker. A host with anchored inlines keeps its own body and
 * gains the dependency at the marker; that is the difference from {@link inlines},
 * which replace the body wholesale.
 */
function ownBody(entry: SkillEntry, config: ResolvedConfig): string {
  let { body } = parseSource(readContent(sourceOf(entry)));
  if (entry.trackerPointer) {
    body = substitute(body, TRACKER_LINE_ANCHOR, trackerPointerLine(config), entry.id);
  }
  if (entry.skillPlanning) {
    body = substitute(body, SKILL_PLANNING_ANCHOR, skillPlanningBlock(config), entry.id);
  }
  for (const { marker, dependency } of entry.anchoredInlines ?? []) {
    body = substitute(body, marker, inlineBody(dependency), entry.id);
  }
  return body;
}

/**
 * The skill-planning list the wayfinder render composes in at its marker. The
 * core planning entries render from the registry, in registry order, so the list
 * and the served set never drift. The **Ticket skills** block closes it, one row
 * per effective registration; with none registered it names how to add one, and
 * always carries the charting instruction so the assignment convention is fixed.
 */
function skillPlanningBlock(config: ResolvedConfig): string {
  const coreRows = registry
    .filter((entry) => entry.planning !== undefined)
    .map((entry) => `- \`wayfinder skill ${entry.id}\` — ${entry.planning}`);

  const lines = [
    ...coreRows,
    '',
    '### Ticket skills',
    '',
    'Assign a registered ticket skill to a ticket by writing a ticket-carried pointer that names the harness skill — for example "At session start, invoke the pre-mortem skill and apply it." Each carries the condition that makes it relevant.',
    '',
  ];

  if (config.ticketSkills.length === 0) {
    lines.push(
      'No ticket skills are registered. A developer adds one with `wayfinder ticket-skill add <name> --when "<sentence>"`.',
    );
  } else {
    for (const skill of config.ticketSkills) {
      lines.push(`- **${skill.name}** — when ${skill.when}`);
    }
  }

  return lines.join('\n');
}

/**
 * Replace one anchor in a host body with composed content. A replacer function
 * inserts the content verbatim — `String.replace` reads `$&`, `$$` and friends
 * in a string replacement as patterns, and a composed dependency body is
 * arbitrary markdown. A missing anchor is a broken render contract, not a silent
 * omission, so it throws rather than dropping the substitution.
 */
function substitute(body: string, anchor: string, content: string, hostId: string): string {
  if (!body.includes(anchor)) {
    throw new Error(`Skill "${hostId}" source is missing its render anchor "${anchor}".`);
  }
  return body.replace(anchor, () => content);
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
