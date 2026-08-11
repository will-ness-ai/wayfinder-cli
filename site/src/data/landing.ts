/**
 * The landing page's copy.
 *
 * The hero is one oversized line, one supporting line, and the install
 * commands in a dark block. The pitch below it splits 50/50: half what the CLI
 * removes, half what it adds. A pitch that is three-quarters complaint
 * understates the product. Verdict 8.
 *
 * This copy comes from the locked prototype, which took it from the v1 spec.
 * Final wording is owned by wayfinder ticket #51.
 */

export const UPSTREAM = 'https://www.aihero.dev/skills-wayfinder';

export const HERO = {
  headline: "Your agent's planning skills, served.",
  sub: 'Composed for your harness. Substituted for your issue tracker. Extended with the skills your team registered.',
};

/** One `$` line each, in the dark block under the hero. */
export const INSTALL = ['npm i -g wayfinder-cli', 'wayfinder init', 'wayfinder skill wayfinder'];

export interface Half {
  /** The counter above the heading: 01 and 02. */
  index: string;
  title: string;
  note: string;
  rows: { heading: string; body: string }[];
}

export const HALVES: Half[] = [
  {
    index: '01',
    title: 'What it removes',
    note: 'Skills kept as files break in three ways.',
    rows: [
      {
        heading: 'Copies drift',
        body: 'Every repo holds its own copy of every skill. One install per repo instead, with the content inside the CLI: upgrade the CLI and every skill upgrades with it.',
      },
      {
        heading: 'Skills hardcode each other',
        body: 'A skill that says "run /grilling" only works if you kept that skill, under that name, in that harness. The render composes instead — inlined where every path needs it, a command plus its firing condition where only some do.',
      },
      {
        heading: 'Skills assume one tracker',
        body: 'GitHub prose in a Jira repo is worse than no prose. Set a tracker value and the render appends the operations for yours. An unset tracker gets a notice that asks — never a silent guess.',
      },
    ],
  },
  {
    index: '02',
    title: 'What it adds',
    note: 'A served skill set your team can extend.',
    rows: [
      {
        heading: 'Your own skills join the plan',
        body: 'Register a harness skill with a when sentence. Charting reads it and attaches the skill to every ticket the sentence covers — your pre-mortem, your frontend loop, your review checklist.',
      },
      {
        heading: 'One setup for the whole team',
        body: 'Project scope is committed. Every contributor and every agent renders the same skills, the same tracker, and the same registrations — no per-person configuration.',
      },
      {
        heading: 'Adoption is one command',
        body: 'wayfinder init, once per repo. Nothing to copy, nothing to keep in step, and nothing for a new joiner to install by hand.',
      },
    ],
  },
];
