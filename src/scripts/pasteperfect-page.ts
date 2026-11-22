// The "Try it" demo on /pasteperfect/. It mirrors what the PastePerfect app does to the clipboard,
// in the browser, with no network use: strip tracking parameters, or every parameter, or the ones
// named in custom rules (a * matches any text), and tidy the text around the links.
// Ported from the app's website (website/app.js); only the selectors are the site's own (data-pp-*).

/** Query parameters that are only there to track a click. */
const TRACKING = [
  /^utm_/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^dclid$/i,
  /^msclkid$/i,
  /^igshid$/i,
  /^mc_cid$/i,
  /^mc_eid$/i,
  /^_hsenc$/i,
  /^_hsmi$/i,
  /^ref_src$/i,
  /^yclid$/i,
  /^twclid$/i,
];

type Mode = 'tracking' | 'all' | 'custom';
type Options = { urls: boolean; tidy: boolean; mode: Mode; custom: string };

/** A custom rule such as "promo_*" as a case-insensitive whole-name match. */
function wildcard(rule: string): RegExp {
  const escaped = rule
    .trim()
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`, 'i');
}

/** A parameter name as written, decoded when it can be (a stray % must not stop the demo). */
function paramName(pair: string): string {
  const raw = pair.split('=')[0] ?? '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function cleanUrl(url: string, mode: Mode, custom: RegExp[], removed: string[]): string {
  const m = url.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  if (!m || !m[2]) return url;
  const kept: string[] = [];
  for (const pair of m[2].slice(1).split('&')) {
    if (!pair) continue;
    const key = paramName(pair);
    const drop = mode === 'all' ? true : mode === 'custom' ? custom.some((r) => r.test(key)) : TRACKING.some((r) => r.test(key));
    if (drop) removed.push(key);
    else kept.push(pair);
  }
  return m[1] + (kept.length ? `?${kept.join('&')}` : '') + (m[3] ?? '');
}

/** Zero-width characters: space, non-joiner, joiner, word joiner and the byte order mark. */
const ZERO_WIDTH = /[​‌‍⁠﻿]/g;

function clean(text: string, opts: Options): { text: string; removed: string[] } {
  const removed: string[] = [];
  let out = text;
  if (opts.tidy) {
    out = out
      .replace(ZERO_WIDTH, '')
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+$/gm, '')
      .replace(/([^\s\n]) {2,}/g, '$1 ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  if (opts.urls) {
    const rules = opts.custom.split(/[\s,]+/).filter(Boolean).map(wildcard);
    out = out.replace(/https?:\/\/[^\s<>"')\]]+/g, (u) => cleanUrl(u, opts.mode, rules, removed));
  }
  return { text: out, removed };
}

const escapeHtml = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string);

function setup(): void {
  const q = <T extends HTMLElement>(name: string) => document.querySelector<T>(`[data-pp="${name}"]`);
  const input = q<HTMLTextAreaElement>('in');
  const result = q<HTMLElement>('out');
  const removedEl = q<HTMLElement>('removed');
  const mode = q<HTMLSelectElement>('mode');
  const customWrap = q<HTMLElement>('custom-wrap');
  const custom = q<HTMLInputElement>('custom');
  const urls = q<HTMLInputElement>('urls');
  const tidy = q<HTMLInputElement>('tidy');
  const copyBtn = q<HTMLButtonElement>('copy');
  const status = q<HTMLElement>('status');
  if (!input || !result || !removedEl || !mode || !customWrap || !custom || !urls || !tidy || !copyBtn || !status) return;

  let current = '';
  const run = () => {
    customWrap.hidden = mode.value !== 'custom';
    const r = clean(input.value, { urls: urls.checked, tidy: tidy.checked, mode: mode.value as Mode, custom: custom.value });
    current = r.text;
    result.innerHTML = escapeHtml(r.text) || '&nbsp;';
    removedEl.textContent = r.removed.length ? `Removed: ${r.removed.join(', ')}` : 'Nothing to remove.';
    status.textContent = '';
  };

  for (const el of [input, mode, custom, urls, tidy]) {
    el.addEventListener('input', run);
    el.addEventListener('change', run);
  }
  copyBtn.addEventListener('click', () => {
    const fallback = () => (status.textContent = 'Select the green panel and copy it.');
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(current).then(() => (status.textContent = 'Copied the cleaned text.'), fallback);
    } else fallback();
  });
  run();
}

setup();
