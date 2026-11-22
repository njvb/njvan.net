import { expect, test } from '@playwright/test';
import { watchErrors } from './helpers';

test.describe('PastePerfect page', () => {
  test('the Try it window cleans a messy link, and every control does what it says', async ({ page }) => {
    const watch = watchErrors(page);
    await page.goto('/pasteperfect/');
    await page.locator('#try').scrollIntoViewIfNeeded();
    // Take the window over from its autoplay.
    await page.locator('[data-pp="in"]').click();
    const out = page.locator('[data-pp="out"]');
    const tidy = page.locator('[data-pp="tidy"]');
    const urls = page.locator('[data-pp="urls"]');
    const mode = page.locator('[data-pp="mode"]');

    await tidy.setChecked(false, { force: true });
    await urls.setChecked(false, { force: true });
    await expect(out).toContainText('utm_source=newsletter');
    await expect(out).toContainText('Check this out:  https'); // two spaces: untidied

    await tidy.setChecked(true, { force: true });
    await expect(out).toContainText('Check this out: https');
    await urls.setChecked(true, { force: true });
    await expect(out).toHaveText('Check this out: https://example.com/article?id=123&page=2 Thanks!');
    await expect(page.locator('[data-pp="removed"]')).toContainText('utm_source');

    await mode.selectOption('all');
    await expect(out).toHaveText('Check this out: https://example.com/article Thanks!');

    await mode.selectOption('custom');
    await expect(page.locator('[data-pp="custom-wrap"]')).toBeVisible();
    await page.locator('[data-pp="custom"]').fill('page');
    await expect(out).not.toContainText('page=2');
    await expect(out).toContainText('utm_source=newsletter');
    watch.expectNone();
  });

  test('the store button is a "Coming soon" placeholder until the app is live', async ({ page }) => {
    await page.goto('/pasteperfect/');
    await expect(page.getByText('Coming soon to the Mac App Store').first()).toBeVisible();
    await expect(page.locator('a[href*="testflight"], a[href*="apps.apple.com"]')).toHaveCount(0);
  });

  test('support and privacy pages carry the contact address', async ({ page }) => {
    for (const p of ['support', 'privacy']) {
      await page.goto(`/pasteperfect/${p}/`);
      await expect(page.locator('main')).toContainText('njvanderbyl@gmail.com');
    }
  });
});
