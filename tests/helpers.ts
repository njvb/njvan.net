import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';

const dist = path.resolve(import.meta.dirname, '..', 'dist');

/** Every page in the built site, as the URL path it is served at (found from dist/, so new pages are covered at once). */
export function sitePages(): string[] {
  if (!fs.existsSync(dist)) throw new Error('dist/ is missing: run `npm run build` (or `npm test`, which builds first).');
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) {
        const rel = '/' + path.relative(dist, full).split(path.sep).join('/');
        found.push(rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel);
      }
    }
  };
  walk(dist);
  return found.sort();
}

/** Pages that are not meant to be indexed, so they have no canonical or share tags. */
export const NOT_INDEXED = new Set(['/404.html']);

/**
 * Collects page errors and failed requests while a page loads and is used. Call `.expectNone()` at the end.
 * Third-party failures are not the site's fault, so only same-origin requests count.
 */
export function watchErrors(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console error: ${m.text()}`);
  });
  page.on('requestfailed', (r) => {
    // The browser cancels media it no longer needs (the Campaign Tower video): not a failure.
    if (r.resourceType() === 'media' || /ERR_ABORTED|cancelled/i.test(r.failure()?.errorText ?? '')) return;
    const url = new URL(r.url());
    if (url.origin === new URL(page.url() || 'http://127.0.0.1').origin || url.hostname === '127.0.0.1') {
      problems.push(`request failed: ${r.url()} (${r.failure()?.errorText})`);
    }
  });
  page.on('response', (r) => {
    const url = new URL(r.url());
    if (url.hostname === '127.0.0.1' && r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`);
  });
  return { expectNone: () => expect(problems, problems.join('\n')).toEqual([]) };
}
