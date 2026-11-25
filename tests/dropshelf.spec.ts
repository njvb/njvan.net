import { expect, test } from '@playwright/test';

// DropShelf's page is the app's own design, ported (scoped to .dsx). Support and privacy are the App Store's URLs.
test.describe('DropShelf', () => {
  test('the page is the ported design, with the corrected facts and no price or store link', async ({ page }) => {
    await page.goto('/dropshelf/');
    await expect(page.locator('.dsx')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your files. All in one place.');
    await expect(page.locator('.dsx .release-note')).toContainText('Coming soon to the Mac App Store');
    await expect(page.locator('a[href*="apps.apple.com"], a[href*="testflight"]')).toHaveCount(0);
    // The Pro price is a launch promotion that changes, so the page names no figure; the old "proposed" price is gone.
    await expect(page.locator('main')).not.toContainText(/[£$]\s?\d/);
    await expect(page.locator('main')).not.toContainText('proposed');
    await expect(page.locator('a[href="/dropshelf/support/"]').first()).toBeAttached();
    await expect(page.locator('a[href="/dropshelf/privacy/"]').first()).toBeAttached();
  });

  test('its own Link / Copy / Move demo, tour and release dialog work', async ({ page }) => {
    await page.goto('/dropshelf/');
    await page.locator('[data-mode="move"]').click();
    await expect(page.locator('[data-mode="move"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#mode-description')).toContainText('Move transfers');
    await page.locator('[data-tour]').first().click();
    await expect(page.locator('#preview-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.locator('.dsx [data-download]').first().click();
    await expect(page.locator('#dialog-content')).toContainText('coming soon');
  });

  test('support has 13 questions and known issues; privacy has 10 sections', async ({ page }) => {
    await page.goto('/dropshelf/support/');
    await expect(page.locator('main a[href^="mailto:njvanderbyl@gmail.com"]').first()).toBeVisible();
    await expect(page.locator('.faq__item')).toHaveCount(13);
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
