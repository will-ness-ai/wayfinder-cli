/**
 * The cheatsheet: every command, every flag, every config key, and the six
 * tracker values.
 *
 * Eight groups in one dense table. It exists to be scanned by a human eye, so
 * cards were prototyped and rejected — card borders spend space that rows
 * want. Verdict 9.
 *
 * It is a human scan page, not printable output and not a paste block for an
 * agent. Final wording is owned by wayfinder ticket #51.
 */

export interface CheatGroup {
  /** Printed once, against the first row of the group. */
  title: string;
  /** `[item, meaning]`. The item is set in mono and never wraps. */
  rows: [string, string][];
}

export const CHEATSHEET: CheatGroup[] = [
  {
    title: 'Agent commands',
    rows: [
      ['wayfinder', 'agent quickstart — the two read commands'],
      ['wayfinder skill <id>', 'print one rendered skill as markdown'],
      ['wayfinder skills', 'list every served id, description, children'],
    ],
  },
  {
    title: 'Setup commands',
    rows: [
      ['wayfinder init', 'write the harness stub; idempotent, reports a diff'],
      ['wayfinder tracker show', 'effective tracker value, doc, and winning scope'],
      ['wayfinder tracker set <value>', 'set the tracker; freeform prose'],
      ['wayfinder ticket-skill add <name>', 'register a harness skill'],
      ['wayfinder ticket-skill edit <name>', 'change a when sentence or scope'],
      ['wayfinder ticket-skill remove <name>', 'drop or tombstone a registration'],
      ['wayfinder ticket-skill list', 'every registration with its scope'],
      ['wayfinder doctor', 'unresolvable skill names and doc paths'],
    ],
  },
  {
    title: 'Flags',
    rows: [
      ['--harness claude,agents', 'init: install targets'],
      ['--tracker "<value>"', 'init: set the tracker in one pass'],
      ['--doc <path>', 'tracker set: attach your own operations prose'],
      ['--when "<sentence>"', 'ticket-skill: required relevance condition'],
      ['--scope user|project|local', 'ticket-skill: which config file to write'],
      ['--user', 'tracker set: write user scope'],
      ['--json', 'JSON instead of TOON'],
      ['--version, -V', 'print the version'],
      ['--help, -h', 'full setup page'],
    ],
  },
  {
    title: 'Config keys',
    rows: [
      ['tracker.value', 'freeform tracker prose, e.g. "github cli"'],
      ['tracker.doc', 'path to your own operations doc; resolved from its config file'],
      ['ticketSkills.<name>.when', 'required relevance sentence'],
      ['ticketSkills.<name> = null', 'tombstone — hides an inherited registration'],
    ],
  },
  {
    title: 'Config scopes',
    rows: [
      ['~/.config/wayfinder/config.json', 'user — not committed'],
      ['.wayfinder/config.json', 'project — committed'],
      ['.wayfinder/local.json', 'local — gitignored, wins'],
      ['tracker', 'resolves wholesale from the nearest scope'],
      ['ticketSkills', 'union of all scopes, keyed by name'],
    ],
  },
  {
    title: 'Tracker values',
    rows: [
      ['github cli', 'shipped doc — the reference tracker'],
      ['github mcp', 'shipped doc'],
      ['gitlab cli', 'shipped doc'],
      ['jira mcp', 'shipped doc'],
      ['linear mcp', 'shipped doc'],
      ['local', 'shipped doc — markdown files in the repo'],
      ['anything else', 'custom: named in the render, operations left to your tools'],
    ],
  },
  {
    title: 'Skill ids',
    rows: [
      ['wayfinder', 'no children'],
      ['grilling', 'no children'],
      ['grill-with-docs', 'domain-modeling/adr-format, /context-format'],
      ['domain-modeling', 'domain-modeling/adr-format, /context-format'],
      ['research', 'no children'],
      ['prototype', 'prototype/logic, prototype/ui'],
      ['to-spec', 'no children'],
      ['to-tickets', 'no children'],
      ['tracker', 'the tracker block alone'],
    ],
  },
  {
    title: 'Ticket labels',
    rows: [
      ['wayfinder:map', 'the map issue'],
      ['wayfinder:grilling', 'resolved by conversation'],
      ['wayfinder:research', 'the answer lives outside the repo'],
      ['wayfinder:prototype', 'a concrete artifact raises the fidelity'],
      ['wayfinder:task', 'manual work that unblocks a decision'],
      ['ready-for-agent', 'zero human input needed (AFK)'],
      ['ready-for-human', 'human oversight needed (HITL)'],
    ],
  },
];
