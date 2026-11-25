// The /dropshelf/ page's motion: the hero copy rises in, the library and floating shelf play their drop
// (src/scripts/dropshelf-desk.ts), the Link / Copy / Move cards explain themselves, and the sections rise as they
// scroll into view. Values: DROPSHELF in src/lib/motion.ts. Reduced motion shows everything settled; the cards still work.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DROPSHELF as D } from '../lib/motion';
import { prefersReducedMotion } from '../lib/effects/util';
import { playDropshelfDesk } from './dropshelf-desk';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

// Link / Copy / Move: a page demo only; it never touches files.
const LIVE: Record<string, string> = {
  link: 'Link keeps your original in place. Hold Option to Copy and Command to Move when you drop.',
  copy: 'Copy makes an independent copy inside DropShelf. The original is not touched.',
  move: 'Move asks first, verifies the copy, then sends the original to the Trash.',
};
const live = $<HTMLElement>('[data-ds-live]');
const modes = $$<HTMLButtonElement>('[data-ds-mode]');
for (const b of modes) {
  b.addEventListener('click', () => {
    modes.forEach((m) => m.setAttribute('aria-pressed', String(m === b)));
    if (live) live.textContent = LIVE[b.dataset.dsMode ?? 'link'] ?? '';
  });
}

if (!prefersReducedMotion()) {
  const hero = $<HTMLElement>('.ds-hero');
  const copy = hero ? $$<HTMLElement>('.ds-hero__copy > *', hero) : [];
  if (copy.length) {
    gsap.set(copy, { y: 24, opacity: 0 });
    gsap.to(copy, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.1, delay: 0.1 });
  }
  delete document.documentElement.dataset.dsIntro;
  const desk = $<HTMLElement>('.ds-hero__desk[data-ds-desk]');
  if (desk) {
    gsap.set(desk, { opacity: 1 });
    playDropshelfDesk(desk);
  }

  const R = D.page.reveal;
  const once = (trigger: Element) => ({ trigger, start: R.start, once: true });
  for (const h of $$<HTMLElement>('.ds-h2')) {
    gsap.from(h, { y: R.y, opacity: 0, duration: R.duration, ease: 'power3.out', scrollTrigger: once(h) });
  }
  for (const [sel, stagger] of [['.ds-cell', 0.08], ['.ds-mode', 0.1], ['.ds-shots li', 0.1], ['.ds-tier', 0.12], ['.ds-checks li', 0.08], ['.ds-faq details', 0.08]] as const) {
    const items = $$<HTMLElement>(sel);
    if (items.length) {
      gsap.from(items, { y: R.y, opacity: 0, duration: R.duration, ease: 'power3.out', stagger, scrollTrigger: once(items[0]!.parentElement!) });
    }
  }
  const end = $<HTMLElement>('.ds-end__inner');
  if (end) gsap.from($$('.ds-end__inner > *'), { y: R.y, opacity: 0, duration: R.duration, ease: 'power3.out', stagger: 0.12, scrollTrigger: once(end) });
}
