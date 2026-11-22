import { expect, test } from '@playwright/test';

// Dark is the default whatever the OS prefers; light is only a manual choice, remembered on the device.
test.describe('theme', () => {
  test.use({ colorScheme: 'light' });

  test('is dark by default even when the OS prefers light', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'light');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(10, 10, 10)');
  });

  test('the footer toggle switches to light and is remembered', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-theme-toggle]').first().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.locator('[data-theme-toggle]').first().click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'light');
  });
});
