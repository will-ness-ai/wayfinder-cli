/**
 * The route — the site's one navigation structure.
 *
 * The locked design keeps all 15 stations open in the sidebar, in four groups
 * (see verdict 2 in docs/prototypes/docs-site/README.md). The nine skill ids
 * ARE the product, so a collapsed group would hide what the CLI serves.
 *
 * `ready` is a build-order flag, not a design decision. A station whose page
 * does not exist yet renders as dim text instead of a link, so the route keeps
 * its 15 stations without shipping a 404. Flip it to `true` in the same commit
 * that adds the page.
 */

export interface Station {
  /** Stable key. A page names its own station to mark itself current. */
  id: string;
  /** The text in the route, and the last crumb in the top strip. */
  label: string;
  /** Site-root-relative, with a trailing slash. Pass it through `href()`. */
  path: string;
  /** False until the page exists. A false station is not a link. */
  ready: boolean;
}

export interface RouteGroup {
  /** Empty for the two ungrouped stations at the ends of the route. */
  heading: string;
  stations: Station[];
}

const skill = (id: string): Station => ({
  id: `skill/${id}`,
  label: id,
  path: `/skills/${id}/`,
  ready: false,
});

export const ROUTE: RouteGroup[] = [
  {
    heading: '',
    stations: [{ id: 'overview', label: 'Overview', path: '/', ready: true }],
  },
  {
    heading: 'Reference',
    stations: [
      { id: 'reference/commands', label: 'Commands', path: '/reference/commands/', ready: true },
      { id: 'reference/config', label: 'Config', path: '/reference/config/', ready: false },
      { id: 'reference/trackers', label: 'Trackers', path: '/reference/trackers/', ready: false },
      {
        id: 'reference/ticket-skills',
        label: 'Ticket skills',
        path: '/reference/ticket-skills/',
        ready: false,
      },
    ],
  },
  {
    heading: 'Skills',
    stations: [
      'wayfinder',
      'grilling',
      'grill-with-docs',
      'domain-modeling',
      'research',
      'prototype',
      'to-spec',
      'to-tickets',
      'tracker',
    ].map(skill),
  },
  {
    heading: '',
    stations: [{ id: 'cheatsheet', label: 'Cheatsheet', path: '/cheatsheet/', ready: true }],
  },
];

/** Every station, flattened, in route order. */
export const STATIONS: Station[] = ROUTE.flatMap((g) => g.stations);

/**
 * The station a page marks as current, plus its group heading.
 *
 * Throws on an unknown id, so a typo fails the build instead of rendering a
 * route with no station lit.
 */
export function station(id: string): { station: Station; group: string } {
  for (const group of ROUTE) {
    const found = group.stations.find((s) => s.id === id);
    if (found) return { station: found, group: group.heading };
  }
  throw new Error(`Unknown station id: ${id}. Add it to ROUTE in src/lib/nav.ts.`);
}
