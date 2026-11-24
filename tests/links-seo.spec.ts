import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { NOT_INDEXED, sitePages } from './helpers';

const pages = sitePages();
const dist = path.resolve(import.meta.dirname, '..', 'dist');

// Search and sharing: each indexed page says what it is.
// (The standalone Campaign Tower support and privacy files are the App Store's own URLs, served as they were written.)
for (const route of pages.filter((r) => !NOT_INDEXED.has(r) && !r.startsWith('/campaign-tower/') || r === '/campaign-tower/')) {
  test(`SEO tags on ${route}`, async ({ page, request }) => {
    await page.goto(route);
    const meta = (sel: string) => page.locator(sel).first().getAttribute('content');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(8);
    expect(title.length).toBeLessThan(80);
    const description = await meta('meta[name="description"]');
    expect(description?.length ?? 0).toBeGreaterThan(40);
    expect(description?.length ?? 0).toBeLessThan(260);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe(`https://njvan.net${route.replace(/index\.html$/, '')}`);
    for (const key of ['og:title', 'og:description', 'og:image', 'og:url']) {
      expect(await meta(`meta[property="${key}"]`), key).toBeTruthy();
    }
    expect(await meta('meta[name="twitter:card"]')).toBeTruthy();
    // The share image is a real file.
    const image = await meta('meta[property="og:image"]');
    const local = new URL(image!).pathname;
    const res = await request.get(local);
    expect(res.status(), `og:image ${image}`).toBe(200);
    // Structured data parses.
    for (const json of await page.locator('script[type="application/ld+json"]').allTextContents()) {
      expect(() => JSON.parse(json)).not.toThrow();
    }
  });
}

test('the 404 page is not indexed', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('robots.txt points to the sitemap, which lists every indexed page', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('https://njvan.net/sitemap-index.xml');
  const index = await (await request.get('/sitemap-index.xml')).text();
  expect(index).toContain('sitemap-0.xml');
  const map = await (await request.get('/sitemap-0.xml')).text();
  for (const route of pages.filter((r) => !NOT_INDEXED.has(r))) {
    const url = `https://njvan.net${route.replace(/index\.html$/, '')}`;
    // The standalone Campaign Tower support and privacy pages are served as files, not routes.
    if (route.endsWith('.html')) continue;
    expect(map, `sitemap lists ${url}`).toContain(url);
  }
});

// Links: nothing internal is dead, the repos stay private, and external links open safely.
test('internal links resolve, no GitHub repo links, external links are safe', async ({ page, request }) => {
  const seen = new Map<string, string>();
  for (const route of pages) {
    await page.goto(route);
    const links = await page.$$eval('a[href]', (as) =>
      as.map((a) => ({ href: a.getAttribute('href') ?? '', target: a.getAttribute('target'), rel: a.getAttribute('rel') ?? '' }))
    );
    for (const l of links) {
      if (/^(mailto:|tel:|javascript:)/.test(l.href) || l.href.startsWith('#')) continue;
      expect(l.href, `${route} links to a GitHub repo`).not.toMatch(/github\.com\//);
      if (/^https?:\/\//.test(l.href)) {
        if (l.target === '_blank') expect(l.rel, `${route}: ${l.href} opens a tab without noopener`).toContain('noopener');
        continue;
      }
      const abs = new URL(l.href, `http://127.0.0.1${route}`);
      seen.set(abs.pathname, route);
    }
  }
  for (const [href, from] of seen) {
    const file = path.join(dist, href);
    const ok = fs.existsSync(file) && (fs.statSync(file).isFile() || fs.existsSync(path.join(file, 'index.html')));
    expect(ok, `${from} links to ${href}, which does not exist`).toBe(true);
    void request;
  }
});

test('contact details are in the footer', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href="mailto:njvanderbyl@gmail.com"]')).toBeVisible();
  await expect(page.locator('a[href*="linkedin.com/in/"]')).toBeVisible();
});

// AdMob checks this file at the site root for the developer website on the App Store listings.
test('app-ads.txt lists the AdMob publisher line', async ({ request }) => {
  const res = await request.get('/app-ads.txt');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('text/plain');
  expect((await res.text()).trim()).toBe('google.com, pub-4105854336047546, DIRECT, f08c47fec0942fa0');
});
