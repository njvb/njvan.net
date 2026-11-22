import { expect, test } from '@playwright/test';
import { NOT_INDEXED, sitePages, watchErrors } from './helpers';

// Every page loads, is not broken, and has a title and a main heading.
for (const route of sitePages()) {
  test(`loads ${route}`, async ({ page }) => {
    const watch = watchErrors(page);
    const response = await page.goto(route);
    // The 404 page is served as a file here, so it answers 200 like any other.
    expect(response?.status()).toBe(200);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/.{4,}/);
    if (!NOT_INDEXED.has(route)) await expect(page.locator('h1').first()).toBeVisible();
    // Nothing should push the page sideways on any screen.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(1);
    watch.expectNone();
  });
}
