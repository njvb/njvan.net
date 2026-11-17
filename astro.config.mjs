import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The site lives at njvan.net, served by GitHub Pages (custom domain set in
// public/CNAME). SITE and BASE can still be overridden from the environment.
export default defineConfig({
  site: process.env.SITE ?? 'https://njvan.net',
  base: process.env.BASE ?? '/',
  output: 'static',
  // /sitemap-index.xml, linked from public/robots.txt. The 404 page is left out.
  integrations: [sitemap({ filter: (page) => !page.endsWith('/404/') })],
  vite: {
    build: {
      // Three.js (Tavren's 3D board) is one lazy chunk of about 600kB, loaded only
      // as that scene approaches. The warning's 500kB default is meant for entry code.
      chunkSizeWarningLimit: 700,
    },
  },
});
