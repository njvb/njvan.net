// Project scenes: the accent wash, ink change, entrances, and the
// signature moments' clock. Timings live in src/lib/motion.ts (SCENE).
//
// Wide screens (SCENE.pageQuery): src/scripts/pager.ts moves one scene per
// gesture, each filling the viewport. When a scene becomes active its sequence
// plays on its own time:
// a rule draws along the top, the accent grows from it to fill the scene,
// each block's ink changes as the wash passes, the name rises behind its mask,
// the rest rises in, then the signature moment plays (once per visit). When
// it stops being active the wash retracts down and the name slides up.
// Stacked layouts: static accent fields; contents rise and the moment plays
// once on entering view. Reduced motion: static fields, moments settled.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { ANIMAXXING_CURVE, EASE, SCENE, SHIFT } from '../lib/motion';
import { prefersReducedMotion } from '../lib/effects/util';
import { revealOnScroll } from '../lib/effects/reveal';
import { setMoment } from '../lib/moments';
import { pageTo, setupPager } from './pager';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('animaxxing', ANIMAXXING_CURVE);
const washInEase = gsap.parseEase('animaxxing');
const washOutEase = gsap.parseEase(EASE.shift);

/** The wash's visible span, in percent of the scene, from `top` down to `cover`, plus the starting rule (0 to 1). */
type WashState = { cover: number; top: number; rule: number };

/** Where each scene's field is, for the progress rule. */
export type FieldProbe = { scene: HTMLElement; covers: (y: number) => boolean; ink: () => string };
const probes: FieldProbe[] = [];
export const fieldProbes = (): readonly FieldProbe[] => probes;

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

/** Scenes whose moment has already played this visit. Survives rebuilds. */
const momentDone = new Set<string>();

/* ---------- Wide screens: paged, then play ---------- */

function buildPaged(p: SceneParts) {
  const fg = getComputedStyle(document.documentElement).getPropertyValue('--color-foreground').trim();
  const on = getComputedStyle(p.scene).getPropertyValue('--on').trim();
  const mids = middles(p);
  const id = p.scene.id;

  p.scene.classList.add('is-staged');
  const wash: WashState = { cover: 0, top: 0, rule: 0 };
  const draw = () => renderWash(p.wash, wash);
  draw();
  gsap.set(p.ink, { '--on': fg });
  const split = splitName(p.name);
  gsap.set(split.lines, { yPercent: 110 });
  gsap.set(p.rise, { opacity: 0, y: SHIFT.page });
  if (p.visual) gsap.set(p.visual, { opacity: 0, y: SHIFT.page });

  // In: played from the start each time the scene becomes active.
  const intro = gsap.timeline({ paused: true });
  intro.set(wash, { top: 0, cover: 0, rule: 0, onComplete: draw }, 0);
  intro.to(wash, { rule: 1, duration: SCENE.ruleIn, ease: EASE.entrance, onUpdate: draw }, 0);
  const { at: w0, duration: wd } = SCENE.washIn;
  intro.to(wash, { cover: 100, duration: wd, ease: 'animaxxing', onUpdate: draw }, w0);
  for (const el of p.ink) {
    const t = w0 + solveEase(washInEase, mids.get(el) ?? 0) * wd;
    intro.fromTo(el, { '--on': fg }, { '--on': on, duration: SCENE.inkSwitch, ease: 'none', immediateRender: false }, Math.max(0, t - SCENE.inkSwitch / 2));
  }
  intro.fromTo(
    split.lines,
    { yPercent: 110 },
    { yPercent: 0, duration: SCENE.nameIn.duration, ease: 'power3.out', stagger: SCENE.nameIn.stagger, immediateRender: false },
    SCENE.nameIn.at
  );
  intro.fromTo(
    p.rise,
    { opacity: 0, y: SHIFT.page },
    { opacity: 1, y: 0, duration: SCENE.riseIn.duration, ease: EASE.entrance, stagger: SCENE.riseIn.stagger, immediateRender: false },
    SCENE.riseIn.at
  );
  if (p.visual) {
    intro.fromTo(
      p.visual,
      { opacity: 0, y: SHIFT.page },
      { opacity: 1, y: 0, duration: SCENE.visualIn.duration, ease: EASE.entrance, immediateRender: false },
      SCENE.visualIn.at
    );
  }

  // The signature moment, once per visit: it stays settled when the scene comes back.
  const moment = { p: momentDone.has(id) ? 1 : 0 };
  setMoment(id, moment.p);
  let momentTween: gsap.core.Tween | null = null;
  const playMoment = () => {
    if (momentDone.has(id)) return;
    momentDone.add(id);
    momentTween = gsap.to(moment, {
      p: 1,
      duration: SCENE.moment.duration,
      ease: 'none',
      delay: SCENE.moment.at,
      onUpdate: () => setMoment(id, moment.p),
    });
  };

  // Out: the wash retracts down, ink reverts as it passes, the name slides up.
  const outro = gsap.timeline({ paused: true });
  outro.fromTo(wash, { top: 0 }, { top: 100, duration: SCENE.washOut, ease: EASE.shift, onUpdate: draw, immediateRender: false }, 0);
  for (const el of p.ink) {
    const t = solveEase(washOutEase, mids.get(el) ?? 0) * SCENE.washOut;
    outro.fromTo(el, { '--on': on }, { '--on': fg, duration: SCENE.inkSwitch, ease: 'none', immediateRender: false }, Math.max(0, t - SCENE.inkSwitch / 2));
  }
  outro.fromTo(
    split.lines,
    { yPercent: 0 },
    { yPercent: -110, duration: SCENE.nameOut, ease: EASE.exit, stagger: SCENE.nameIn.stagger / 2, immediateRender: false },
    0
  );

  let active = false;
  const activate = () => {
    if (active) return;
    active = true;
    outro.pause();
    intro.restart();
    playMoment();
  };
  const deactivate = () => {
    if (!active) return;
    active = false;
    intro.pause();
    outro.restart();
  };
  ScrollTrigger.create({
    trigger: p.scene,
    start: SCENE.activeStart,
    end: SCENE.activeEnd,
    onToggle: (self) => (self.isActive ? activate() : deactivate()),
  });

  probes.push({
    scene: p.scene,
    covers: (y) => {
      const r = p.scene.getBoundingClientRect();
      const top = r.top + (wash.top / 100) * r.height;
      const bottom = r.bottom - Math.max(0, ((100 - wash.cover) / 100) * r.height - wash.rule * SCENE.rulePx);
      return wash.top < 100 && bottom > top && y >= top && y < bottom;
    },
    ink: () => on,
  });

  return () => {
    momentTween?.kill();
    intro.kill();
    outro.kill();
    p.scene.classList.remove('is-staged');
    p.wash.style.removeProperty('clip-path');
  };
}

