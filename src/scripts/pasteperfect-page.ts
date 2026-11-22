// The /pasteperfect/ page: the "Try it" window and all the motion.
// The demo mirrors what the PastePerfect app does to the clipboard, in the browser, with no network use:
// strip tracking parameters, or every parameter, or the ones named in custom rules (a * matches any
// text), and tidy the text around the links. Ported from the app's website (website/app.js).
// The window plays itself (a cursor ticks the boxes) until the visitor touches it. Timings are in
// src/lib/motion.ts (PASTEPERFECT). Reduced motion shows everything settled; the demo still works.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { ANIMAXXING_CURVE, EASE, PASTEPERFECT as PP } from '../lib/motion';
import { prefersReducedMotion } from '../lib/effects/util';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('animaxxing', ANIMAXXING_CURVE);

const reduced = prefersReducedMotion();
const $ = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));
const rnd = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

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

const escapeHtml = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string);

/** One link, cleaned: its text, and the same link as HTML with the parameters on their way out crossed out. */
function cleanUrl(url: string, mode: Mode, custom: RegExp[], removed: string[]): { text: string; html: string } {
  const m = url.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  if (!m || !m[2]) return { text: url, html: escapeHtml(url) };
  const kept: string[] = [];
  const marked: string[] = [];
  let first = true;
  for (const pair of m[2].slice(1).split('&')) {
    if (!pair) continue;
    const key = paramName(pair);
    const drop = mode === 'all' ? true : mode === 'custom' ? custom.some((r) => r.test(key)) : TRACKING.some((r) => r.test(key));
    const piece = (first ? '' : '&') + pair;
    first = false;
    if (drop) {
      removed.push(key);
      marked.push(`<s class="pp-strip">${escapeHtml(piece)}</s>`);
    } else {
      kept.push(pair);
      marked.push(escapeHtml(piece));
    }
  }
  const tail = m[3] ?? '';
  return {
    text: m[1] + (kept.length ? `?${kept.join('&')}` : '') + tail,
    html: escapeHtml(m[1]) + (marked.length ? '?' : '') + marked.join('') + escapeHtml(tail),
  };
}

