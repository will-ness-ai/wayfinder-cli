import { defineConfig } from 'astro/config';

// The site deploys to the GitHub Pages project URL, so it serves under a base
// path. `site` + `base` together give the full origin for canonical URLs and
// the prefix for built assets. Decided in wayfinder ticket #47; a custom domain
// is out of scope on the map.
//
// Astro does NOT rewrite hand-written internal links. Every `<a href>` in this
// site must go through the `href()` helper in `src/lib/href.ts`.
export default defineConfig({
  site: 'https://will-ness-ai.github.io',
  base: '/wayfinder-cli',

  build: {
    // Fifteen pages share one stylesheet, so a cached external file beats an
    // inline copy per page. Astro's default only externalises a stylesheet
    // above 4 kB; this makes it unconditional, and puts the file under
    // `_astro/` on every build.
    inlineStylesheets: 'never',
  },
});
