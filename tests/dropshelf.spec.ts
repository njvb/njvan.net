import { expect, test } from '@playwright/test';

// DropShelf's page, support and privacy (the URLs its App Store listing will use), and its homepage scene.
test.describe('DropShelf', () => {
  test('the page has the pitch, the real screenshots and a Coming soon placeholder, with no price or store link', async ({ page }) => {
    await page.goto('/dropshelf/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your files. All in one place.');
    await expect(page.getByText('Coming soon to the Mac App Store').first()).toBeVisible();
    await expect(page.locator('a[href*="apps.apple.com"], a[href*="testflight"]')).toHaveCount(0);
    // The Pro price is a launch promotion that changes, so the page names no figure.
    await expect(page.locator('main')).not.toContainText(/[£$]\s?\d/);
    await expect(page.locator('.ds-shots img')).toHaveCount(4);
    for (const img of await page.locator('.ds-shots img').all()) await expect(img).toHaveAttribute('alt', /.{12,}/);
  });

  test('the Link / Copy / Move cards explain each choice', async ({ page }) => {
    await page.goto('/dropshelf/');
    const live = page.locator('[data-ds-live]');
    await page.locator('[data-ds-mode="move"]').click();
    await expect(page.locator('[data-ds-mode="move"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(live).toContainText('asks first');
    await page.locator('[data-ds-mode="copy"]').click();
    await expect(live).toContainText('independent copy');
  });

  test('support has the contact address, 13 questions and known issues; privacy has 10 sections', async ({ page }) => {
    await page.goto('/dropshelf/support/');
    await expect(page.locator('main a[href^="mailto:njvanderbyl@gmail.com"]').first()).toBeVisible();
    await expect(page.locator('.faq__item')).toHaveCount(13);
    await expect(page.getByRole('heading', { name: 'Known issues' })).toBeVisible();
    await page.goto('/dropshelf/privacy/');
    await expect(page.getByText('Effective 25 November 2026')).toBeVisible();
    await expect(page.locator('article h2')).toHaveCount(10);
  });

  test('its homepage scene links to the page and shows the app', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-open-project="dropshelf"]').click();
    const scene = page.locator('#dropshelf');
    await expect(scene).toHaveClass(/is-current/);
    await expect(scene.locator('a[href="/dropshelf/"]')).toBeAttached();
    await expect(scene.locator('[data-ds-library]')).toBeAttached();
  });
});