/** Zero-width characters: space, non-joiner, joiner, word joiner and the byte order mark. */
const ZERO_WIDTH = /[​‌‍⁠﻿]/g;
const URL_RE = /https?:\/\/[^\s<>"')\]]+/g;

function clean(text: string, opts: Options): { text: string; html: string; removed: string[] } {
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
  if (!opts.urls) return { text: out, html: escapeHtml(out), removed };
  const rules = opts.custom.split(/[\s,]+/).filter(Boolean).map(wildcard);
  let plain = '';
  let html = '';
  let at = 0;
  for (const m of out.matchAll(URL_RE)) {
    const gap = out.slice(at, m.index);
    const r = cleanUrl(m[0], opts.mode, rules, removed);
    plain += gap + r.text;
    html += escapeHtml(gap) + r.html;
    at = (m.index ?? 0) + m[0].length;
  }
  plain += out.slice(at);
  html += escapeHtml(out.slice(at));
  return { text: plain, html, removed };
}

/* ---------------------------------------------------------------------------------------------
 * The "Try it" window
 * ------------------------------------------------------------------------------------------- */

function setupDemo(): void {
  const q = <T extends HTMLElement>(name: string) => document.querySelector<T>(`[data-pp="${name}"]`);
  const win = $<HTMLElement>('[data-pp-win]');
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
  const cursor = q<HTMLElement>('cursor');
  const replay = q<HTMLButtonElement>('replay');
  if (!win || !input || !result || !removedEl || !mode || !customWrap || !custom || !urls || !tidy || !copyBtn || !status || !cursor || !replay) return;

  let current = '';
  let strikeId = 0;

  /** Draws the result. With `animate`, parameters that were just removed are crossed out, then fold away. */
  const render = (animate: boolean) => {
    customWrap.hidden = mode.value !== 'custom';
    const r = clean(input.value, { urls: urls.checked, tidy: tidy.checked, mode: mode.value as Mode, custom: custom.value });
    current = r.text;
    const done = escapeHtml(r.text) || '&nbsp;';
    removedEl.textContent = r.removed.length ? `Removed: ${r.removed.join(', ')}` : 'Nothing to remove.';
    status.textContent = '';
    const id = ++strikeId;
    if (!animate || reduced) {
      result.innerHTML = done;
      return;
    }
    gsap.fromTo(result, { boxShadow: '0 0 0 0 rgba(90,210,130,0.55)' }, { boxShadow: '0 0 0 10px rgba(90,210,130,0)', duration: 0.7, ease: 'power2.out', clearProps: 'boxShadow' });
    if (!r.html.includes('pp-strip')) {
      result.innerHTML = done;
      return;
    }
    result.innerHTML = r.html;
    const strips = $$<HTMLElement>('.pp-strip', result);
    gsap.set(strips, { width: (i) => strips[i].offsetWidth });
    gsap.to(strips, {
      width: 0,
      opacity: 0,
      duration: PP.demo.strip * 0.7,
      delay: PP.demo.strip * 0.5,
      ease: 'power2.in',
      stagger: 0.07,
      onComplete: () => {
        if (id === strikeId) result.innerHTML = done;
      },
    });
  };

  for (const el of [input, custom]) el.addEventListener('input', () => render(false));
  for (const el of [urls, tidy, mode]) el.addEventListener('change', () => render(true));

  const copied = (text: string) => {
    status.textContent = text;
    if (!reduced) {
      gsap.fromTo(status, { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: EASE.entrance });
      gsap.fromTo(copyBtn, { scale: 0.93 }, { scale: 1, duration: 0.45, ease: 'back.out(3)' });
    }
  };
  copyBtn.addEventListener('click', () => {
    const fallback = () => (status.textContent = 'Select the green panel and copy it.');
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(current).then(() => copied('Copied the cleaned text.'), fallback);
    } else fallback();
  });

  /* ----- autoplay: a cursor ticks the boxes ----- */
  let runId = 0;
  let visible = false;
  const sleep = (sec: number) => new Promise<void>((res) => void gsap.delayedCall(sec, () => res()));
  const tween = (vars: gsap.TweenVars) => new Promise<void>((res) => void gsap.to(cursor, { ...vars, onComplete: () => res() }));

  const centre = (el: HTMLElement) => {
    const w = win.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - w.left + r.width / 2, y: r.top - w.top + r.height / 2 };
  };

  const click = async () => {
    const ring = $<HTMLElement>('.pp-cursor__ring', cursor);
    gsap.fromTo(cursor, { scale: 1 }, { scale: 0.82, duration: 0.09, yoyo: true, repeat: 1 });
    if (ring) gsap.fromTo(ring, { scale: 0.4, opacity: 0.9 }, { scale: 1.5, opacity: 0, duration: 0.5, ease: 'power2.out' });
    await sleep(0.14);
  };

  const hover = async (el: HTMLElement, alive: () => boolean) => {
    const to = centre(el);
    await tween({ x: to.x, y: to.y, duration: PP.demo.glide, ease: 'power2.inOut' });
    return alive();
  };

  const resetDemo = () => {
    urls.checked = false;
    tidy.checked = false;
    mode.value = 'tracking';
    render(false);
  };

  const play = async () => {
    const id = ++runId;
    const alive = () => id === runId;
    replay.hidden = true;
    for (;;) {
      resetDemo();
      const w = win.getBoundingClientRect();
      gsap.set(cursor, { x: w.width - 90, y: w.height - 30, opacity: 0, scale: 1 });
      while (!visible) {
        await sleep(0.3);
        if (!alive()) return;
      }
      gsap.to(cursor, { opacity: 1, duration: 0.3 });
      const box = (el: HTMLInputElement) => el.nextElementSibling as HTMLElement;

      if (!(await hover(box(tidy), alive))) return;
      await click();
      tidy.checked = true;
      render(true);
      await sleep(PP.demo.beat * 1.4);
      if (!alive()) return;

      if (!(await hover(box(urls), alive))) return;
      await click();
      urls.checked = true;
      render(true);
      await sleep(PP.demo.strip * 2 + PP.demo.beat);
      if (!alive()) return;

      if (!(await hover(mode, alive))) return;
      await click();
      mode.value = 'all';
      render(true);
      await sleep(PP.demo.strip * 2 + PP.demo.beat);
      if (!alive()) return;
      await click();
      mode.value = 'tracking';
      render(true);
      await sleep(PP.demo.beat * 1.4);
      if (!alive()) return;

      if (!(await hover(copyBtn, alive))) return;
      await click();
      copied('Copied the cleaned text.');
      await sleep(PP.demo.rest);
      if (!alive()) return;
      await tween({ opacity: 0, duration: 0.3 });
      if (!alive()) return;
    }
  };

  const stop = () => {
    runId++;
    gsap.killTweensOf(cursor);
    gsap.to(cursor, { opacity: 0, duration: 0.2 });
    replay.hidden = false;
  };

  if (reduced) {
    urls.checked = true;
    tidy.checked = true;
    render(false);
    return;
  }

  resetDemo();
  // Any real touch of the window hands it to the visitor.
  for (const ev of ['pointerdown', 'keydown', 'focusin'] as const) {
    win.addEventListener(ev, (e) => {
      if (e.target === replay) return;
      if (runId) stop();
    });
  }
  replay.addEventListener('click', () => {
    void play();
  });
  new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting && e.intersectionRatio > 0.4;
      if (visible && runId === 0) void play();
    },
    { threshold: [0, 0.4, 0.7] },
  ).observe(win);
}

