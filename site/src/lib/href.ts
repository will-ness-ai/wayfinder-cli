/**
 * Prefix a site-root-relative path with the deploy base path.
 *
 * The site serves from `/wayfinder-cli/`, not from `/`. Astro prefixes imported
 * assets on its own, but it never touches a hand-written `<a href>`. So every
 * internal link goes through this function. External links do not.
 *
 * @param path A site-root-relative path. Must start with `/`.
 */
export function href(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error(`href() takes a path that starts with "/". Got: ${path}`);
  }
  // BASE_URL carries a trailing slash. Drop it, because `path` supplies one.
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`;
}
