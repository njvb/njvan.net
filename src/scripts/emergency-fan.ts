// Emergency Tower's phone and triage tags (src/components/scenes/EmergencyPhone.astro), played two ways from one
// timeline: scrubbed by the homepage scene's moment, or played over time on the /emergency-tower/ page.
// Pixel-stepped like Campaign Tower's: the phone rises, the tags drop in one after another, then each patience bar
// drains until the critical tag is next. Values: EMERGENCY in src/lib/motion.ts.
import gsap from 'gsap';
import { EMERGENCY as E } from '../lib/motion';
import { onMoment } from '../lib/moments';
import { prefersReducedMotion } from '../lib/effects/util';

const span = ([a, b]: readonly [number, number]) => ({ at: a, duration: b - a });
const LEVELS = ['critical', 'urgent', 'minor'] as const;

/** One paused timeline of length 1; position it with progress(), or play it. */
export function buildFanTimeline(root: HTMLElement): gsap.core.Timeline {
  const phone = root.querySelector<HTMLElement>('[data-em-phone]');
  const tags = LEVELS.map((l) => root.querySelector<HTMLElement>(`[data-em-tag][data-level="${l}"]`));
  const next = root.querySelector<HTMLElement>('[data-em-next]');
  if (!phone || tags.some((t) => !t)) throw new Error('emergency fan markup is incomplete');
  const stepped = `steps(${E.steps})`;
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });

  const ph = span(E.phone);
  tl.fromTo(phone, { yPercent: 8, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: ph.duration, ease: stepped }, ph.at);

  const tg = span(E.tags);
  const gap = tg.duration / 3;
  tags.forEach((tag, i) => {
    tl.fromTo(tag!, { y: -28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: gap * 1.4, ease: stepped }, tg.at + i * gap * 0.9);
  });

  const dr = span(E.drain);
  LEVELS.forEach((level, i) => {
    const bar = tags[i]!.querySelector<HTMLElement>('[data-em-bar]');
    if (!bar) return;
    tl.fromTo(
      tags[i]!,
      { '--p': 1 },
      { '--p': E.patience[level], duration: dr.duration, ease: 'none', immediateRender: false },
      dr.at + i * 0.04
    );
  });

  if (next) {
    const f = span(E.first);
    tl.fromTo(next, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: f.duration, ease: stepped }, f.at);
    tl.fromTo(tags[0]!, { scale: 1 }, { scale: 1.06, duration: f.duration * 0.5, yoyo: true, repeat: 1, ease: stepped, immediateRender: false }, f.at);
  }
  tl.set({}, {}, 1);
  return tl;
}

/** The homepage scene: the scene's moment (0 to 1) positions the timeline. Settled (progress 1) otherwise. */
export function mountEmergencyScene(root: HTMLElement): void {
  const id = root.closest<HTMLElement>('[data-scene]')?.id;
  if (!id) return;
  const tl = buildFanTimeline(root);
  onMoment(id, (p) => tl.progress(p));
}

/** The /emergency-tower/ page: plays it once over time, holds, and again each time it comes back into view. Settled under reduced motion. */
export function playEmergencyFan(root: HTMLElement): () => void {
  if (prefersReducedMotion()) return () => {};
  const tl = buildFanTimeline(root);
  tl.progress(0);
  tl.duration(E.page.seconds);
  let visible = false;
  const run = () => {
    tl.restart();
    tl.eventCallback('onComplete', () => {
      if (visible) gsap.delayedCall(E.page.holdAfter, () => visible && tl.restart());
    });
  };
  const io = new IntersectionObserver(
    ([e]) => {
      const was = visible;
      visible = Boolean(e?.isIntersecting);
      if (visible && !was) run();
    },
    { threshold: 0.35 }
  );
  io.observe(root);
  return () => {
    io.disconnect();
    tl.kill();
  };
}
