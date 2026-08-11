import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { contentRoot } from './content.js';
import { parseSource } from './frontmatter.js';
import { demoteHeadings } from './markdown.js';
import type { ResolvedConfig, ResolvedTracker } from './config.js';

/**
 * The tracker block: the operations prose for this repo's tracker, in whichever
 * of its three states applies. `wayfinder skill tracker` prints it alone today;
 * the wayfinder render will append the same block at its bottom (issue #39). One
 * function serves both, so the two paths can never disagree.
 *
 * - No tracker value → the **notice-and-ask block**: report the gap, ask the
 *   human to choose, and never guess.
 * - Value set, no doc → name the tracker and tell the agent to use its own tools.
 * - Value set, doc found → the whole doc, under `## Issue tracker: <value>` with
 *   its own headings demoted one level and nothing else added.
 */
export function renderTrackerBlock(config: ResolvedConfig): string {
  const tracker = config.tracker;
  if (!tracker) return noticeAndAskBlock();

  const doc = resolveDoc(tracker);
  if (doc === undefined) return noDocBlock(tracker.value);

  return `## Issue tracker: ${tracker.value}\n\n${demoteHeadings(doc).trimEnd()}\n`;
}

/**
 * The tracker line for `to-spec` and `to-tickets`. Both run standalone, with no
 * wayfinder session to append the block, so each names the tracker and carries a
 * conditional pointer at `wayfinder skill tracker` instead of inlining the doc.
 */
export function trackerPointerLine(config: ResolvedConfig): string {
  const value = config.tracker?.value;
  if (value === undefined) {
    return 'No issue tracker is configured for this repo. Run `wayfinder skill tracker` to choose one before you publish.';
  }
  return `This repo's issue tracker is **${value}**. If you do not know how to operate it, run \`wayfinder skill tracker\` first.`;
}

/**
 * Resolve the one doc that reaches the render, or `undefined` for the no-doc
 * state. An attached `--doc` path replaces the shipped doc — the two never
 * merge — and resolves against the config file that holds it; a path that does
 * not resolve degrades to the no-doc state rather than falling back. With no
 * attached doc, a shipped doc is found by the tracker value's filename slug.
 */
function resolveDoc(tracker: ResolvedTracker): string | undefined {
  if (tracker.doc !== undefined) {
    return readIfPresent(join(tracker.configDir, tracker.doc));
  }
  return readIfPresent(join(contentRoot, 'trackers', `${trackerSlug(tracker.value)}.md`));
}

/** Lower-case the tracker value and replace each run of whitespace with `-`. No aliases. */
export function trackerSlug(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * The `doctor` check for an attached tracker doc: a `--doc` path that no longer
 * resolves to a file. It degrades to the no-doc state at render, silently by
 * design, so `doctor` is the one surface that reports the broken path. Returns
 * `undefined` when no doc is attached or the attached doc resolves.
 */
export function trackerDocProblem(config: ResolvedConfig): string | undefined {
  const tracker = config.tracker;
  if (tracker?.doc === undefined) return undefined;
  if (existsSync(join(tracker.configDir, tracker.doc))) return undefined;
  return `Tracker doc "${tracker.doc}" (${tracker.scope} scope) does not resolve to a file. Fix the path with \`wayfinder tracker set --doc <path>\`, or clear it.`;
}

function readIfPresent(path: string): string | undefined {
  try {
    return parseSource(readFileSync(path, 'utf8')).body;
  } catch {
    return undefined;
  }
}

function noDocBlock(value: string): string {
  return [
    `## Issue tracker: ${value}`,
    '',
    `No operations prose ships for **${value}**. Use your own knowledge of this tracker, and the tools it provides, to create the map and its tickets.`,
    '',
  ].join('\n');
}

function noticeAndAskBlock(): string {
  return [
    '## Issue tracker',
    '',
    'No issue tracker is configured for this repo, so there is no operations prose to load.',
    '',
    'Ask the human to choose one, and do not pick a tracker on your own:',
    '',
    '- Use the local markdown tracker — run `wayfinder tracker set local`.',
    '- Name this repo\'s tracker — run `wayfinder tracker set "<value>"`, for example `wayfinder tracker set "github cli"`.',
    '',
  ].join('\n');
}
