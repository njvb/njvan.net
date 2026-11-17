// The /worldbar page: claims the boot from the head script, plays the hero (letters drop in,
// the isometric stack falls into place, then floats), runs the live demo, the pinned story and
// the scroll reveals. Reduced motion shows everything settled; the demo still works.
// Timings live in src/lib/motion.ts (WORLDBAR).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { ANIMAXXING_CURVE, DURATION, EASE, SHIFT, STAGGER, WORLDBAR } from '../lib/motion';
import { prefersReducedMotion } from '../lib/effects/util';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('animaxxing', ANIMAXXING_CURVE);

declare global {
  interface Window {
    __motionBootTimer?: number;
  }
}

const html = document.documentElement;
const owner = document.body;
const reduced = prefersReducedMotion();
const PAUSE_KEY = 'motion-paused'; // shared with the homepage's pause control

const $ = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

function settle() {
  window.clearTimeout(window.__motionBootTimer);
  html.dataset.motionBoot = 'settled';
  owner.dataset.phase = 'settled';
}

/* ---------------------------------------------------------------------------------------------
 * Time helpers (Intl only: offline, DST-correct for the date asked)
 * ------------------------------------------------------------------------------------------- */

const offsetFormats = new Map<string, Intl.DateTimeFormat>();
/** Minutes east of UTC for a zone at an instant, from the zone's own rules. */
function offsetMin(tz: string, ms: number): number {
  let f = offsetFormats.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' });
    offsetFormats.set(tz, f);
  }
  const name = f.formatToParts(ms).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = /GMT([+\-−])(\d{1,2})(?::(\d{2}))?/.exec(name);
  if (!m) return 0;
  return (m[1] === '+' ? 1 : -1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

const clockFormats = new Map<string, Intl.DateTimeFormat>();
function clock(tz: string, ms: number): string {
  let f = clockFormats.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
    clockFormats.set(tz, f);
  }
  return f.format(ms);
}

const dayFormats = new Map<string, Intl.DateTimeFormat>();
function dayLabel(tz: string, ms: number): string {
  let f = dayFormats.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' });
    dayFormats.set(tz, f);
  }
  return f.format(ms);
}

/* ---------------------------------------------------------------------------------------------
 * Pause control (WCAG 2.2.2): everything that loops registers here
 * ------------------------------------------------------------------------------------------- */

const loops: gsap.core.Animation[] = [];
let paused = false;
try {
  paused = localStorage.getItem(PAUSE_KEY) === 'true';
} catch {
  /* private mode: unpaused */
}

function applyPause() {
  loops.forEach((t) => (paused ? t.pause() : t.resume()));
  const btn = $<HTMLButtonElement>('[data-wb-pause]');
  if (btn) {
    btn.setAttribute('aria-pressed', String(paused));
    btn.textContent = paused ? 'Resume motion' : 'Pause motion';
  }
}

function setupPause() {
  const btn = $<HTMLButtonElement>('[data-wb-pause]');
  if (!btn || reduced) return;
  btn.hidden = false;
  btn.addEventListener('click', () => {
    paused = !paused;
    try {
      localStorage.setItem(PAUSE_KEY, String(paused));
    } catch {
      /* ignore */
    }
    applyPause();
  });
  applyPause();
}

/* ---------------------------------------------------------------------------------------------
 * Hero: letters, the isometric stack, floating clocks
 * ------------------------------------------------------------------------------------------- */

