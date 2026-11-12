// Scene paging on GSAP's own tools, adapted from the Animaxxing `section-pager`
// recipe for a page that also scrolls:
//   ScrollTrigger  decides where paging applies. Capture (the Observer) is on
//                  only from the first scene's top down to the footer; above it
//                  (hero, index) the page scrolls natively in both directions.
//                  Scrolling down through the last SCENE.pageEnter of a screen
//                  above the first scene, GSAP finishes the move into it.
//   Observer       turns wheel and touch input into one move per gesture.
//                  Trackpad momentum and long swipes are absorbed until the
//                  gesture rests (onStop), so nothing is ever skipped.
//   ScrollToPlugin glides to each stop: each scene's top, then the footer.
// Scrolling up out of the first scene glides to the screen above it and hands
// back to native scrolling once that gesture rests.
//
// Wide screens only (SCENE.pageQuery) and never under reduced motion. Without
// JavaScript the page scrolls normally.
import gsap from 'gsap';
import { Observer } from 'gsap/Observer';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { SCENE } from '../lib/motion';
import { prefersReducedMotion } from '../lib/effects/util';

gsap.registerPlugin(Observer, ScrollTrigger, ScrollToPlugin);

/** Wheels, swipes and keys inside these never page. */
const IGNORE = 'input, textarea, select, [contenteditable], [data-pager-ignore]';
/** Arrow keys belong to these; paging would steal them. */
const COMPOSITE =
  'input, textarea, select, [contenteditable], audio, video, [role=tablist], [role=radiogroup], [role=slider], [role=listbox], ' +
  '[role=menu], [role=menubar], [role=grid], [role=combobox], [role=spinbutton], [role=tree], [role=treegrid], [role=scrollbar]';
/** Space activates or toggles these. */
const ACTIVATES =
  'a[href], button, summary, [role=button], [role=link], [role=checkbox], [role=switch], [role=menuitem], ' +
  '[role=menuitemcheckbox], [role=menuitemradio], [role=option], [role=tab], [role=treeitem]';
const STEP: Record<string, 1 | -1> = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 };

let moving: gsap.core.Tween | null = null;
/** A gesture already moved a stop; the next move waits for it to rest. */
let spent = false;
let observer: Observer | null = null;
let zone: ScrollTrigger | null = null;
let settleTimer = 0;
/** When the Observer last saw wheel or touch input. */
let lastInput = 0;

const enabled = () => window.matchMedia(SCENE.pageQuery).matches && !prefersReducedMotion();
const scenes = () => Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

/** The stops, top to bottom: each scene's top, then the bottom of the page. */
function stops(): number[] {
  const y = window.scrollY;
  const list = [...scenes().map((s) => Math.round(s.getBoundingClientRect().top + y)), Math.round(maxScroll())].sort(
    (a, b) => a - b
  );
  return list.filter((v, i) => i === 0 || v - list[i - 1]! > 2);
}

/** Where one step goes: the next stop down, the previous stop up, or the screen above the first scene. */
function nextStop(dir: 1 | -1): number {
  const s = stops();
  const y = window.scrollY;
  if (dir > 0) return s.find((v) => v > y + 1) ?? y;
  for (let i = s.length - 1; i >= 0; i--) if (s[i]! < y - 1) return s[i]!;
  // Above the first scene: one screen up, after which scrolling is native again.
  return Math.max(0, (s[0] ?? 0) - window.innerHeight);
}

/**
 * Whether a glide is really running. A tween that was killed or interrupted
 * never calls onComplete, so trust its state, not the reference.
 */
function isMoving(): boolean {
  if (moving && !moving.isActive()) moving = null;
  return moving !== null;
}

/**
 * Marks wheel and touch input, before the Observer sees it. Input after a quiet
 * gap of SCENE.pageRest is a new gesture, whatever the Observer's onStop did or
 * didn't report, so a gesture can never stay spent for good.
 */
function markInput() {
  const now = performance.now();
  if (now - lastInput > SCENE.pageRest * 1000) spent = false;
  lastInput = now;
}

/** Glides to a scroll position. Also used by in-page links. */
export function pageTo(y: number, duration: number = SCENE.pageDuration): void {
  window.clearTimeout(settleTimer);
  moving?.kill();
  if (prefersReducedMotion()) {
    window.scrollTo(0, y);
    return;
  }
  const tween = gsap.to(window, {
    scrollTo: { y, autoKill: false },
    duration,
    ease: SCENE.pageEase,
    onInterrupt: () => {
      if (moving === tween) moving = null;
    },
    onComplete: () => {
      if (moving === tween) moving = null;
      // A move with no gesture behind it (scrollbar, find, a link) has no onStop
      // to end it: free the next gesture once input has been quiet for pageRest.
      window.setTimeout(() => {
        if (!isMoving() && performance.now() - lastInput >= SCENE.pageRest * 1000) {
          spent = false;
          release();
        }
      }, SCENE.pageRest * 1000);
      release();
    },
  });
  moving = tween;
}

