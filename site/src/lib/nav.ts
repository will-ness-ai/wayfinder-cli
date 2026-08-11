import { getCollection } from 'astro:content';
import { servedSkills } from './renders';

/**
 * The route — the site's one navigation structure.
 *
 * The locked design keeps all 15 stations open in the sidebar (verdict 2 in
 * docs/prototypes/docs-site/README.md). The nine skill ids ARE the product, so
 * a collapsed group would hide what the CLI serves.
 *
 * Six stations come from `src/copy/`, which carries `nav`, `group`, and
 * `order` per page. The nine skill stations are listed here, because no copy
 * file describes them — they render from the CLI in wayfinder ticket #50.
 */

export interface Station {
  /** The copy entry id, or `skill/<id>`. A page names its own to mark it current. */
  id: string;
  /** The text in the route, and the last crumb in the top strip. */
  label: string;
  /** Site-root-relative, with a trailing slash. Pass it through `href()`. */
  path: string;
  /** The route group. Empty for an ungrouped station. */
  group: string;
  /** Position across all 15 stations. */
  order: number;
  /** False until the page exists. A false station is not a link. */
  ready: boolean;
}

export interface RouteGroup {
  heading: string;
  stations: Station[];
}

/**
 * The nine served skill ids, at orders 6 to 14 — between the reference pages
 * and the cheatsheet. The order is the prototype's, not the CLI's registry
 * order, so it is written out here rather than derived.
 *
 * The four supporting files the CLI also serves — `prototype/ui` and the three
 * beside it — are pages, but they are not stations. They are reached from the
 * parent that discloses them. Decided with the human on ticket #50: the route
 * stays at 15 stations, and a supporting file is not one of them.
 */
const SKILL_IDS = [
  'wayfinder',
  'grilling',
  'grill-with-docs',
  'domain-modeling',
  'research',
  'prototype',
  'to-spec',
  'to-tickets',
  'tracker',
];

const SKILL_STATIONS: Station[] = SKILL_IDS.map((id, n) => ({
  id: `skill/${id}`,
  label: id,
  path: `/skills/${id}/`,
  group: 'Skills',
  order: 6 + n,
  ready: true,
}));

/**
 * Fail the build when the route and the CLI disagree about what is served.
 *
 * The list above is hand-ordered, so it can go stale: a skill added to or
 * dropped from the CLI would otherwise leave a station with no page, or a page
 * with no station, and neither shows up until someone clicks.
 */
async function assertRouteMatchesCli(): Promise<void> {
  const served = (await servedSkills()).map((skill) => skill.id);

  const missing = served.filter((id) => !SKILL_IDS.includes(id));
  const stale = SKILL_IDS.filter((id) => !served.includes(id));
  if (missing.length === 0 && stale.length === 0) return;

  throw new Error(
    [
      'The route in src/lib/nav.ts no longer matches what `wayfinder skills` serves.',
      missing.length > 0 && `Served, but not a station: ${missing.join(', ')}.`,
      stale.length > 0 && `A station, but not served: ${stale.join(', ')}.`,
      'Edit SKILL_IDS, and pick the order deliberately — it is a design choice.',
    ]
      .filter(Boolean)
      .join(' '),
  );
}

/** The landing page is the site root; every other written page is `/<id>/`. */
function pathFor(id: string): string {
  return id === 'overview' ? '/' : `/${id}/`;
}

/** Every station, in route order. */
export async function stations(): Promise<Station[]> {
  await assertRouteMatchesCli();

  const written = (await getCollection('copy')).map((entry) => ({
    id: entry.id,
    label: entry.data.nav,
    path: pathFor(entry.id),
    group: entry.data.group ?? '',
    order: entry.data.order,
    ready: true,
  }));

  return [...written, ...SKILL_STATIONS].sort((a, b) => a.order - b.order);
}

/**
 * The route, as consecutive runs of stations that share a group heading. The
 * ungrouped landing page and cheatsheet each become a run with an empty
 * heading, which is how the prototype draws them.
 */
export async function route(): Promise<RouteGroup[]> {
  const groups: RouteGroup[] = [];

  for (const station of await stations()) {
    const last = groups.at(-1);
    if (last && last.heading === station.group) last.stations.push(station);
    else groups.push({ heading: station.group, stations: [station] });
  }

  return groups;
}

/**
 * One station by id. Throws on an unknown id, so a typo fails the build
 * instead of rendering a route with no station lit.
 */
export async function station(id: string): Promise<Station> {
  const found = (await stations()).find((s) => s.id === id);
  if (!found) throw new Error(`Unknown station id: ${id}. It is neither a copy file nor a skill.`);
  return found;
}
