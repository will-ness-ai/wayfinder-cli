/**
 * The terminal example each page shows in its third column, keyed by station.
 *
 * A station with an entry here renders three columns; a station without one
 * renders two (verdict 3). The nine rendered skill pages have no entry — a
 * skill page is already terminal output, so a terminal beside it is dead
 * space. They are built in wayfinder ticket #50.
 *
 * One fixed example per page: the terminal does not follow the reader's scroll
 * (verdict 6). These lines are hand-written illustrations of real commands,
 * not captured output.
 */

/**
 * `cmd` is the command line, and it prints its own `$ ` prompt.
 * `cm` is a comment, a prompt, or an error. `ok` is a success line.
 * An empty kind is plain output.
 */
export type OutputKind = 'cmd' | 'cm' | 'ok' | '';

export type OutputLine = [OutputKind, string];

export interface TerminalExample {
  /** The bar text. CSS upper-cases it. */
  label: string;
  lines: OutputLine[];
}

const TERMINALS: Record<string, TerminalExample> = {
  overview: {
    label: 'install → init → first render',
    lines: [
      ['cmd', 'npm install -g wayfinder-cli'],
      ['ok', 'added 1 package in 1.4s'],
      ['', ''],
      ['cmd', 'wayfinder init'],
      ['cm', '? Install the stub to  ›  ◉ claude (detected)  ◯ agents'],
      ['cm', '? Issue tracker        ›  github cli'],
      ['ok', 'wrote .claude/skills/wayfinder/SKILL.md'],
      ['ok', 'wrote .wayfinder/config.json'],
      ['', ''],
      ['cmd', 'wayfinder'],
      ['', 'wayfinder — planning skills for coding agents'],
      ['', ''],
      ['', '  Your next action MUST be to run:'],
      ['', '    wayfinder skill wayfinder'],
      ['', ''],
      ['', '  wayfinder skill <id>   print one rendered skill'],
      ['', '  wayfinder skills       list everything served'],
    ],
  },

  'reference/commands': {
    label: 'try it',
    lines: [
      ['cmd', 'wayfinder skills'],
      ['', 'id               children                      origin'],
      ['', 'wayfinder        -                             core'],
      ['', 'grilling         -                             core'],
      ['', 'grill-with-docs  domain-modeling/adr-format    core'],
      ['', 'domain-modeling  domain-modeling/adr-format    core'],
      ['', 'research         -                             core'],
      ['', 'prototype        prototype/logic               core'],
      ['', '                 prototype/ui                  core'],
      ['', 'to-spec          -                             core'],
      ['', 'to-tickets       -                             core'],
      ['', 'tracker          -                             tracker'],
      ['', ''],
      ['cmd', 'wayfinder tracker show'],
      ['', 'value  github cli'],
      ['', 'doc    content/trackers/github-cli.md (shipped)'],
      ['', 'scope  project (.wayfinder/config.json)'],
    ],
  },

  cheatsheet: {
    label: 'wayfinder --help',
    lines: [
      ['cmd', 'wayfinder --help | head -40'],
      ['', 'Usage: wayfinder [command] [options]'],
      ['', ''],
      ['', 'Agent commands'],
      ['', '  skill <id>            print one rendered skill'],
      ['', '  skills                list everything served'],
      ['', ''],
      ['', 'Setup commands'],
      ['', '  init                  write the harness stub'],
      ['', '  tracker show|set      read or set the tracker'],
      ['', '  ticket-skill ...      register harness skills'],
      ['', '  doctor                check registrations and paths'],
      ['', ''],
      ['', 'Options'],
      ['', '  --json                JSON instead of TOON'],
      ['', '  -V, --version         print the version'],
      ['', '  -h, --help            this page'],
    ],
  },
};

/** The example for a station, or undefined when the page runs two columns. */
export function terminalFor(stationId: string): TerminalExample | undefined {
  return TERMINALS[stationId];
}