/** Hands back to native scrolling once outside the zone, with no move or gesture in flight. */
function release() {
  if (!observer || isMoving() || spent) return;
  if (!zone?.isActive) observer.disable();
}

function intent(dir: 1 | -1) {
  if (isMoving() || spent) return;
  const target = nextStop(dir);
  if (Math.abs(target - window.scrollY) < 2) return;
  spent = true;
  pageTo(target);
}

function onKey(e: KeyboardEvent) {
  if (!zone?.isActive || !enabled()) return;
  if (e.defaultPrevented || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
  const target = e.target instanceof Element ? e.target : null;
  if (target?.closest(IGNORE) || target?.closest(COMPOSITE)) return;
  let dir: 1 | -1 | undefined;
  if (e.key === ' ') {
    if (target?.closest(ACTIVATES)) return;
    dir = e.shiftKey ? -1 : 1;
  } else dir = STEP[e.key];
  if (dir === undefined) return;
  e.preventDefault();
  if (isMoving()) return;
  spent = false;
  intent(dir);
  spent = false;
}

/** Scrolled off a stop some other way (scrollbar, find in page, focus)? Settle onto the nearest. */
function onScroll() {
  if (isMoving() || spent || !zone?.isActive || !enabled()) return;
  window.clearTimeout(settleTimer);
  settleTimer = window.setTimeout(() => {
    if (isMoving() || spent || !zone?.isActive) return;
    const s = stops();
    const y = window.scrollY;
    const nearest = s.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a), s[0] ?? y);
    if (Math.abs(nearest - y) > 2) pageTo(nearest, SCENE.pageDuration * 0.6);
  }, SCENE.settleDelay * 1000);
}

export function setupPager(): void {
  const first = scenes()[0];
  if (!first) return;

  observer = Observer.create({
    target: window,
    type: 'wheel,touch',
    // With wheelSpeed -1, scrolling down and swiping up both report "up".
    wheelSpeed: -1,
    tolerance: SCENE.pageTolerance,
    preventDefault: true,
    ignoreCheck: (event) => event.target instanceof Element && !!event.target.closest(IGNORE),
    onChange: () => {
      lastInput = performance.now();
    },
    onUp: () => intent(1),
    onDown: () => intent(-1),
    // Each touch starts a new gesture.
    onPress: () => {
      if (!isMoving()) spent = false;
    },
    onStop: () => {
      spent = false;
      release();
    },
    onStopDelay: SCENE.pageRest,
  });
  observer.disable();

  // Capture: on a scene or below. Jumping in some other way (scrollbar, find)
  // settles on the nearest stop via onScroll.
  zone = ScrollTrigger.create({
    trigger: first,
    start: 'top 2px',
    end: 'max',
    onToggle: (self) => {
      if (!enabled()) return;
      if (self.isActive) observer?.enable();
      else release();
    },
  });

  // Entry: scrolling down through the last stretch above the first scene, GSAP
  // finishes the move into it and absorbs the rest of that gesture. Scrolling up
  // here is left alone, so the way back to the top stays free.
  ScrollTrigger.create({
    trigger: first,
    start: () => `top ${100 - SCENE.pageEnter * 100}%`,
    end: 'top 2px',
    onUpdate: (self) => {
      // Only while actually inside this stretch: a jump straight past it (scrollbar,
      // a link, a #hash) also reports progress, and must not be pulled back.
      if (!enabled() || isMoving() || self.direction <= 0 || !self.isActive) return;
      observer?.enable();
      spent = true;
      pageTo(Math.round(first.getBoundingClientRect().top + window.scrollY));
    },
  });
  // Loaded inside the zone (a reload, a #hash): page from here.
  if (zone.isActive && enabled()) observer.enable();

  // Capture phase, so the mark lands before the Observer handles the same event.
  window.addEventListener('wheel', markInput, { capture: true, passive: true });
  window.addEventListener('touchstart', markInput, { capture: true, passive: true });
  window.addEventListener('touchmove', markInput, { capture: true, passive: true });
  window.addEventListener('keydown', onKey);
  if (import.meta.env.DEV) {
    // Dev only: inspect the pager's state from the console.
    (window as unknown as { __pager: () => object }).__pager = () => ({
      moving: isMoving(),
      spent,
      capturing: observer?.isEnabled ?? false,
      zone: zone?.isActive ?? false,
      y: Math.round(window.scrollY),
      sinceInput: Math.round(performance.now() - lastInput),
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.matchMedia(SCENE.pageQuery).addEventListener('change', () => {
    if (!enabled()) observer?.disable();
    else if (zone?.isActive) observer?.enable();
  });
}
