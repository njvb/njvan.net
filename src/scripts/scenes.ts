// Project scenes: the shared accent wash, pinning, ink change and entrances.
// Each scene's signature moment plugs into the pinned timeline after
// SCENE.settledAt (added scene by scene). Timings live in src/lib/motion.ts.
//
// Pinned (SCENE.pinQuery): the scene pins for SCENE.pinLength screens. The
// accent grows from a rule at the top to fill it, each block's ink changes as
// the wash passes, the name rises behind its mask, the rest rises in. As the
// next section arrives the wash retracts down into it and the name slides up.
// Not pinned (stacked layouts): the scene stays a static accent field and its
// contents rise in once. Reduced motion: static fields, nothing moves.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { ANIMAXXING_CURVE, EASE, SCENE, SCRUB, SHIFT } from '../lib/motion';
import { prefersReducedMotion } from '../lib/effects/util';
import { revealOnScroll } from '../lib/effects/reveal';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('animaxxing', ANIMAXXING_CURVE);
const washEase = gsap.parseEase('animaxxing');

/**
 * The wash's visible span, in percent of the scene, from `top` down to `cover`,
 * plus `rule` (0 to 1): the starting rule along the top. A scene's rule appears
 * only once the previous scene's wash has retracted into it, so two accents
 * never share the screen.
 */
type WashState = { cover: number; top: number; rule: number };

/** Where each scene's wash is, for the progress rule. */
export type FieldProbe = { scene: HTMLElement; covers: (y: number) => boolean; ink: () => string };
const probes: FieldProbe[] = [];
export const fieldProbes = (): readonly FieldProbe[] => probes;

/** Pinned triggers by scene id, so index links can land on a settled scene. */
const pins = new Map<string, ScrollTrigger>();

/** x in [0, 1] where ease(x) = y, by bisection (eases here are monotonic). */
function solveEase(ease: (t: number) => number, y: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (ease(mid) < y) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function renderWash(el: HTMLElement, w: WashState) {
  el.style.clipPath = `inset(${w.top}% 0 max(0px, calc(${100 - w.cover}% - ${w.rule * SCENE.rulePx}px)) 0)`;
}

type SceneParts = {
  scene: HTMLElement;
  wash: HTMLElement;
  name: HTMLElement;
  ink: HTMLElement[];
  rise: HTMLElement[];
  visual: HTMLElement | null;
};

function parts(scene: HTMLElement): SceneParts | null {
  const wash = scene.querySelector<HTMLElement>('[data-scene-wash]');
  const name = scene.querySelector<HTMLElement>('[data-scene-name]');
  if (!wash || !name) return null;
  return {
    scene,
    wash,
    name,
    ink: Array.from(scene.querySelectorAll<HTMLElement>('[data-ink]')),
    rise: Array.from(scene.querySelectorAll<HTMLElement>('[data-scene-rise]')),
    visual: scene.querySelector<HTMLElement>('[data-scene-visual]'),
  };
}

/** Each block's middle, as a fraction of the scene's height. Measured at rest. */
function middles(p: SceneParts): Map<HTMLElement, number> {
  const box = p.scene.getBoundingClientRect();
  return new Map(
    p.ink.map((el) => {
      const r = el.getBoundingClientRect();
      return [el, Math.min(1, Math.max(0, (r.top - box.top + r.height / 2) / box.height))];
    })
  );
}

function splitName(name: HTMLElement): SplitText {
  const split = SplitText.create(name, { type: 'lines', mask: 'lines', aria: 'auto' });
  for (const mask of split.masks) (mask as HTMLElement).classList.add('scene-line-mask');
  return split;
}

/* ---------- Pinned ---------- */

type Handoff = { state: WashState; draw: () => void } | null;

function buildPinned(p: SceneParts, next: HTMLElement, wash: WashState, handoff: Handoff) {
  const root = getComputedStyle(document.documentElement);
  const fg = root.getPropertyValue('--color-foreground').trim();
  const on = getComputedStyle(p.scene).getPropertyValue('--on').trim();
  const mids = middles(p);

  p.scene.classList.add('is-staged');
  const draw = () => renderWash(p.wash, wash);
  draw();
  gsap.set(p.ink, { '--on': fg });
  const split = splitName(p.name);
  gsap.set(split.lines, { yPercent: 110 });
  gsap.set(p.rise, { opacity: 0, y: SHIFT.page });
  if (p.visual) gsap.set(p.visual, { opacity: 0, y: SHIFT.page });

  // In: pinned and scrubbed.
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: p.scene,
      start: 'top top',
      end: () => `+=${window.innerHeight * SCENE.pinLength}`,
      pin: true,
      scrub: SCRUB,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
  const { at: w0, duration: wd } = SCENE.washIn;
  tl.to(wash, { cover: 100, rule: 1, duration: wd, ease: 'animaxxing', onUpdate: draw }, w0);
  for (const el of p.ink) {
    const t = w0 + solveEase(washEase, mids.get(el) ?? 0) * wd;
    tl.to(el, { '--on': on, duration: SCENE.inkSwitch }, Math.max(0, t - SCENE.inkSwitch / 2));
  }
  tl.to(
    split.lines,
    { yPercent: 0, duration: SCENE.nameIn.duration, ease: EASE.entrance, stagger: SCENE.nameIn.stagger },
    SCENE.nameIn.at
  );
  tl.to(
    p.rise,
    { opacity: 1, y: 0, duration: SCENE.riseIn.duration, ease: EASE.entrance, stagger: SCENE.riseIn.stagger },
    SCENE.riseIn.at
  );
  if (p.visual) {
    tl.to(p.visual, { opacity: 1, y: 0, duration: SCENE.visualIn.duration, ease: EASE.entrance }, SCENE.visualIn.at);
  }
  // Hold the settled scene for the rest of the pin (signature moments go here).
  tl.set({}, {}, 1);
  if (tl.scrollTrigger) pins.set(p.scene.id, tl.scrollTrigger);

  // Out: as the next section arrives, the wash retracts down into it.
  const out = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: SCRUB, invalidateOnRefresh: true },
  });
  out.fromTo(wash, { top: 0 }, { top: 100, duration: 1, ease: 'animaxxing', onUpdate: draw, immediateRender: false }, 0);
  for (const el of p.ink) {
    const t = solveEase(washEase, mids.get(el) ?? 0);
    out.fromTo(
      el,
      { '--on': on },
      { '--on': fg, duration: SCENE.inkSwitch, immediateRender: false },
      Math.max(0, t - SCENE.inkSwitch / 2)
    );
  }
  // The last of the wash becomes the next scene's starting rule.
  if (handoff) {
    out.fromTo(
      handoff.state,
      { rule: 0 },
      { rule: 1, duration: 0.06, onUpdate: handoff.draw, immediateRender: false },
      0.94
    );
  }
  out.fromTo(
    split.lines,
    { yPercent: 0 },
    { yPercent: -110, duration: 0.35, ease: EASE.exit, stagger: SCENE.nameIn.stagger, immediateRender: false },
    0
  );

  probes.push({
    scene: p.scene,
    covers: (y) => {
      const r = p.scene.getBoundingClientRect();
      const top = r.top + (wash.top / 100) * r.height;
      const bottom = r.bottom - Math.max(0, ((100 - wash.cover) / 100) * r.height - SCENE.rulePx);
      return wash.top < 100 && y >= top && y < bottom;
    },
    ink: () => on,
  });

  return () => {
    p.scene.classList.remove('is-staged');
    p.wash.style.removeProperty('clip-path');
  };
}

