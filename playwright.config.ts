// UI tests for njvan.net. They run against the built site (dist/), served as static files, the way
// GitHub Pages serves it. `npm test` builds first; `npm run test:only` reuses an existing build.
// CI runs this on every pull request and before every deploy (.github/workflows/test.yml).
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    // The scenes' motion is the point of the site, so tests run with it on (reduced motion has its own project).
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npx sirv dist --port ${PORT} --host 127.0.0.1 --quiet`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !CI,
    timeout: 30_000,
  },
  projects: [
    // Desktop Chrome: everything.
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    // A phone (WebKit, like Safari on iPhone): pages load, the cards open the stage, nothing overflows.
    { name: 'phone', use: { ...devices['iPhone 14'] }, testMatch: /(smoke|home|theme)\.spec\.ts/ },
    // Reduced motion: the stage still opens and settles at once.
    { name: 'reduced-motion', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, testMatch: /home\.spec\.ts/ },
  ],
});
