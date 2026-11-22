import { expect, test } from '@playwright/test';
import { projects } from '../src/data/projects';

// Without JavaScript the page is still readable: cards link to the scenes, which are plain sections.
test.describe('no JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('home shows the cards and every project scene', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-open-project]')).toHaveCount(projects.length);
    for (const p of projects) {
      await expect(page.locator(`#${p.id}`)).toBeAttached();
      await expect(page.locator(`#${p.id} [data-scene-name]`)).toBeAttached();
    }
    await expect(page.locator('html')).not.toHaveClass(/has-stage/);
  });
});
