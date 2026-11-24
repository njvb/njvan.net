// The /emergency-tower/ page's motion. Pixel-stepped like Campaign Tower's: the hero's wordmark and icon rise in
// steps, the phone and its triage tags play and replay (src/scripts/emergency-fan.ts), and the sections step in as
// they scroll into view. Values: EMERGENCY in src/lib/motion.ts. Reduced motion shows everything settled.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EMERGENCY as E } from '../lib/motion';
import { prefersReducedMotion } from '../lib/effects/util';
import { playEmergencyFan } from './emergency-fan';

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

if (!prefersReducedMotion()) {
  const stepped = `steps(${E.steps})`;
  const hero = $<HTMLElement>('.em-hero');
  const copy = hero ? $$<HTMLElement>('.em-hero__copy > *', hero) : [];
  // The phone component's root carries the hero's class.
  const phone = $<HTMLElement>('.em-hero__phone[data-em-fan]');

  if (hero && copy.length) {
    gsap.set(copy, { y: 24, opacity: 0 });
    delete document.documentElement.dataset.emIntro;
    gsap.to(copy, { y: 0, opacity: 1, duration: 0.5, ease: stepped, stagger: 0.14, delay: 0.1 });
  } else {
    delete document.documentElement.dataset.emIntro;
  }

  if (phone) {
    gsap.set(phone, { opacity: 1 });
    playEmergencyFan(phone);
  }

  // Sections step in as they come into view.
  const R = E.page.reveal;
  const once = (trigger: Element) => ({ trigger, start: R.start, once: true });
  for (const h of $$<HTMLElement>('.em-h2')) {
    gsap.from(h, { y: R.y, opacity: 0, duration: R.duration, ease: stepped, scrollTrigger: once(h) });
  }
  for (const [sel, stagger] of [['.em-steps li', 0.14], ['.em-cell', 0.07], ['.em-shots li', 0.1], ['.em-checks li', 0.09], ['.em-faq details', 0.08]] as const) {
    const items = $$<HTMLElement>(sel);
    if (items.length) {
      gsap.from(items, { y: R.y, opacity: 0, duration: R.duration, ease: stepped, stagger, scrollTrigger: once(items[0]!.parentElement!) });
    }
  }
  const end = $<HTMLElement>('.em-end__inner');
  if (end) gsap.from($$('.em-end__inner > *', end.parentElement!), { y: R.y, opacity: 0, duration: R.duration, ease: stepped, stagger: 0.12, scrollTrigger: once(end) });
}
