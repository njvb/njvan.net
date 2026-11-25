import { expect, test } from '@playwright/test';
import { projects } from '../src/data/projects';
import { watchErrors } from './helpers';

const stage = '[data-stage]';

test.describe('home page', () => {
  test('shows the hero and a card for every project', async ({ page }) => {
    const watch = watchErrors(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Nathan');
    const cards = page.locator('[data-open-project]');
    await expect(cards).toHaveCount(projects.length);
    for (const p of projects) {
      const card = page.locator(`[data-open-project="${p.id}"]`);
      await expect(card).toContainText(p.name);
      await expect(card).toHaveAttribute('href', `#${p.id}`);
    }
    watch.expectNone();
  });

  test('Kora and Cotrip come first, on bigger cards', async ({ page }) => {
    await page.goto('/');
    const first = await page.locator('[data-open-project]').evaluateAll((els) => els.slice(0, 2).map((e) => e.getAttribute('data-open-project')));
    expect(first).toEqual(['kora', 'cotrip']);
    await expect(page.locator('.card--featured')).toHaveCount(2);
  });

  test('card images are in full colour at rest (touch devices have no hover to reveal it)', async ({ page }) => {
    await page.goto('/');
    const filters = await page.locator('.card__tilt > img').evaluateAll((els) => els.map((e) => getComputedStyle(e).filter));
    for (const f of filters) expect(f).toBe('none');
  });

  test('the hero says what I do, where I am, and how to get in touch', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero__sub')).toHaveText('I design and build apps, tools and games for the web and Apple platforms.');
    const avail = page.locator('.hero__avail');
    await expect(avail).toContainText('Based in London');
    await expect(avail).toContainText('Open to select freelance projects');
    await expect(avail.getByRole('link', { name: 'Get in touch' })).toHaveAttribute('href', /^mailto:njvanderbyl@gmail\.com/);
  });

  for (const p of projects) {
    test(`opens and closes ${p.name}`, async ({ page }) => {
      const watch = watchErrors(page);
      await page.goto('/');
      const card = page.locator(`[data-open-project="${p.id}"]`);
      await card.scrollIntoViewIfNeeded();
      await card.click();
      await expect(page.locator(stage)).toHaveClass(/is-open/);
      const scene = page.locator(`#${p.id}`);
      await expect(scene).toHaveClass(/is-current/);
      // The name is text or a wordmark image with the name as its alt text.
      await expect(scene.locator('[data-scene-name]')).toHaveAccessibleName(new RegExp(p.name, 'i'));
      await expect(page).toHaveURL(new RegExp(`#${p.id}$`));
      // The rest of the page cannot be reached while it is open.
      await expect(page.locator('#projects')).toHaveAttribute('inert', '');
      // The scene's real buttons are there and point somewhere.
      for (const l of p.links) {
        if (l.href) await expect(scene.locator(`a[href="${l.href}"]`).first()).toBeAttached();
      }
      await page.getByRole('button', { name: 'Close project' }).click();
      await expect(page.locator(stage)).not.toHaveClass(/is-open/);
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator('#projects')).not.toHaveAttribute('inert', '');
      watch.expectNone();
    });
  }

  test('moves between projects with Next, Prev, the pills and the arrow keys', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.locator(`[data-open-project="${projects[0]!.id}"]`).click();
    await expect(page.locator(`#${projects[0]!.id}`)).toHaveClass(/is-current/);
    await page.getByRole('button', { name: 'Next project' }).click();
    await expect(page.locator(`#${projects[1]!.id}`)).toHaveClass(/is-current/);
    await expect(page).toHaveURL(new RegExp(`#${projects[1]!.id}$`));
    await page.getByRole('button', { name: 'Previous project' }).click();
    await expect(page.locator(`#${projects[0]!.id}`)).toHaveClass(/is-current/);
    // Previous from the first wraps round to the last.
    await page.getByRole('button', { name: 'Previous project' }).click();
    await expect(page.locator(`#${projects.at(-1)!.id}`)).toHaveClass(/is-current/);
    if (!isMobile) {
      const pill = page.locator(`[data-stage-pill="${projects[2]!.id}"]`);
      await pill.click();
      await expect(page.locator(`#${projects[2]!.id}`)).toHaveClass(/is-current/);
      await expect(pill).toHaveAttribute('aria-current', 'true');
      await page.keyboard.press('ArrowRight');
      await expect(page.locator(`#${projects[3]!.id}`)).toHaveClass(/is-current/);
      await page.keyboard.press('ArrowLeft');
      await expect(page.locator(`#${projects[2]!.id}`)).toHaveClass(/is-current/);
    }
  });

  test('Escape closes and focus returns to the card', async ({ page, isMobile }) => {
    test.skip(isMobile, 'no keyboard on a phone');
    await page.goto('/');
    const card = page.locator(`[data-open-project="${projects[1]!.id}"]`);
    await card.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator(stage)).toHaveClass(/is-open/);
    await page.keyboard.press('Escape');
    await expect(page.locator(stage)).not.toHaveClass(/is-open/);
    await expect(card).toBeFocused();
  });

  test('a project address opens it, and Back closes it', async ({ page }) => {
    const id = projects[3]!.id;
    await page.goto(`/#${id}`);
    await expect(page.locator(stage)).toHaveClass(/is-open/);
    await expect(page.locator(`#${id}`)).toHaveClass(/is-current/);
    await page.goBack();
    // Back from a deep link leaves the site's first page entry; opening from a card is the case that closes.
    await page.goto('/');
    await page.locator(`[data-open-project="${id}"]`).click();
    await expect(page.locator(stage)).toHaveClass(/is-open/);
    await page.goBack();
    await expect(page.locator(stage)).not.toHaveClass(/is-open/);
    await expect(page).toHaveURL(/\/$/);
  });

  test('keeps a visitor from landing on a missing project address', async ({ page }) => {
    await page.goto('/#not-a-project');
    await expect(page.locator(stage)).not.toHaveClass(/is-open/);
    await expect(page.locator('[data-open-project]').first()).toBeVisible();
  });
});
