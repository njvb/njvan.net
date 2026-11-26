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

// The Dock icon is optional (Settings, General), so no page says flatly that there isn't one.
test.describe('WorldBar Dock icon wording', () => {
  test('the facts strip says the Dock icon is optional', async ({ page }) => {
    await page.goto('/worldbar/');
    await expect(page.locator('[data-wb-facts]')).toContainText('Dock icon optional');
  });

  test('the support page does not say flatly that there is no Dock icon', async ({ page }) => {
    await page.goto('/worldbar/support/');
    const item = page.locator('.faq__item', { hasText: "I can't see a window" });
    await expect(item).toContainText('unless you turn one on');
    await expect(page.getByText('Menu bar app, no Dock icon')).toHaveCount(0);
  });
});

// WorldBar is live on the Mac App Store: every download button goes to its listing, and the beta link is gone.
test.describe('WorldBar is on the Mac App Store', () => {
  const LISTING = 'https://apps.apple.com/app/id6836081075';

  test('the page links its badges to the listing and has no TestFlight link', async ({ page }) => {
    await page.goto('/worldbar/');
    const badges = page.locator('a.wb-badge');
    expect(await badges.count()).toBeGreaterThanOrEqual(2);
    for (const href of await badges.evaluateAll((els) => els.map((e) => e.getAttribute('href')))) expect(href).toBe(LISTING);
    await expect(page.locator('a[href*="testflight"]')).toHaveCount(0);
    await expect(page.getByText('TestFlight')).toHaveCount(0);
  });

  test('the homepage scene leads with the Apple badge and has no TestFlight link', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-open-project="worldbar"]').click();
    const badge = page.locator('#worldbar a.scene-badge');
    await expect(badge).toHaveAttribute('href', LISTING);
    await expect(badge).toHaveAttribute('rel', /noopener/);
    await expect(page.locator('#worldbar a[href="/worldbar/"]')).toBeAttached();
    await expect(page.locator('#worldbar a[href*="testflight"]')).toHaveCount(0);
  });
});
