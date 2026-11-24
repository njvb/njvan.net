import { expect, test } from '@playwright/test';

// The Dock icon answer (WorldBar 1.0.1) is on the landing page, in its structured data, and on the support page.
test.describe('WorldBar Dock icon FAQ', () => {
  test('support page answers it', async ({ page }) => {
    await page.goto('/worldbar/support/');
    const item = page.locator('.faq__item', { hasText: 'Does WorldBar have a Dock icon?' });
    await expect(item).toBeVisible();
    await expect(item).toContainText('Show in the Dock');
    await expect(item).toContainText('Settings, General');
  });

  test('landing page FAQ and its FAQPage data include it', async ({ page }) => {
    await page.goto('/worldbar/');
    await expect(page.getByText('Does WorldBar have a Dock icon?').first()).toBeAttached();
    const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).flatMap((t) => {
      const d = JSON.parse(t);
      return d['@graph'] ?? [d];
    });
    const faq = ld.find((d) => d['@type'] === 'FAQPage');
    const q = faq.mainEntity.find((e: { name: string }) => e.name === 'Does WorldBar have a Dock icon?');
    expect(q.acceptedAnswer.text).toContain('Show in the Dock');
  });
});
