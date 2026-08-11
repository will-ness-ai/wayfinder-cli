/**
 * Decode the HTML entities the copy carries.
 *
 * `src/copy/cheatsheet.md` writes `wayfinder skill &lt;id&gt;` in its YAML, and
 * an Astro `{expression}` escapes the ampersand, so the reader would see the
 * entity rather than the angle brackets. Decoding restores the word #51 wrote
 * without handing raw HTML to `set:html`.
 */
export function plain(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}
