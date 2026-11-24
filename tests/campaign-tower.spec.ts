import { expect, test } from '@playwright/test';
import { CAMPAIGN_TOWER_APP_STORE } from '../src/data/projects';

// Campaign Tower is live on the App Store: every download button goes to its listing.
test.describe('Campaign Tower', () => {
  test('its scene on the home page has the App Store badge, opening the listing safely', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-open-project="tower"]').click();
    const badge = page.locator('#tower a.scene-badge');
    await expect(badge).toHaveAttribute('href', CAMPAIGN_TOWER_APP_STORE);
    await expect(badge).toHaveAttribute('target', '_blank');
    await expect(badge).toHaveAttribute('rel', /noopener/);
    await expect(badge.locator('img')).toHaveAttribute('alt', 'Download on the App Store');
    await expect(page.locator('#tower a[href="/campaign-tower/"]')).toBeAttached();
  });

  test('the landing page sends every download button to the listing, with or without JavaScript', async ({ page }) => {
    await page.goto('/campaign-tower/');
    const buttons = page.locator('.js-store');
    expect(await buttons.count()).toBeGreaterThan(1);
    for (const href of await buttons.evaluateAll((els) => els.map((e) => e.getAttribute('href')))) {
      expect(href).toBe(CAMPAIGN_TOWER_APP_STORE);
    }
  });

  test('the listing URL is the app id from App Store Connect', () => {
    expect(CAMPAIGN_TOWER_APP_STORE).toBe('https://apps.apple.com/app/id6804446974');
  });
});
