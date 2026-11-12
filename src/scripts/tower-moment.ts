// Campaign Tower's signature moment: the phone rises in pixel steps, its screen
// reveals from the bottom up a floor at a time, then the real gameplay plays
// (a visitor riding the lift up the tower). Stepped easing, no smoothing.
//
// The rise and reveal are one paused GSAP timeline positioned by the scene's
// moment (src/lib/moments.ts), so replays line up. The video loads as the scene
// approaches, plays only once the moment reaches TOWER.playAt, and only while
// the phone is on screen and "Pause motion" is off; it restarts on each visit.
// Under reduced motion, or without JavaScript, the poster frame shows instead.
import gsap from 'gsap';
import { TOWER } from '../lib/motion';
import { onMoment } from '../lib/moments';
import { prefersReducedMotion } from '../lib/effects/util';

const span = ([a, b]: [number, number]) => ({ at: a, duration: b - a });

export function mountTower(root: HTMLElement): void {
  const id = root.closest<HTMLElement>('[data-scene]')?.id;
  const screen = root.querySelector<HTMLElement>('[data-tower-screen]');
  const video = root.querySelector<HTMLVideoElement>('[data-tower-video]');
  if (!id || !screen || !video) return;
  const html = document.documentElement;

  // Load the video as the scene approaches, not with the page.
  const preload = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      preload.disconnect();
      video.preload = 'auto';
      video.load();
    },
    { rootMargin: `${TOWER.preloadMargin} 0px` }
  );
  preload.observe(root);

  let p = 0;
  let onScreen = false;
  const shouldPlay = () =>
    !prefersReducedMotion() && p >= TOWER.playAt && onScreen && !html.hasAttribute('data-motion-paused');
  const sync = () => {
    if (shouldPlay()) {
      if (video.paused) void video.play().catch(() => {});
    } else if (!video.paused) video.pause();
  };
  new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? false;
    sync();
  }).observe(root);
  new MutationObserver(sync).observe(html, { attributes: true, attributeFilter: ['data-motion-paused'] });

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  const r = span(TOWER.rise);
  tl.fromTo(
    root,
    { yPercent: 8, autoAlpha: 0 },
    { yPercent: 0, autoAlpha: 1, duration: r.duration, ease: `steps(${TOWER.riseSteps})` },
    r.at
  );
  const v = span(TOWER.reveal);
  tl.fromTo(
    screen,
    { clipPath: 'inset(100% 0% 0% 0%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: v.duration, ease: `steps(${TOWER.floors})` },
    v.at
  );
  tl.set({}, {}, 1);

  onMoment(id, (value) => {
    const crossed = p < TOWER.playAt && value >= TOWER.playAt;
    p = value;
    tl.progress(value);
    // Each visit starts the gameplay from the beginning.
    if (value <= 0 || crossed) {
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // Not loaded yet: it will start from the beginning anyway.
      }
    }
    sync();
  });
}
