import { expect, test } from '@playwright/test';

// Emergency Tower's support and privacy pages are the URLs the app and its App Store listing use.
test.describe('Emergency Tower', () => {
  test('the landing page has the pitch, five whole-screen screenshots and a Coming soon placeholder', async ({ page }) => {
    await page.goto('/emergency-tower/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Emergency Tower');
    await expect(page.getByText('Three patients are waiting. One lift. Who rides first?').first()).toBeVisible();
    await expect(page.getByText('Coming soon to the App Store').first()).toBeVisible();
    // Not on the App Store yet: no store or TestFlight link until there is a listing.
    await expect(page.locator('a[href*="apps.apple.com"], a[href*="testflight"]')).toHaveCount(0);
    await expect(page.locator('.em-shots img')).toHaveCount(5);
    for (const img of await page.locator('.em-shots img').all()) await expect(img).toHaveAttribute('alt', /.{12,}/);
    await expect(page.locator('a[href="/emergency-tower/support/"]').first()).toBeAttached();
    await expect(page.locator('a[href="/emergency-tower/privacy/"]').first()).toBeAttached();
  });

  test('its homepage scene links to the page and shows the triage tags', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-open-project="emergency"]').click();
    const scene = page.locator('#emergency');
    await expect(scene).toHaveClass(/is-current/);
    await expect(scene.locator('a[href="/emergency-tower/"]')).toBeAttached();
    await expect(scene.locator('[data-em-tag]')).toHaveCount(3);
  });

  test('support has the contact address, 14 questions and known issues', async ({ page }) => {
    await page.goto('/emergency-tower/support/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Support');
    await expect(page.locator('main a[href^="mailto:njvanderbyl@gmail.com"]').first()).toBeVisible();
    await expect(page.locator('.faq__item')).toHaveCount(14);
    await expect(page.getByRole('heading', { name: 'Known issues' })).toBeVisible();
  });

  test('privacy has the effective date, the short version and 9 numbered sections', async ({ page }) => {
    await page.goto('/emergency-tower/privacy/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy policy');
    await expect(page.getByText('Effective 24 November 2026')).toBeVisible();
    await expect(page.getByText('The short version.')).toBeVisible();
    const sections = page.locator('article h2');
    await expect(sections).toHaveCount(9);
    await expect(sections.first()).toHaveText('1. Who I am');
    await expect(sections.last()).toHaveText('9. Questions');
  });

  test('the two pages link to each other', async ({ page }) => {
    await page.goto('/emergency-tower/support/');
    await page.locator('a[href="/emergency-tower/privacy/"]').click();
    await expect(page).toHaveURL(/\/emergency-tower\/privacy\/$/);
    await page.locator('a[href="/emergency-tower/support/"]').click();
    await expect(page).toHaveURL(/\/emergency-tower\/support\/$/);
  });
});