function setupHero() {
  const hero = $<HTMLElement>('[data-wb-hero]');
  const iso = $<HTMLElement>('[data-wb-iso]');
  const world = $<HTMLElement>('[data-wb-world]');
  const floor = $<HTMLElement>('[data-wb-floor]');
  const slabs = $$<HTMLElement>('[data-wb-slab]');
  if (!hero || !iso || !world || slabs.length === 0) return;

  const BASE = { rx: 58, rz: -34 };
  // Gap between plates as a fraction of the stack's width; hover/tap assembles it, scroll explodes it.
  const gap: { base: number; scroll: number } = { base: WORLDBAR.stack.rest, scroll: 0 };
  const width = () => iso.clientWidth;
  const render = () => {
    const g = (gap.base + gap.scroll) * width();
    slabs.forEach((s, i) => gsap.set(s, { z: i * g }));
    gsap.set(floor, { '--floor': 1 + (gap.base + gap.scroll) * 2.4 });
  };

  gsap.set(world, { rotationX: BASE.rx, rotationZ: BASE.rz, y: 0, transformOrigin: '50% 50%' });
  render();
  window.addEventListener('resize', render);

  if (reduced) return;

  // Intro: the plates fall in from high above, bottom plate first.
  const from = WORLDBAR.stack.introFrom;
  gsap.set(slabs, { autoAlpha: 0 });
  gap.base = from;
  render();
  const intro = gsap.timeline({ delay: WORLDBAR.stack.delay });
  intro.to(slabs, { autoAlpha: 1, duration: 0.5, stagger: WORLDBAR.stack.introStagger }, 0);
  intro.to(
    gap,
    { base: WORLDBAR.stack.rest, duration: WORLDBAR.stack.introDuration, ease: 'animaxxing', onUpdate: render },
    0.1,
  );
  intro.from(world, { rotationZ: BASE.rz - 50, duration: WORLDBAR.stack.introDuration + 0.4, ease: 'animaxxing' }, 0);
  intro.from('[data-wb-chip]', { autoAlpha: 0, scale: 0.6, duration: 0.6, ease: 'back.out(2)', stagger: 0.12 }, 1.2);

  // Idle: the stack bobs, the chips drift. Both register for the pause control.
  const bob = gsap.to(world, {
    y: WORLDBAR.float.amplitude,
    duration: WORLDBAR.float.duration,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    delay: 1.8,
  });
  loops.push(bob);
  $$<HTMLElement>('[data-wb-chip]').forEach((chip) => {
    const d = WORLDBAR.chips.drift;
    const t = gsap.to(chip, {
      x: `random(${-d}, ${d})`,
      y: `random(${-d}, ${d})`,
      duration: `random(${WORLDBAR.chips.duration[0]}, ${WORLDBAR.chips.duration[1]})`,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: 1.6,
    });
    loops.push(t);
  });

  // Pointer parallax (fine pointers only).
  if (window.matchMedia('(pointer: fine)').matches) {
    const rz = gsap.quickTo(world, 'rotationZ', { duration: WORLDBAR.parallax.follow, ease: 'power3.out' });
    const rx = gsap.quickTo(world, 'rotationX', { duration: WORLDBAR.parallax.follow, ease: 'power3.out' });
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      rz(BASE.rz + nx * WORLDBAR.parallax.turn * 2);
      rx(BASE.rx - ny * WORLDBAR.parallax.tilt * 2);
    });
    hero.addEventListener('pointerleave', () => {
      rz(BASE.rz);
      rx(BASE.rx);
    });
  }

  // Hover (mouse) or tap (touch) closes the gaps: the stack becomes the whole popover.
  let assembled = false;
  const assemble = (on: boolean) => {
    assembled = on;
    gsap.to(gap, {
      base: on ? WORLDBAR.stack.assemble : WORLDBAR.stack.rest,
      duration: WORLDBAR.assembleDuration,
      ease: 'animaxxing',
      onUpdate: render,
      overwrite: 'auto',
    });
  };
  const visual = $<HTMLElement>('.wb-hero__visual');
  visual?.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && assemble(true));
  visual?.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && assemble(false));
  visual?.addEventListener('click', (e) => {
    if ((e as PointerEvent).pointerType !== 'mouse') assemble(!assembled);
  });

  // Scrolling away pulls the plates apart and turns the stack.
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom top',
    scrub: 0.6,
    onUpdate: (self) => {
      gap.scroll = self.progress * WORLDBAR.stack.scrollExplode;
      render();
    },
  });
}

