import { expect, test } from '@playwright/test';
import { APPLE_PROVIDER_TOKEN } from '../src/data/projects';

// Every App Store link carries Nathan's provider token and a campaign name for the page it is on,
// so App Analytics (Acquisition > Campaigns) shows which page sent each download.
const PAGES: Record<string, string> = {
  '/': 'njvan-home',
  '/tavren/': 'njvan-tavren',
  '/worldbar/': 'njvan-worldbar',
  '/emergency-tower/': 'njvan-emergency-tower',
  '/campaign-tower/': 'njvan-campaign-tower',
};

test.describe('App Store campaign links', () => {
  for (const [path, campaign] of Object.entries(PAGES)) {
    test(`${path} tags its App Store links "${campaign}"`, async ({ page }) => {
      await page.goto(path);
      const hrefs = await page
        .locator('a[href*="apps.apple.com"]')
        .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href));
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) {
        const url = new URL(href);
        expect(url.pathname, href).toMatch(/^\/app\/id\d+$/);
        expect(url.searchParams.get('pt'), href).toBe(APPLE_PROVIDER_TOKEN);
        expect(url.searchParams.get('ct'), href).toBe(campaign);
        expect(url.searchParams.get('mt'), href).toBe('8');
      }
    });
  }

  test('structured data keeps the plain listing URL', async ({ page }) => {
    for (const path of ['/tavren/', '/worldbar/', '/emergency-tower/']) {
      await page.goto(path);
      const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join('\n');
      expect(ld, path).toContain('apps.apple.com/app/id');
      expect(ld, path).not.toContain('pt=');
    }
  });
});
