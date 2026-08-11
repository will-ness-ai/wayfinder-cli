/**
 * The agent quickstart, printed by bare `wayfinder`. Two read commands and the
 * start line — the whole agent surface, and nothing a human sets up.
 */
export const quickstart = `wayfinder — planning skills, served as markdown for coding agents.

Your next action MUST be to run:

  wayfinder skill wayfinder

That prints the wayfinder skill in full. Then:

  wayfinder skill <id>   Print one skill, rendered as markdown.
  wayfinder skills       List every skill served, with its children.

Run \`wayfinder --help\` for the developer setup page.
`;

/**
 * The developer setup page, printed by `wayfinder --help`. It covers the read
 * surface that this build serves; setup commands are documented as they land.
 */
export const help = `wayfinder — a content server that renders planning skills for coding agents.

USAGE
  wayfinder                Print the agent quickstart.
  wayfinder skill <id>     Print one skill, rendered as markdown.
  wayfinder skills         List every skill served, with its description and children.

SETUP
  wayfinder init                       Install the entry-point stub into your agent harnesses.
    [--harness <ids>] [--tracker ...]  Runs a form on a terminal; takes flags with no TTY.
                                       --harness is claude, agents, or both, comma-separated.
                                       Idempotent: a re-run repairs the stub and reports a diff.
  wayfinder tracker show               Report the effective tracker and the scope it came from.
  wayfinder tracker set [<value>]      Record this repo's issue tracker. Runs a form on a
    [--doc <path>] [--user]            terminal; takes flags with no TTY. --doc attaches an
                                       operations doc by path; --user writes the user scope.

OPTIONS
  --json                   Emit machine-readable JSON instead of TOON (list commands).
  --version, -V            Print the version.
  --help, -h               Print this page.

Skill renders are always markdown. \`wayfinder skills\` prints TOON by default.
Run \`wayfinder skills\` to discover every served id.
`;
