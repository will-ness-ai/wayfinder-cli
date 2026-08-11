/** Add one level to every ATX heading, leaving headings inside fenced code blocks alone. */
export function demoteHeadings(body: string): string {
  let insideFence = false;
  return body
    .split('\n')
    .map((line) => {
      if (/^(```|~~~)/.test(line)) {
        insideFence = !insideFence;
        return line;
      }
      if (insideFence) return line;
      const heading = /^(#{1,6})\s/.exec(line);
      if (!heading) return line;
      const hashes = heading[1] ?? '';
      const level = Math.min(hashes.length + 1, 6);
      return `${'#'.repeat(level)}${line.slice(hashes.length)}`;
    })
    .join('\n');
}