function setupHeroCopy() {
  const title = $<HTMLElement>('[data-wb-letters]');
  const rise = $$<HTMLElement>('.site-header [data-intro], [data-wb-rise]');
  if (reduced) return;

  gsap.from(rise, {
    y: SHIFT.page,
    autoAlpha: 0,
    duration: DURATION.page * 2,
    ease: EASE.entrance,
    stagger: STAGGER.loose * 1.5,
    delay: 0.1,
    clearProps: 'transform,opacity,visibility',
  });

  if (!title) return;
  const split = SplitText.create(title, { type: 'chars', charsClass: 'wb-char', aria: 'auto' });
  gsap.from(split.chars, {
    yPercent: WORLDBAR.letters.from,
    rotationX: -90,
    autoAlpha: 0,
    duration: WORLDBAR.letters.duration,
    ease: 'animaxxing',
    stagger: WORLDBAR.letters.stagger,
    delay: 0.2,
    onComplete: () => {
      // A slow wave runs through the name every few seconds (a pausable loop).
      const wave = gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: 1 });
      wave.to(split.chars, { yPercent: -12, duration: 0.28, ease: 'power2.out', stagger: 0.05 });
      wave.to(split.chars, { yPercent: 0, duration: 0.45, ease: 'bounce.out', stagger: 0.05 }, '>-0.18');
      loops.push(wave);
      applyPause();
    },
  });
}

/* ---------------------------------------------------------------------------------------------
 * Live clocks: the floating pills and the little menu bars
 * ------------------------------------------------------------------------------------------- */

function tickClocks() {
  const now = Date.now();
  $$<HTMLElement>('[data-wb-chip]').forEach((chip) => {
    const b = $('b', chip);
    if (b && chip.dataset.tz) b.textContent = clock(chip.dataset.tz, now);
  });
  $$<HTMLElement>('[data-bar-city]').forEach((el) => {
    const name = el.dataset.barName ?? '';
    el.textContent = `${name ? name + ' ' : ''}${clock(el.dataset.barCity ?? 'UTC', now)}`;
  });
}

function setupClocks() {
  tickClocks();
  // Aligned to the minute, like the app itself.
  const schedule = () => {
    const wait = 60000 - (Date.now() % 60000) + 50;
    window.setTimeout(() => {
      tickClocks();
      schedule();
    }, wait);
  };
  schedule();
}

/* ---------------------------------------------------------------------------------------------
 * The live demo: drag through the day, tick cities, see the overlap
 * ------------------------------------------------------------------------------------------- */

type Interval = [number, number]; // minutes from London midnight

function mergeIntervals(list: Interval[]): Interval[] {
  const out: Interval[] = [];
  for (const i of [...list].sort((a, b) => a[0] - b[0])) {
    const last = out[out.length - 1];
    if (last && i[0] <= last[1]) last[1] = Math.max(last[1], i[1]);
    else out.push([i[0], i[1]]);
  }
  return out;
}

function intersect(a: Interval[], b: Interval[]): Interval[] {
  const out: Interval[] = [];
  for (const x of a) for (const y of b) {
    const lo = Math.max(x[0], y[0]);
    const hi = Math.min(x[1], y[1]);
    if (hi > lo) out.push([lo, hi]);
  }
  return mergeIntervals(out);
}

function overlapMinutes(meeting: Interval, set: Interval[]): number {
  return set.reduce((n, i) => n + Math.max(0, Math.min(meeting[1], i[1]) - Math.max(meeting[0], i[0])), 0);
}

function duration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return h === 1 ? '1 hour' : `${h} hours`;
  return `${h} hr ${m} min`;
}

