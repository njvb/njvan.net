// Project scenes: the accent wash, ink change, entrances, and the
// signature moments' clock. Timings live in src/lib/motion.ts (SCENE).
//
// Wide screens (SCENE.pageQuery): the browser's own CSS scroll snapping stops
// on each scene (see global.css); nothing here moves the scroll. When a scene
// becomes active its sequence plays on its own time:
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
import { momentReady, setMoment } from '../lib/moments';

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
  /** A backdrop that belongs to the field (Campaign Tower's city): clipped with the wash. */
  backdrop: HTMLElement | null;
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
    backdrop: scene.querySelector<HTMLElement>('[data-scene-backdrop]'),
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

function splitName(name: HTMLElement): { lines: Element[]; masks: Element[] } {
  // A wordmark (an image, see Scene.astro) is already one line in its own mask.
  const mark = name.querySelector<HTMLElement>('[data-scene-mark]');
  if (mark) return { lines: [mark], masks: [mark.parentElement!] };
  const split = SplitText.create(name, { type: 'lines', mask: 'lines', aria: 'auto' });
  for (const mask of split.masks) (mask as HTMLElement).classList.add('scene-line-mask');
  return split;
}


/* ---------- Wide screens: paged, then play ---------- */

function buildPaged(p: SceneParts) {
  const fg = getComputedStyle(document.documentElement).getPropertyValue('--color-foreground').trim();
  const on = getComputedStyle(p.scene).getPropertyValue('--on').trim();
  const mids = middles(p);
  const id = p.scene.id;

  p.scene.classList.add('is-staged');
  const wash: WashState = { cover: 0, top: 0, rule: 0 };
  const draw = () => {
    renderWash(p.wash, wash);
    if (p.backdrop) renderWash(p.backdrop, wash);
  };
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

  // The signature moment plays every time the scene becomes active, and resets
  // once the scene has left. It waits for its visual if that loads late; if the
  // visitor has moved on by then, it simply doesn't play.
  const moment = { p: 0 };
  setMoment(id, 0);
  let momentTween: gsap.core.Tween | null = null;
  let disposed = false;
  let visit = 0;
  const playMoment = () => {
    const ticket = ++visit;
    momentTween?.kill();
    moment.p = 0;
    setMoment(id, 0);
    const asked = performance.now();
    void momentReady(id, SCENE.momentWait * 1000).then(() => {
      if (disposed || !active || ticket !== visit) return;
      const waited = (performance.now() - asked) / 1000;
      momentTween = gsap.to(moment, {
        p: 1,
        duration: SCENE.momentLength[id] ?? SCENE.moment.duration,
        ease: 'none',
        delay: Math.max(0, SCENE.moment.at - waited),
        onUpdate: () => setMoment(id, moment.p),
      });
    });
  };
  /** Back to the start, out of sight, ready to replay. */
  const resetMoment = () => {
    visit++;
    momentTween?.kill();
    momentTween = null;
    moment.p = 0;
    setMoment(id, 0);
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
  outro.eventCallback('onComplete', () => {
    if (!active) resetMoment();
  });

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
    disposed = true;
    momentTween?.kill();
    intro.kill();
    outro.kill();
    p.scene.classList.remove('is-staged');
    p.wash.style.removeProperty('clip-path');
    p.backdrop?.style.removeProperty('clip-path');
  };
}

/* ---------- Stacked: static field, contents rise once ---------- */

function buildStacked(p: SceneParts) {
  const on = getComputedStyle(p.scene).getPropertyValue('--on').trim();
  const id = p.scene.id;
  const split = splitName(p.name);
  gsap.set(split.lines, { yPercent: 110 });
  const moment = { p: 0 };
  setMoment(id, 0);
  let momentTween: gsap.core.Tween | null = null;
  let visit = 0;
  let inView = false;

  // Every time the scene comes into view: the name rises and the moment plays.
  // Once it has left the viewport entirely, both reset, out of sight.
  const enter = () => {
    if (inView) return;
    inView = true;
    const ticket = ++visit;
    gsap.to(split.lines, { yPercent: 0, duration: 0.5, ease: 'power3.out', stagger: 0.05, overwrite: 'auto' });
    void momentReady(id, SCENE.momentWait * 1000).then(() => {
      if (!inView || ticket !== visit) return;
      momentTween = gsap.to(moment, {
        p: 1,
        duration: SCENE.momentLength[id] ?? SCENE.momentOnce,
        ease: 'none',
        delay: 0.3,
        onUpdate: () => setMoment(id, moment.p),
      });
    });
  };
  const reset = () => {
    inView = false;
    visit++;
    momentTween?.kill();
    momentTween = null;
    moment.p = 0;
    setMoment(id, 0);
    gsap.set(split.lines, { yPercent: 110, overwrite: 'auto' });
  };
  ScrollTrigger.create({
    trigger: p.scene,
    start: SCENE.revealStart,
    end: 'bottom top',
    onEnter: enter,
    onEnterBack: enter,
  });
  // Reset only once the scene is fully out of view, so nothing visibly snaps back.
  ScrollTrigger.create({
    trigger: p.scene,
    start: 'top bottom',
    end: 'bottom top',
    onLeave: reset,
    onLeaveBack: reset,
  });

  const stopReveal = revealOnScroll([...p.rise, ...(p.visual ? [p.visual] : [])], {
    start: SCENE.revealStart,
    y: SHIFT.page,
    stagger: 0.06,
    repeat: true,
  });
  probes.push({
    scene: p.scene,
    covers: (y) => {
      const r = p.scene.getBoundingClientRect();
      return y >= r.top && y < r.bottom;
    },
    ink: () => on,
  });
  return () => {
    momentTween?.kill();
    stopReveal();
  };
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

/** Starts the scene motion. Under reduced motion the scenes stay static fields. */
export function setupScenes(): void {
  if (prefersReducedMotion()) {
    document.querySelectorAll<HTMLElement>('[data-scene]').forEach((scene) => setMoment(scene.id, 1));
    return;
  }
  build();

  // Colours are read from the theme, and block positions from the layout: rebuild when either changes.
  const rebuild = () => build();
  new MutationObserver(rebuild).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  let width = window.innerWidth;
  let timer = 0;
  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - width) < 2) return;
    width = window.innerWidth;
    window.clearTimeout(timer);
    timer = window.setTimeout(rebuild, 200);
  });
}
