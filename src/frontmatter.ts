/** A source file split into its frontmatter fields and its body. */
export interface ParsedSource {
  /** Flat key/value pairs from the YAML frontmatter block. Values stay strings. */
  frontmatter: Record<string, string>;
  /** The body, with the frontmatter block and its trailing blank line removed. */
  body: string;
}

const FENCE = '---';

/**
 * Split a source file into its frontmatter fields and its body.
 *
 * The frontmatter is a leading block fenced by `---` lines. Only flat
 * `key: value` pairs are read — enough for `name` and `description`, which are
 * the only fields the served set uses. A file with no frontmatter fence returns
 * empty fields and its whole content as the body.
 */
export function parseSource(source: string): ParsedSource {
  const normalized = source.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  if (lines[0] !== FENCE) {
    return { frontmatter: {}, body: stripLeadingBlankLines(normalized) };
  }

  const closingIndex = lines.indexOf(FENCE, 1);
  if (closingIndex === -1) {
    return { frontmatter: {}, body: stripLeadingBlankLines(normalized) };
  }

  const frontmatter: Record<string, string> = {};
  for (const line of lines.slice(1, closingIndex)) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key) frontmatter[key] = value;
  }

  const body = stripLeadingBlankLines(lines.slice(closingIndex + 1).join('\n'));
  return { frontmatter, body };
}

function stripLeadingBlankLines(text: string): string {
  return text.replace(/^\n+/, '');
}
