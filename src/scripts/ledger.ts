// Project index motion: rows rise in as they enter view; hovering or
// keyboard-focusing a row waves its name once (the accent rule draw is CSS).
// Called by the page controller in hero.ts, which owns the boot and phases.
import gsap from 'gsap';
import { HERO, SHIFT, STAGGER } from '../lib/motion';
import { revealOnScroll, type Teardown } from '../lib/effects/reveal';
import { charsWeightWave } from '../lib/effects/weight-wave';

/** The index header and rows, in document order. */
export function ledgerRevealItems(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-reveal]'));
}

/**
 * Hides the rows now, then starts the scroll reveal once the hero's supporting
 * items begin to rise, so rows already in view do not arrive ahead of the name.
 */
export function startLedgerReveal(items: HTMLElement[]): Teardown {
  let teardown: Teardown = () => {};
  gsap.set(items, { opacity: 0, y: SHIFT.page });
  const start = gsap.delayedCall(HERO.riseDelay, () => {
    teardown = revealOnScroll(items, { y: SHIFT.page, stagger: STAGGER.loose });
  });
  return () => {
    start.kill();
    teardown();
    gsap.set(items, { clearProps: 'opacity,transform' });
  };
}

/** Wave a row's name once when it is hovered or reached by keyboard. */
export function setupLedgerHover(): Teardown {
  const listeners = new AbortController();
  const { signal } = listeners;
  for (const row of document.querySelectorAll<HTMLElement>('.ledger-row')) {
    const name = row.querySelector<HTMLElement>('[data-ledger-name]');
    if (!name) continue;
    const wave = () => {
      try {
        charsWeightWave(name);
      } catch (error) {
        console.error('[ledger] name wave failed', error);
      }
    };
    row.addEventListener(
      'pointerenter',
      (e) => {
        if (e.pointerType === 'mouse' || e.pointerType === 'pen') wave();
      },
      { signal }
    );
    row.addEventListener(
      'focus',
      () => {
        if (row.matches(':focus-visible')) wave();
      },
      { signal }
    );
  }
  return () => listeners.abort();
}