/* ---------- Stacked: static field, contents rise once ---------- */

function buildStacked(p: SceneParts) {
  const on = getComputedStyle(p.scene).getPropertyValue('--on').trim();
  const id = p.scene.id;
  const split = splitName(p.name);
  gsap.set(split.lines, { yPercent: 110 });
  const moment = { p: momentDone.has(id) ? 1 : 0 };
  setMoment(id, moment.p);
  ScrollTrigger.create({
    trigger: p.scene,
    start: SCENE.revealStart,
    once: true,
    onEnter: () => {
      gsap.to(split.lines, {
        yPercent: 0,
        duration: 0.5,
        ease: 'power3.out',
        stagger: 0.05,
        onComplete: () => split.revert(),
      });
      if (momentDone.has(id)) return;
      momentDone.add(id);
      gsap.to(moment, {
        p: 1,
        duration: SCENE.momentOnce,
        ease: 'none',
        delay: 0.3,
        onUpdate: () => setMoment(id, moment.p),
      });
    },
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
  mm = gsap.matchMedia();
  const scenes = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));

  mm.add({ paged: SCENE.pageQuery, stack: `not all and ${SCENE.pageQuery}` }, (ctx) => {
    const list = scenes.map(parts).filter((p): p is SceneParts => p !== null);
    const cleanups = list.map((p) => (ctx.conditions?.paged ? buildPaged(p) : buildStacked(p)));
    return () => cleanups.forEach((fn) => fn());
  });
  ScrollTrigger.refresh();
}

/** In-page links glide on the pager's ease (CSS smooth scrolling would fight the paging). */
function onAnchorClick(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  const id = link?.getAttribute('href')?.slice(1);
  const target = id ? document.getElementById(id) : null;
  if (!link || !target) return;
  e.preventDefault();
  history.pushState(null, '', `#${id}`);
  pageTo(target.getBoundingClientRect().top + window.scrollY);
  // Move focus as a native jump would, without a second scroll.
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

/** Starts the scene motion. Under reduced motion the scenes stay static fields. */
export function setupScenes(): void {
  if (prefersReducedMotion()) {
    document.querySelectorAll<HTMLElement>('[data-scene]').forEach((scene) => setMoment(scene.id, 1));
    return;
  }
  build();
  setupPager();
  document.addEventListener('click', onAnchorClick);

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
}
