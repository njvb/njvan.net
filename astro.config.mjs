// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://njvan.net',
  output: 'static',
  vite: {
    build: {
      // Three.js (Tavren's 3D board) is one lazy chunk of about 600kB, loaded only
      // as that scene approaches. The warning's 500kB default is meant for entry code.
      chunkSizeWarningLimit: 700,
    },
  },
});