/* ---------------------------------------------------------------------------------------------
 * Page motion
 * ------------------------------------------------------------------------------------------- */

function setupHero(): void {
  const hero = $<HTMLElement>('.pp-hero');
  const name = $<HTMLElement>('.pp-hero__name');
  const shot = $<HTMLElement>('[data-pp-shot]');
  const stage = $<HTMLElement>('[data-pp-stage]');
  if (!hero || !name || !shot || !stage) return;

  const split = SplitText.create(name, { type: 'chars', charsClass: 'pp-char', aria: 'auto' });
  const copy = $$<HTMLElement>('.pp-icon, .pp-hero__line, .pp-hero__more, .pp-links, .pp-hero__note', hero);
  const [icon, ...rest] = copy;

  gsap.set(split.chars, { yPercent: PP.letters.from, opacity: 0, rotate: 9 });
  gsap.set(icon, { scale: 0, rotate: -20, opacity: 0 });
  gsap.set(rest, { y: 26, opacity: 0 });
  gsap.set(shot, { x: PP.window.from.x, rotateY: PP.window.from.rotateY, rotateX: PP.window.from.rotateX, opacity: 0, transformOrigin: '50% 50%' });
  delete document.documentElement.dataset.ppIntro;

  const tl = gsap.timeline({ defaults: { ease: 'animaxxing' } });
  tl.to(icon, { scale: 1, rotate: 0, opacity: 1, duration: 0.9, ease: 'back.out(2.2)' }, 0.1)
    .to(split.chars, { yPercent: 0, opacity: 1, rotate: 0, duration: PP.letters.duration, stagger: PP.letters.stagger }, 0.2)
    .to(rest, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 }, 0.75)
    .to(shot, { x: 0, rotateY: 0, rotateX: 0, opacity: 1, duration: PP.window.duration }, PP.window.delay)
    .add(() => {
      gsap.to(shot, { y: -PP.window.float.amplitude, duration: PP.window.float.duration, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });

  if (matchMedia('(hover: hover)').matches) {
    // Letters hop when the pointer runs over them.
    for (const ch of split.chars) {
      ch.addEventListener('pointerenter', () => {
        if (tl.isActive()) return;
        gsap.fromTo(ch, { y: 0, rotate: 0 }, { y: -16, rotate: rnd(-8, 8), duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1, overwrite: 'auto' });
      });
    }
    // The window leans toward the pointer.
    const rx = gsap.quickTo(stage, 'rotateX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(stage, 'rotateY', { duration: 0.6, ease: 'power3.out' });
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      ry(nx * PP.parallax.turn * PP.parallax.follow);
      rx(-ny * PP.parallax.tilt * PP.parallax.follow);
    });
    hero.addEventListener('pointerleave', () => {
      ry(0);
      rx(0);
    });
  }

  // Orbs drift and ease up as you scroll away.
  $$<HTMLElement>('.pp-orb', hero).forEach((orb, i) => {
    gsap.to(orb, { x: (i ? -1 : 1) * PP.orbs.drift, y: (i ? 1 : -1) * PP.orbs.drift, duration: PP.orbs.duration, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  });
  gsap.to($('.pp-hero__field', hero), { yPercent: 18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });

  // Tracking chips: they show up on the window, get crossed out, and are flung away.
  const chips = $$<HTMLElement>('[data-pp-chip]', stage);
  const loops = chips.map((chip, i) => {
    chip.innerHTML = `<span class="pp-chip__x">${chip.textContent}</span>`;
    const right = chip.className.includes('--1') || chip.className.includes('--3');
    const c = PP.chips;
    const t = gsap.timeline({ repeat: -1, delay: 1.8 + i * 0.75, repeatDelay: rnd(c.gap[0], c.gap[1]) });
    t.set(chip, { x: 0, y: 8, rotate: 0, scale: 0.7, opacity: 0 })
      .add(() => chip.classList.remove('is-struck'))
      .to(chip, { opacity: 1, y: 0, scale: 1, duration: c.appear, ease: 'back.out(2.4)' })
      .to(chip, { y: -6, duration: c.hold, ease: 'sine.inOut' })
      .add(() => chip.classList.add('is-struck'))
      .to({}, { duration: c.strike })
      .to(chip, { x: (right ? 1 : -1) * rnd(120, 200), y: rnd(-120, -40), rotate: rnd(-25, 25), scale: 0.6, opacity: 0, duration: c.fling, ease: 'power3.in' });
    return t;
  });
  ScrollTrigger.create({
    trigger: hero,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => loops.forEach((t) => (self.isActive ? t.play() : t.pause())),
  });
}

/** A strip of crossed-out parameters that drifts, and speeds up with the scroll. */
function setupMarquee(): void {
  const band = $<HTMLElement>('[data-pp-mq]');
  const track = $<HTMLElement>('[data-pp-mq-track]');
  const row = track?.firstElementChild as HTMLElement | null;
  if (!band || !track || !row) return;
  let x = 0;
  let boost = 0;
  let on = false;
  new IntersectionObserver(([e]) => (on = e.isIntersecting)).observe(band);
  ScrollTrigger.create({ onUpdate: (self) => (boost = Math.min(Math.abs(self.getVelocity()) * 0.3, 700)) });
  gsap.ticker.add((_t, dt) => {
    if (!on) return;
    x -= ((PP.marquee + boost) * dt) / 1000;
    boost *= 0.93;
    const w = row.offsetWidth;
    if (w && x <= -w) x += w;
    gsap.set(track, { x });
  });
}

function setupReveals(): void {
  const R = PP.reveal;
  const once = (trigger: Element, start: string = R.start) => ({ trigger, start, once: true });

  // Headings rise out of a mask, line by line.
  for (const h of $$<HTMLElement>('.pp-h2')) {
    const split = SplitText.create(h, { type: 'lines', mask: 'lines', linesClass: 'pp-line', aria: 'auto' });
    gsap.from(split.lines, { yPercent: 110, duration: 0.9, ease: 'animaxxing', stagger: 0.09, scrollTrigger: once(h) });
  }
  for (const el of $$<HTMLElement>('.pp-lede')) {
    gsap.from(el, { y: 20, opacity: 0, duration: R.duration, ease: EASE.entrance, scrollTrigger: once(el) });
  }

  const win = $<HTMLElement>('[data-pp-win]');
  if (win) gsap.from(win, { y: 60, opacity: 0, scale: 0.97, duration: 0.95, ease: 'animaxxing', scrollTrigger: once(win, 'top 88%') });

  const steps = $$<HTMLElement>('.pp-steps li');
  if (steps.length) {
    gsap.from(steps, { y: R.y + 14, opacity: 0, rotateX: -14, transformOrigin: '50% 100%', duration: 0.9, ease: 'animaxxing', stagger: 0.14, scrollTrigger: once(steps[0].parentElement!) });
  }

  // Before and after: the tracking tail is crossed out and folds away into the clean link.
  const ba = $<HTMLElement>('.pp-ba');
  const tr = $<HTMLElement>('[data-pp-tr]');
  const after = $<HTMLElement>('[data-pp-after]');
  const go = $<HTMLElement>('[data-pp-go]');
  if (ba && tr && after && go) {
    const fire = () => {
      gsap.killTweensOf([tr, after, go]);
      tr.classList.remove('pp-strip');
      gsap.set(tr, { clearProps: 'width,opacity' });
      gsap.set(after, { opacity: 0.3 });
      const w = tr.offsetWidth;
      gsap
        .timeline()
        .add(() => tr.classList.add('pp-strip'), 0.5)
        .set(tr, { width: w }, 0.5)
        .to(tr, { width: 0, opacity: 0, duration: 0.7, ease: 'power2.in' }, 1.1)
        .to(go, { x: 16, duration: 0.3, yoyo: true, repeat: 1, ease: 'power2.out' }, 1.3)
        .to(after, { opacity: 1, duration: 0.5 }, 1.7)
        .fromTo(after, { boxShadow: '0 0 0 0 rgba(90,210,130,0.55)' }, { boxShadow: '0 0 0 12px rgba(90,210,130,0)', duration: 0.8, clearProps: 'boxShadow' }, 1.7);
    };
    ScrollTrigger.create({ trigger: ba, start: 'top 80%', onEnter: fire, onEnterBack: fire });
  }

  const cells = $$<HTMLElement>('.pp-cell');
  if (cells.length) {
    ScrollTrigger.batch(cells, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.from(batch, { y: R.y, opacity: 0, scale: 0.96, duration: 0.8, ease: 'animaxxing', stagger: 0.09, overwrite: true }),
    });
  }

  // Privacy: the ticks pop in one after another.
  const checks = $$<HTMLElement>('.pp-checks li');
  if (checks.length) {
    gsap.set(checks, { '--s': 0, x: -14, opacity: 0 });
    ScrollTrigger.create({
      trigger: checks[0].parentElement!,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(checks, { x: 0, opacity: 1, duration: 0.5, ease: EASE.entrance, stagger: 0.13 });
        gsap.to(checks, { '--s': 1, duration: 0.6, ease: 'back.out(2.6)', stagger: 0.13, delay: 0.1 });
      },
    });
  }

  // Questions: rows rise in, answers open with a slide.
  const faqs = $$<HTMLDetailsElement>('.pp-faq details');
  if (faqs.length) {
    gsap.from(faqs, { y: 22, opacity: 0, duration: 0.7, ease: EASE.entrance, stagger: 0.08, scrollTrigger: once(faqs[0].parentElement!, 'top 88%') });
    for (const d of faqs) {
      d.addEventListener('toggle', () => {
        const p = $<HTMLElement>('p', d);
        if (d.open && p) gsap.from(p, { height: 0, opacity: 0, y: -6, duration: 0.4, ease: 'power2.out', clearProps: 'all' });
      });
    }
  }

  // Closing: the line drops in letter by letter, the facts follow.
  const endTitle = $<HTMLElement>('.pp-end__title');
  if (endTitle) {
    const split = SplitText.create(endTitle, { type: 'chars', charsClass: 'pp-char', aria: 'auto' });
    gsap.from(split.chars, { yPercent: 110, opacity: 0, rotate: 8, duration: 0.8, ease: 'animaxxing', stagger: 0.03, scrollTrigger: once(endTitle, 'top 85%') });
    if (matchMedia('(hover: hover)').matches) {
      for (const ch of split.chars) {
        ch.addEventListener('pointerenter', () => gsap.fromTo(ch, { y: 0 }, { y: -14, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1, overwrite: 'auto' }));
      }
    }
    const end = $<HTMLElement>('.pp-end');
    gsap.from($$('.pp-facts li, .pp-end .pp-links > *', end ?? document), { y: 20, opacity: 0, duration: 0.6, ease: EASE.entrance, stagger: 0.08, scrollTrigger: once(endTitle, 'top 70%') });
  }
}

/** A glow that follows the pointer across cards, and buttons that lean toward it. */
function setupHover(): void {
  if (!matchMedia('(hover: hover)').matches) return;
  for (const card of $$<HTMLElement>('.pp-steps li, .pp-cell')) {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }
  for (const btn of $$<HTMLElement>('.pp .btn')) {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.18, y: (e.clientY - r.top - r.height / 2) * 0.25, duration: 0.3, ease: 'power3.out' });
    });
    btn.addEventListener('pointerleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' }));
  }
}

setupDemo();
if (!reduced) {
  setupHero();
  setupMarquee();
  setupReveals();
  setupHover();
}
