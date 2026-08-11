import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The shipped content tree. It sits at the package root, beside `dist/` in a
 * published install and beside `src/` in this repo, so `../content` resolves
 * the same way whether the code runs from source (tests) or from `dist/`.
 */
export const contentRoot = fileURLToPath(new URL('../content', import.meta.url));

/** Read a UTF-8 file from a path relative to the content root. */
export function readContent(relativePath: string): string {
  return readFileSync(join(contentRoot, relativePath), 'utf8');
}
