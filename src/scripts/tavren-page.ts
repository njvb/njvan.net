// The /tavren page's motion: claims the boot from the head script, rises the
// header and hero copy in, then plays the 3D board's moment once (flat map,
// tilt, rise, dress, the village lights) as soon as the board has loaded.
// Reduced motion shows everything settled. Timings live in src/lib/motion.ts.
import gsap from 'gsap';
import { DURATION, EASE, SCENE, SHIFT, STAGGER } from '../lib/motion';
import { prefersReducedMotion } from '../lib/effects/util';
import { momentReady, setMoment } from '../lib/moments';

declare global {
  interface Window {
    __motionBootTimer?: number;
  }
}

const MOMENT = 'tavren-page';
/** The moment plays a little slower here than in a homepage scene: it is the page's opening. */
const MOMENT_SECONDS = SCENE.momentOnce * 1.4;

const html = document.documentElement;
const owner = document.body;

function settle() {
  window.clearTimeout(window.__motionBootTimer);
  html.dataset.motionBoot = 'settled';
  owner.dataset.phase = 'settled';
}

async function run() {
  // Too late (the recovery deadline passed): the page is already showing settled.
  if (html.dataset.motionBoot !== 'pending') {
    setMoment(MOMENT, 1);
    return;
  }

  if (prefersReducedMotion()) {
    settle();
    setMoment(MOMENT, 1);
    return;
  }

  window.clearTimeout(window.__motionBootTimer);
  html.dataset.motionBoot = 'running';

  // The header and hero copy rise in. gsap.from sets their start state in this
  // same task, so they never paint visible before the rise.
  const rise = document.querySelectorAll<HTMLElement>('.site-header [data-intro], [data-page-rise]');
  gsap.from(rise, {
    y: SHIFT.page,
    autoAlpha: 0,
    duration: DURATION.page * 2,
    ease: EASE.entrance,
    stagger: STAGGER.loose * 1.5,
    clearProps: 'transform,opacity,visibility',
  });
  owner.dataset.phase = 'intro';

  // The board loads Three.js and the tiles; wait for it (up to the usual limit),
  // so the tiles play their entrance rather than arriving settled. One task
  // first, so the board's own script has registered its hold whatever the order.
  await new Promise((resolve) => setTimeout(resolve));
  await momentReady(MOMENT, SCENE.momentWait * 1000);
  const state = { p: 0 };
  gsap.to(state, {
    p: 1,
    duration: MOMENT_SECONDS,
    ease: 'none',
    onUpdate: () => setMoment(MOMENT, state.p),
    onComplete: settle,
  });
}

run();
