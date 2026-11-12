// Scene paging, adapted from the Animaxxing `section-pager` recipe for a page
// that also scrolls: the hero and index scroll freely; from one screen above the
// first scene down to the footer, each wheel flick, swipe or key moves exactly
// one stop (index, each scene, footer). Trackpad momentum and long swipes are
// absorbed until the gesture rests, so nothing is ever skipped. Scrolling up
// from the index stop hands back to native scrolling.
//
// Wide screens only (SCENE.pageQuery), and never under reduced motion: there
// the page scrolls normally. Without JavaScript the page scrolls normally too.
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { SCENE } from '../lib/motion';
import { prefersReducedMotion } from '../lib/effects/util';

gsap.registerPlugin(ScrollToPlugin);

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
let restTimer = 0;
let settleTimer = 0;

const query = window.matchMedia(SCENE.pageQuery);
const enabled = () => query.matches && !prefersReducedMotion();

/** The stops, in document order: the screen above the first scene, each scene's top, the bottom of the page. */
function stops(): number[] {
  const scenes = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
  if (scenes.length === 0) return [];
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const tops = scenes.map((s) => Math.round(s.getBoundingClientRect().top + y));
  const list = [Math.max(0, tops[0]! - window.innerHeight), ...tops, Math.max(0, Math.round(max))].sort((a, b) => a - b);
  return list.filter((v, i) => i === 0 || v - list[i - 1]! > 2);
}

const inRegion = (s = stops()) => s.length > 0 && window.scrollY >= s[0]! - 1;

/** The next stop in a direction, or null to let the browser scroll. */
function nextStop(dir: 1 | -1, s = stops()): number | null {
  if (!inRegion(s)) return null;
  const y = window.scrollY;
  if (dir > 0) return s.find((v) => v > y + 1) ?? null;
  for (let i = s.length - 1; i >= 0; i--) if (s[i]! < y - 1) return s[i]!;
  return null;
}

/** Moves to a scroll position on the pager's ease. Used by in-page links too. */
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
    onComplete: () => {
      if (moving === tween) moving = null;
    },
  });
  moving = tween;
}

/** Holds `spent` until no input arrives for SCENE.pageRest. */
function rest() {
  window.clearTimeout(restTimer);
  restTimer = window.setTimeout(() => {
    spent = false;
  }, SCENE.pageRest * 1000);
}

/** Pages one stop if allowed. Returns whether the event belongs to the pager (and so must not scroll natively). */
function intent(dir: 1 | -1, start: boolean): boolean {
  if (!enabled()) return false;
  const s = stops();
  if (moving || spent) return inRegion(s);
  const target = nextStop(dir, s);
  if (target === null) return false;
  if (start) {
    spent = true;
    pageTo(target);
  }
  return true;
}

function onWheel(e: WheelEvent) {
  if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
  if (e.target instanceof Element && e.target.closest(IGNORE)) return;
  const dir = e.deltaY > 0 ? 1 : -1;
  if (intent(dir, Math.abs(e.deltaY) >= SCENE.pageTolerance)) {
    e.preventDefault();
    rest();
  }
}

let touchY: number | null = null;
function onTouchStart(e: TouchEvent) {
  touchY = e.touches.length === 1 ? e.touches[0]!.clientY : null;
  if (!moving) spent = false;
}
function onTouchMove(e: TouchEvent) {
  if (touchY === null || e.touches.length !== 1) return;
  if (e.target instanceof Element && e.target.closest(IGNORE)) return;
  const dy = touchY - e.touches[0]!.clientY;
  if (Math.abs(dy) < 2) return;
  if (intent(dy > 0 ? 1 : -1, Math.abs(dy) >= SCENE.swipeDistance)) e.preventDefault();
}
function onTouchEnd() {
  touchY = null;
  rest();
}

function onKey(e: KeyboardEvent) {
  if (e.defaultPrevented || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
  const target = e.target instanceof Element ? e.target : null;
  if (target?.closest(IGNORE) || target?.closest(COMPOSITE)) return;
  let dir: 1 | -1 | undefined;
  if (e.key === ' ') {
    if (target?.closest(ACTIVATES)) return;
    dir = e.shiftKey ? -1 : 1;
  } else dir = STEP[e.key];
  if (dir === undefined) return;
  if (moving) {
    if (inRegion()) e.preventDefault();
    return;
  }
  spent = false;
  if (intent(dir, true)) e.preventDefault();
}

/** Scrolled off a stop some other way (scrollbar, find in page, focus)? Settle onto the nearest. */
function onScroll() {
  if (moving || !enabled()) return;
  window.clearTimeout(settleTimer);
  settleTimer = window.setTimeout(() => {
    if (moving || touchY !== null) return;
    const s = stops();
    if (!inRegion(s)) return;
    const y = window.scrollY;
    const nearest = s.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a));
    if (Math.abs(nearest - y) > 2) pageTo(nearest, SCENE.pageDuration * 0.6);
  }, SCENE.settleDelay * 1000);
}

export function setupPager(): void {
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true });
  window.addEventListener('keydown', onKey);
  window.addEventListener('scroll', onScroll, { passive: true });
}