function setupDemo() {
  const root = $<HTMLElement>('[data-wb-demo]');
  const range = $<HTMLInputElement>('[data-demo-range]');
  const when = $<HTMLElement>('[data-demo-when]');
  const nowBtn = $<HTMLButtonElement>('[data-demo-now]');
  const result = $<HTMLElement>('[data-demo-result]');
  const allBar = $<HTMLElement>('[data-bar-all]');
  if (!root || !range || !when || !result || !allBar) return;
  // Narrowed copies, so the helpers below don't see them as possibly null.
  const out = result;
  const allEl = allBar;
  const whenEl = when;
  const rangeEl = range;

  const LONDON = 'Europe/London';
  const WORK: Interval = [9 * 60, 17 * 60];
  const MEETING = 60;
  const rows = $$<HTMLElement>('.wb-row', root).map((el) => ({
    el,
    tz: el.dataset.city ?? 'UTC',
    name: $('.wb-row__name span:last-child', el)?.textContent?.trim() ?? '',
    time: $<HTMLElement>('[data-time]', el)!,
    date: $<HTMLElement>('[data-date]', el)!,
    bar: $<HTMLElement>('[data-bar]', el)!,
    check: $<HTMLInputElement>('[data-demo-check]', el)!,
    work: [] as Interval[],
  }));

  // London's calendar day today, as an instant: the range is minutes from that midnight.
  const now0 = Date.now();
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: LONDON, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(now0)
    .reduce<Record<string, number>>((o, p) => (p.type === 'literal' ? o : { ...o, [p.type]: Number(p.value) }), {});
  const utcMidnight = Date.UTC(parts.year, parts.month - 1, parts.day);
  const baseMs = utcMidnight - offsetMin(LONDON, utcMidnight + 12 * 3600000) * 60000;
  const minutesNow = clamp(Math.round((now0 - baseMs) / 60000 / 15) * 15, 0, 1425);

  // Working-hours intervals for each city on this day, as London-midnight minutes.
  for (const r of rows) {
    const off = offsetMin(r.tz, baseMs + 12 * 3600000);
    const localAtBase = (((baseMs / 60000 + off) % 1440) + 1440) % 1440;
    const list: Interval[] = [];
    for (const k of [-1, 0, 1]) {
      const lo = WORK[0] - localAtBase + k * 1440;
      const hi = WORK[1] - localAtBase + k * 1440;
      if (hi > 0 && lo < 1440) list.push([Math.max(lo, 0), Math.min(hi, 1440)]);
    }
    r.work = mergeIntervals(list);
  }

  const pct = (min: number) => `${(min / 1440) * 100}%`;
  const paint = (bar: HTMLElement, list: Interval[], cls = '') => {
    bar.querySelectorAll('.seg').forEach((n) => n.remove());
    for (const [lo, hi] of list) {
      const s = document.createElement('span');
      s.className = `seg ${cls}`.trim();
      s.style.left = pct(lo);
      s.style.width = pct(hi - lo);
      bar.appendChild(s);
    }
  };
  rows.forEach((r) => paint(r.bar, r.work));

  const participants = () => rows.filter((r) => r.check.checked);

  function analyse() {
    const on = participants();
    rows.forEach((r) => (r.el.dataset.on = String(r.check.checked)));
    if (on.length === 0) {
      paint(allEl, []);
      out.textContent = 'Tick at least one city.';
      return;
    }
    const shared = on.map((r) => r.work).reduce((a, b) => intersect(a, b));
    paint(allEl, shared, 'seg--all');
    const usable = shared.filter((i) => i[1] - i[0] >= MEETING);
    const at = (min: number) => clock(LONDON, baseMs + min * 60000);
    if (usable.length) {
      const best = usable.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));
      out.textContent = `Best overlap: ${at(best[0])} – ${at(best[1])} (${duration(best[1] - best[0])})`;
      return;
    }
    // No shared window: least minutes outside working hours, summed over the ticked cities.
    let pick: { start: number; cost: number; who: string[] } | null = null;
    for (let start = 0; start + MEETING <= 1440 + MEETING; start += 15) {
      const m: Interval = [start, start + MEETING];
      let cost = 0;
      const who: string[] = [];
      for (const r of on) {
        const out = MEETING - overlapMinutes(m, r.work);
        if (out > 0) who.push(r.name);
        cost += out;
      }
      if (cost < MEETING * on.length && (!pick || cost < pick.cost)) pick = { start, cost, who };
    }
    out.textContent = pick
      ? `No shared working hours on this date. Least inconvenient: ${at(pick.start)} – ${at(pick.start + MEETING)}, ${pick.cost} min outside hours (${pick.who.join(', ')}).`
      : 'No shared working hours on this date.';
  }

  let live = true;
  function update(v: number) {
    const ms = baseMs + v * 60000;
    rangeEl.value = String(v);
    rangeEl.style.setProperty('--p', `${(v / 1425) * 100}%`);
    const head = pct(v);
    for (const r of rows) {
      r.time.textContent = clock(r.tz, ms);
      r.date.textContent = dayLabel(r.tz, ms);
      r.bar.style.setProperty('--head', head);
    }
    allEl.style.setProperty('--head', head);
    whenEl.textContent = `${dayLabel(LONDON, ms)} · ${clock(LONDON, ms)} in London`;
    if (nowBtn) nowBtn.hidden = live;
  }

  rangeEl.addEventListener('input', () => {
    live = false;
    sweep?.kill();
    update(Number(rangeEl.value));
  });
  rows.forEach((r) => r.check.addEventListener('change', analyse));
  nowBtn?.addEventListener('click', () => {
    live = true;
    sweep?.kill();
    const target = clamp(Math.round((Date.now() - baseMs) / 60000 / 15) * 15, 0, 1425);
    const state = { v: Number(rangeEl.value) };
    gsap.to(state, { v: target, duration: reduced ? 0 : 0.6, ease: 'animaxxing', onUpdate: () => update(Math.round(state.v)) });
  });
  // Live mode follows the real clock.
  window.setInterval(() => {
    if (live) update(clamp(Math.round((Date.now() - baseMs) / 60000 / 15) * 15, 0, 1425));
  }, 15000);

  analyse();
  update(minutesNow);

  // The first time the demo is seen, play one sweep through the day, then settle on now.
  let sweep: gsap.core.Tween | null = null;
  if (!reduced) {
    ScrollTrigger.create({
      trigger: root,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        if (!live) return;
        const s = { v: WORLDBAR.sweep.from };
        live = false;
        sweep = gsap.to(s, {
          v: WORLDBAR.sweep.to,
          duration: WORLDBAR.sweep.duration,
          ease: 'sine.inOut',
          onUpdate: () => update(Math.round(s.v / 15) * 15),
          onComplete: () => {
            live = true;
            update(minutesNow);
          },
        });
      },
    });
  }
}