/** Wash state and renderer for each pinned scene, built before any timeline. */
function washes(list: SceneParts[]): Array<{ state: WashState; draw: () => void }> {
  return list.map((p, i) => {
    const state: WashState = { cover: 0, top: 0, rule: i === 0 ? 1 : 0 };
    return { state, draw: () => renderWash(p.wash, state) };
  });
}

/* ---------- Stacked: static field, contents rise once ---------- */

function buildStacked(p: SceneParts) {
  const on = getComputedStyle(p.scene).getPropertyValue('--on').trim();
  const split = splitName(p.name);
  gsap.set(split.lines, { yPercent: 110 });
  ScrollTrigger.create({
    trigger: p.scene,
    start: SCENE.revealStart,
    once: true,
    onEnter: () =>
      void gsap.to(split.lines, {
        yPercent: 0,
        duration: 0.5,
        ease: 'power3.out',
        stagger: 0.05,
        onComplete: () => split.revert(),
      }),
  });
  const stopReveal = revealOnScroll([...p.rise, ...(p.visual ? [p.visual] : [])], {
    start: SCENE.revealStart,
    y: SHIFT.page,
    stagger: 0.06,
  });
  probes.push({
    scene: p.scene,
    covers: (y) => {
      const r = p.scene.getBoundingClientRect();
      return y >= r.top && y < r.bottom;
    },
    ink: () => on,
  });
  return stopReveal;
}

/* ---------- Setup and rebuilds ---------- */

let mm: gsap.MatchMedia | null = null;

function build() {
  mm?.revert();
  probes.length = 0;
  pins.clear();
  mm = gsap.matchMedia();
  const scenes = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
  const footer = document.querySelector<HTMLElement>('footer');

  mm.add({ pin: SCENE.pinQuery, stack: `not all and ${SCENE.pinQuery}` }, (ctx) => {
    const cleanups: Array<() => void> = [];
    const list = scenes.map(parts).filter((p): p is SceneParts => p !== null);
    if (ctx.conditions?.pin) {
      const w = washes(list);
      list.forEach((p, i) => {
        const next = list[i + 1]?.scene ?? footer ?? p.scene;
        cleanups.push(buildPinned(p, next, w[i]!.state, w[i + 1] ?? null));
      });
    } else {
      list.forEach((p) => cleanups.push(buildStacked(p)));
    }
    return () => cleanups.forEach((fn) => fn());
  });
  ScrollTrigger.refresh();
}

/** Index and nav links to a pinned scene land where its wash has settled. */
function onAnchorClick(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  const id = link?.getAttribute('href')?.slice(1);
  const st = id ? pins.get(id) : undefined;
  if (!link || !id || !st) return;
  e.preventDefault();
  history.pushState(null, '', `#${id}`);
  window.scrollTo({ top: st.start + (st.end - st.start) * SCENE.settledAt, behavior: 'smooth' });
}

/** Starts the scene motion. Under reduced motion the scenes stay static fields. */
export function setupScenes(): void {
  if (prefersReducedMotion()) return;
  build();

  // Colours are read from the theme, and block positions from the layout: rebuild when either changes.
  const rebuild = () => build();
  new MutationObserver(rebuild).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', rebuild);
  let width = window.innerWidth;
  let timer = 0;
  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - width) < 2) return;
    width = window.innerWidth;
    window.clearTimeout(timer);
    timer = window.setTimeout(rebuild, 200);
  });
  document.addEventListener('click', onAnchorClick);
}
