// DropShelf's library window, floating shelf and dropped file (src/components/scenes/DropshelfDesk.astro), played
// positioned by the homepage scene's moment (the /dropshelf/ page is the app's own design, ported as it is).
// The library rises, the floating shelf slides up beside it, a file drops onto the shelf, and the badge says it was
// linked, the app's default. Values: DROPSHELF in src/lib/motion.ts.
import gsap from 'gsap';
import { DROPSHELF as D } from '../lib/motion';
import { onMoment } from '../lib/moments';

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