/* ---------------------------------------------------------------------------------------------
 * The pinned story: steps on the left, the real screenshots on the right
 * ------------------------------------------------------------------------------------------- */

function setupStory() {
  const story = $<HTMLElement>('[data-wb-story]');
  const frame = $<HTMLElement>('[data-wb-frame]');
  if (!story || !frame) return;
  const mq = window.matchMedia('(min-width: 1024px) and (min-height: 640px)');
  const steps = $$<HTMLElement>('[data-wb-step]', story);
  const shots = $$<HTMLElement>('[data-wb-shot]', story);
  const bar = $<HTMLElement>('[data-wb-story-bar]', story);
  const N = WORLDBAR.storySteps;

  // Where each view sits: how far the capture slides up (share of its height), and the outline.
  const focus: Record<string, { sy: number; ring?: [number, number] }> = {
    all: { sy: 0 },
    // The add-city capture is shorter than the frame: centre it.
    picker: { sy: 7.47 },
    top: { sy: 0, ring: [64, 20.2] },
    bottom: { sy: -28.77, ring: [47.6, 38] },
    nooverlap: { sy: -41.66 },
  };

  let current = -1;
  const show = (i: number) => {
    if (i === current) return;
    current = i;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    shots.forEach((s, k) => s.classList.toggle('is-active', k === i));
    const key = shots[i]?.dataset.focus ?? 'all';
    const f = focus[key] ?? focus.all;
    shots[i]?.style.setProperty('--sy', `${f.sy}%`);
    frame.style.setProperty('--ring-o', f.ring ? '1' : '0');
    if (f.ring) {
      frame.style.setProperty('--ring-top', `${f.ring[0]}%`);
      frame.style.setProperty('--ring-h', `${f.ring[1]}%`);
    }
  };

  ScrollTrigger.create({
    trigger: story,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      if (!mq.matches) return;
      show(clamp(Math.floor(self.progress * N), 0, N - 1));
      if (bar) gsap.set(bar, { scaleX: self.progress });
      // The frame turns slowly as the story moves on.
      frame.style.setProperty('--ry', `${-9 + self.progress * 16}deg`);
      frame.style.setProperty('--rx', `${4 - self.progress * 5}deg`);
    },
  });
  show(0);
}

