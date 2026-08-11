import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

/**
 * The fixture directory the skill pages are rendered against, as an absolute
 * path handed to the build.
 *
 * It is resolved here, not in `src/lib/renders.ts`, because Vite bundles the
 * site's own modules into `dist/.prerender/` and `import.meta.url` inside a
 * bundled module points at the chunk, not at the source file. This config is
 * loaded from its real location, so the URL below is the real one.
 */
const FIXTURE_DIR = fileURLToPath(new URL('./fixture', import.meta.url));

/**
 * The deploy base path. `base` below and `rehypeBaseHref` both read it, so the
 * site has one place that knows where it serves from.
 */
const BASE = '/wayfinder-cli';

/**
 * Prefix every root-relative link in Markdown with the base path.
 *
 * A copy file writes an internal link as `/trackers/`, and Astro never
 * rewrites a hand-written `<a href>`. This is `href()` from src/lib/href.ts,
 * applied to prose the build renders rather than to markup a page writes.
 */
function rehypeBaseHref() {
  return (tree: unknown) => {
    const walk = (node: any) => {
      if (node.type === 'element' && node.tagName === 'a') {
        const to = node.properties?.href;
        // A root-relative path only. `//host` is protocol-relative, and an
        // absolute URL or a fragment needs no prefix.
        if (typeof to === 'string' && to.startsWith('/') && !to.startsWith('//')) {
          node.properties.href = `${BASE}${to}`;
        }
      }
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    walk(tree);
  };
}

/**
 * Wrap every Markdown table in `<div class="tablewrap">`, the box the locked
 * design scrolls sideways. The prose column is 66ch and a reference table is
 * wider, so without this a wide table pushes the whole page sideways on a
 * phone.
 *
 * Hand-rolled rather than pulled from `unist-util-visit`: it is a dozen lines
 * over a tree this site fully controls.
 */
function rehypeWrapTables() {
  return (tree: unknown) => {
    const walk = (node: any) => {
      if (!Array.isArray(node.children)) return;
      node.children = node.children.map((child: any) => {
        walk(child);
        if (child.type === 'element' && child.tagName === 'table') {
          return {
            type: 'element',
            tagName: 'div',
            properties: { className: ['tablewrap'] },
            children: [child],
          };
        }
        return child;
      });
    };
    walk(tree);
  };
}

// The site deploys to the GitHub Pages project URL, so it serves under a base
// path. `site` + `base` together give the full origin for canonical URLs and
// the prefix for built assets. Decided in wayfinder ticket #47; a custom domain
// is out of scope on the map.
//
// Astro does NOT rewrite hand-written internal links. Every `<a href>` in this
// site must go through the `href()` helper in `src/lib/href.ts`.
export default defineConfig({
  site: 'https://will-ness-ai.github.io',
  base: BASE,

  build: {
    // Fifteen pages share one stylesheet, so a cached external file beats an
    // inline copy per page. Astro's default only externalises a stylesheet
    // above 4 kB; this makes it unconditional, and puts the file under
    // `_astro/` on every build.
    inlineStylesheets: 'never',
  },

  markdown: {
    // Shiki is Astro's default, and it writes its own background and colours
    // inline on every `<pre>`. The locked design paints a fenced block in the
    // terminal palette with no token colours at all, and a locked verdict
    // outranks a framework default. Turned off, a fence renders as plain
    // `<pre><code>` and `.md pre` in src/styles/site.css owns the look.
    syntaxHighlight: false,

    // Astro 7 made Sätteri the default Markdown processor, and this key
    // switches the pipeline back to `unified` from `@astrojs/markdown-remark`.
    // The site pays that dependency for the two plugins above, both of which
    // apply the locked design to prose the build renders from src/copy/.
    rehypePlugins: [rehypeWrapTables, rehypeBaseHref],
  },

  vite: {
    define: {
      __FIXTURE_DIR__: JSON.stringify(FIXTURE_DIR),
    },
  },
});
