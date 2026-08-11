import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * The words on the six written pages, from `src/copy/`.
 *
 * Wayfinder ticket #51 wrote those files and fixed the words; this schema is
 * the shape its README invited the rendering ticket to settle. Every key below
 * is one the copy already carries.
 *
 * The nine skill pages are not here. They render from the CLI in wayfinder
 * ticket #50.
 */

/** One line of a terminal example. `out` is plain stdout. */
const line = z.object({
  kind: z.enum(['cmd', 'out', 'ok', 'cm']),
  text: z.string(),
});

const terminal = z.object({
  /** The bar text. CSS upper-cases it. */
  label: z.string(),
  lines: z.array(line),
});

/** A row of the landing pitch, and a row of a cheatsheet group. */
const panelRow = z.object({ title: z.string(), body: z.string() });
const cheatRow = z.object({ item: z.string(), meaning: z.string() });

const copy = defineCollection({
  // README.md documents the folder for a human; it is not a page.
  loader: glob({ pattern: ['*.md', '!README.md'], base: './src/copy' }),
  schema: z.object({
    /** The `<h1>` and the `<title>`. */
    title: z.string(),
    /** The route station label. */
    nav: z.string(),
    /** The route group. Absent on an ungrouped station. */
    group: z.string().optional(),
    /** Position in the route, across all 15 stations. */
    order: z.number(),
    description: z.string(),
    /** Every written page has one, so every written page runs three columns. */
    terminal,

    // The landing page alone carries these four.
    hero: z.object({ headline: z.string(), sub: z.string() }).optional(),
    install: z.array(z.object({ command: z.string(), note: z.string() })).optional(),
    panels: z
      .array(
        z.object({
          title: z.string(),
          note: z.string(),
          /** The "what it adds" half takes the accent border and tint. */
          accent: z.boolean().optional(),
          rows: z.array(panelRow),
        }),
      )
      .optional(),
    upstream: z.object({ text: z.string(), label: z.string(), url: z.string() }).optional(),

    // The cheatsheet alone carries this one.
    groups: z.array(z.object({ title: z.string(), rows: z.array(cheatRow) })).optional(),
  }),
});

export const collections = { copy };