/* ---------------------------------------------------------------------------------------------
 * Scroll reveals, the light/dark wipe, the counter
 * ------------------------------------------------------------------------------------------- */

function setupReveals() {
  if (reduced) return;
  const R = WORLDBAR.reveal;

  $$<HTMLElement>('[data-wb-split]').forEach((el) => {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'wb-line' });
    gsap.from(split.lines, {
      yPercent: 110,
      duration: R.duration + 0.15,
      ease: 'animaxxing',
      stagger: R.stagger,
      scrollTrigger: { trigger: el, start: R.start, once: true },
    });
  });

  gsap.set('[data-wb-reveal]', { autoAlpha: 0, y: R.y });
  ScrollTrigger.batch('[data-wb-reveal]', {
    start: R.start,
    once: true,
    onEnter: (els) =>
      gsap.to(els, { autoAlpha: 1, y: 0, duration: R.duration, ease: EASE.entrance, stagger: R.stagger, clearProps: 'transform' }),
  });

  gsap.set('[data-wb-card]', { autoAlpha: 0, y: R.y * 1.4, scale: 0.97 });
  ScrollTrigger.batch('[data-wb-card]', {
    start: 'top 90%',
    once: true,
    onEnter: (els) =>
      gsap.to(els, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: R.duration + 0.1,
        ease: 'animaxxing',
        stagger: R.stagger,
        clearProps: 'transform',
      }),
  });

  // Light/dark wipe follows the scroll.
  const wipe = $<HTMLElement>('[data-wb-wipe]');
  if (wipe) {
    gsap.fromTo(
      wipe,
      { '--wipe': '0%' },
      {
        '--wipe': '100%',
        ease: 'none',
        scrollTrigger: { trigger: wipe, start: 'top 85%', end: 'bottom 35%', scrub: 0.6 },
      },
    );
  }

  // The "194" counts up when it arrives.
  const count = $<HTMLElement>('[data-wb-count]');
  if (count) {
    const target = Number(count.dataset.wbCount ?? 0);
    const s = { n: 0 };
    count.textContent = '0';
    gsap.to(s, {
      n: target,
      duration: 1.6,
      ease: 'power3.out',
      onUpdate: () => (count.textContent = String(Math.round(s.n))),
      scrollTrigger: { trigger: count, start: 'top 90%', once: true },
    });
  }

  // The menu bar samples slide in one after another.
  gsap.from('.wb-bar', {
    x: -24,
    autoAlpha: 0,
    duration: 0.6,
    ease: 'animaxxing',
    stagger: 0.12,
    scrollTrigger: { trigger: '.wb-bars', start: 'top 88%', once: true },
  });
  gsap.from('.wb-ticks li', {
    x: -16,
    autoAlpha: 0,
    duration: 0.5,
    ease: EASE.entrance,
    stagger: 0.15,
    scrollTrigger: { trigger: '.wb-ticks', start: 'top 92%', once: true },
  });
}

/* ---------------------------------------------------------------------------------------------
 * Boot
 * ------------------------------------------------------------------------------------------- */

function run() {
  html.dataset.wbReady = '1';
  setupClocks();
  setupDemo();
  setupStory();

  if (html.dataset.motionBoot !== 'pending' || reduced) {
    settle();
    setupHero();
    setupReveals();
    return;
  }

  window.clearTimeout(window.__motionBootTimer);
  html.dataset.motionBoot = 'running';
  owner.dataset.phase = 'intro';
  setupHeroCopy();
  setupHero();
  setupReveals();
  setupPause();
  window.setTimeout(settle, 1800);
}

run();
