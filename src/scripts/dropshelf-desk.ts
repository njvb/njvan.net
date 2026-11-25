// DropShelf's library window, floating shelf and dropped file (src/components/scenes/DropshelfDesk.astro), played
// two ways from one timeline: scrubbed by the homepage scene's moment, or played over time on the /dropshelf/ page.
// The library rises, the floating shelf slides up beside it, a file drops onto the shelf, and the badge says it was
// linked, the app's default. Values: DROPSHELF in src/lib/motion.ts.
import gsap from 'gsap';
import { DROPSHELF as D } from '../lib/motion';
import { onMoment } from '../lib/moments';
import { prefersReducedMotion } from '../lib/effects/util';

const span = ([a, b]: readonly [number, number]) => ({ at: a, duration: b - a });

/** One paused timeline of length 1; position it with progress(), or play it. */
export function buildDeskTimeline(root: HTMLElement): gsap.core.Timeline {
  const library = root.querySelector<HTMLElement>('[data-ds-library]');
  const shelf = root.querySelector<HTMLElement>('[data-ds-shelf]');
  const file = root.querySelector<HTMLElement>('[data-ds-file]');
  const badge = root.querySelector<HTMLElement>('[data-ds-badge]');
  if (!library || !shelf || !file || !badge) throw new Error('dropshelf desk markup is incomplete');
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  const l = span(D.library);
  tl.fromTo(library, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: l.duration, ease: 'power3.out' }, l.at);
  const s = span(D.shelf);
  tl.fromTo(shelf, { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: s.duration, ease: 'back.out(1.6)' }, s.at);
  const d = span(D.drop);
  tl.fromTo(file, { yPercent: -340, rotate: -14, autoAlpha: 0, scale: 1.15 }, { yPercent: 0, rotate: 0, autoAlpha: 1, scale: 1, duration: d.duration, ease: 'bounce.out' }, d.at);
  const b = span(D.badge);
  tl.fromTo(badge, { y: 10, autoAlpha: 0, scale: 0.9 }, { y: 0, autoAlpha: 1, scale: 1, duration: b.duration, ease: 'back.out(2)' }, b.at);
  tl.set({}, {}, 1);
  return tl;
}

/** The homepage scene: the scene's moment (0 to 1) positions the timeline. Settled (progress 1) otherwise. */
export function mountDropshelfScene(root: HTMLElement): void {
  const id = root.closest<HTMLElement>('[data-scene]')?.id;
  if (!id) return;
  const tl = buildDeskTimeline(root);
  onMoment(id, (p) => tl.progress(p));
}

/** The /dropshelf/ page: plays it as it comes into view, holds, and replays. Settled under reduced motion. */
export function playDropshelfDesk(root: HTMLElement): () => void {
  if (prefersReducedMotion()) return () => {};
  const tl = buildDeskTimeline(root);
  tl.progress(0);
  tl.duration(D.page.seconds);
  let visible = false;
  const run = () => {
    tl.restart();
    tl.eventCallback('onComplete', () => {
      if (visible) gsap.delayedCall(D.page.holdAfter, () => visible && tl.restart());
    });
  };
  const io = new IntersectionObserver(
    ([e]) => {
      const was = visible;
      visible = Boolean(e?.isIntersecting);
      if (visible && !was) run();
    },
    { threshold: 0.3 }
  );
  io.observe(root);
  return () => {
    io.disconnect();
    tl.kill();
  };
}
