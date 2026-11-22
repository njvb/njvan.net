import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { sitePages } from './helpers';

// Serious and critical accessibility problems fail the build. (Minor ones show in the report.)
for (const route of sitePages().filter((r) => r !== '/404.html')) {
  test(`accessibility of ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500); // let the entrance motion settle: contrast is read from what is drawn
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(
      bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} element(s), e.g. ${v.nodes[0]?.target.join(' ')}`),
      'accessibility violations'
    ).toEqual([]);
  });
}

test('an opened project scene has no serious accessibility problems', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-open-project="kora"]').click();
  await page.waitForTimeout(2500);
  const results = await new AxeBuilder({ page }).include('[data-stage]').withTags(['wcag2a', 'wcag2aa']).analyze();
  const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.map((v) => `${v.id}: ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
});
