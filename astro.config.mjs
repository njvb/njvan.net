import { defineConfig } from 'astro/config';

// The site lives at njvan.net. Until the domain points at GitHub Pages, the deploy
// workflow builds it for njvb.github.io/njvan.net/ by setting SITE and BASE.
export default defineConfig({
  site: process.env.SITE ?? 'https://njvan.net',
  base: process.env.BASE ?? '/',
  output: 'static',
  vite: {
    build: {
      // Three.js (Tavren's 3D board) is one lazy chunk of about 600kB, loaded only
      // as that scene approaches. The warning's 500kB default is meant for entry code.
      chunkSizeWarningLimit: 700,
    },
  },
});
