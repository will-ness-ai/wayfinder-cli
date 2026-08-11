/**
 * Markdown tinting for the stdout block.
 *
 * The locked design (verdict 5 in docs/prototypes/docs-site/README.md) tints
 * the render's structure: headings in the caret amber, fenced code and tables
 * dimmed, inline code in teal. **It changes no byte.** Every character of the
 * stdout reaches the page; tinting only decides which span it sits in.
 *
 * The rules are the prototype's `tintedRows()`, lifted whole. A line takes at
 * most one tint, tested in this order, and only an untinted line is searched
 * for inline code.
 */

/** The three tints, each a class the stylesheet colours. */
export type Tint = 'tHead' | 'tCode' | 'tDim';

/** A run of characters within one line, either inline code or not. */
export interface Segment {
  text: string;
  code: boolean;
}

/** One line of stdout, ready to render. */
export interface TintedLine {
  /** The 1-based line number for the gutter. */
  number: number;
  /**
   * The whole-line tint, when the line takes one. A tinted line is one
   * segment: the prototype does not search a heading or a fenced line for
   * inline code.
   */
  tint?: Tint;
  /** The line's content. One segment when the line is tinted. */
  segments: Segment[];
}

/** A fenced-code delimiter — the fence itself is dimmed, and it toggles state. */
const FENCE = /^```/;
/** An ATX heading, one to four hashes. Deeper headings are body text. */
const HEADING = /^#{1,4} /;
/** A table row, which may be indented. */
const TABLE_ROW = /^\s*\|/;
/** Inline code, backticks kept — they are bytes of the render like any other. */
const INLINE_CODE = /`[^`]+`/g;

/**
 * Split one line into plain and inline-code segments, backticks included.
 * A line with no inline code comes back as a single plain segment.
 */
function segmentsOf(line: string): Segment[] {
  const segments: Segment[] = [];
  let at = 0;

  for (const match of line.matchAll(INLINE_CODE)) {
    if (match.index > at) segments.push({ text: line.slice(at, match.index), code: false });
    segments.push({ text: match[0], code: true });
    at = match.index + match[0].length;
  }

  if (at < line.length) segments.push({ text: line.slice(at), code: false });
  return segments;
}

/** Tint a whole render, line by line. */
export function tint(text: string): TintedLine[] {
  let inFence = false;

  return text.split('\n').map((line, index) => {
    const number = index + 1;
    const whole = [{ text: line, code: false }];

    if (FENCE.test(line)) {
      inFence = !inFence;
      return { number, tint: 'tDim', segments: whole };
    }
    if (inFence) return { number, tint: 'tCode', segments: whole };
    if (HEADING.test(line)) return { number, tint: 'tHead', segments: whole };
    if (TABLE_ROW.test(line)) return { number, tint: 'tDim', segments: whole };

    return { number, segments: assertWhole(segmentsOf(line), line) };
  });
}

/**
 * Hold the design's one hard promise: the tinting changes no byte.
 *
 * Only the segmented path can break it — every other branch carries the line
 * through whole. A dropped or duplicated character would otherwise reach the
 * page looking like the CLI's own output, which is the one thing a reader
 * comes here to trust. The build fails instead.
 */
function assertWhole(segments: Segment[], line: string): Segment[] {
  const rejoined = segments.map((segment) => segment.text).join('');
  if (rejoined !== line) {
    throw new Error(
      `Tinting changed a line. Expected ${JSON.stringify(line)}, got ${JSON.stringify(rejoined)}.`,
    );
  }
  return segments;
}
