// Project index motion.
// Entrance, replayed each time the index comes into view: the hairlines draw
// across, the mono labels decode into place (ScrambleText), each name rises
// letter by letter from behind a mask and its line fades up, then each row's
// accent runs under it and retracts in turn, one accent on screen at a time.
// It resets once the index has left the screen. Hover and keyboard focus wave
// a name once (the hover accent rule is CSS). Called by src/scripts/hero.ts.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { INDEX } from '../lib/motion';
import { charsWeightWave } from '../lib/effects/weight-wave';
import { prefersReducedMotion } from '../lib/effects/util';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

export type Teardown = () => void;

/** True while the entrance has the names split, so the hover wave keeps off them. */
let entranceBusy = false;

/** The index header and rows, in document order (gated by opacity before first paint). */
export function ledgerRevealItems(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-reveal]'));
}

type Row = {
  rule: HTMLElement;
  accent: HTMLElement;
  name: HTMLElement;
  line: HTMLElement;
  scrambles: HTMLElement[];
};

/**
 * Sets up the replaying entrance. `hold` delays the first play (seconds), so on
 * first load the rows never arrive before the hero's name.
 */
export function setupLedgerIntro({ hold = 0 }: { hold?: number } = {}): Teardown {
  const items = ledgerRevealItems();
  const section = document.querySelector<HTMLElement>('#projects');
  if (!section || prefersReducedMotion()) {
    gsap.set(items, { clearProps: 'opacity' });
    return () => {};
  }
  const headRule = section.querySelector<HTMLElement>('.index__head [data-ledger-rule]');
  const headScrambles = Array.from(section.querySelectorAll<HTMLElement>('.index__head [data-ledger-scramble]'));
  const rows: Row[] = Array.from(section.querySelectorAll<HTMLElement>('.ledger-row')).flatMap((row) => {
    const rule = row.querySelector<HTMLElement>('[data-ledger-rule]');
    const accent = row.querySelector<HTMLElement>('[data-ledger-accent]');
    const name = row.querySelector<HTMLElement>('[data-ledger-name]');
    const line = row.querySelector<HTMLElement>('[data-ledger-line]');
    if (!rule || !accent || !name || !line) return [];
    return [{ rule, accent, name, line, scrambles: Array.from(row.querySelectorAll<HTMLElement>('[data-ledger-scramble]')) }];
  });
  const scrambles = [...headScrambles, ...rows.flatMap((r) => r.scrambles)];
  const finalText = new Map(scrambles.map((el) => [el, (el.textContent ?? '').replace(/\s+/g, ' ').trim()]));
  const rules = [headRule, ...rows.map((r) => r.rule)].filter((el): el is HTMLElement => el !== null);

  let tl: gsap.core.Timeline | null = null;
  let splits: SplitText[] = [];
  let shown = false;
  const readyAt = performance.now() + hold * 1000;
  let holdCall: gsap.core.Tween | null = null;

  const revertSplits = () => {
    splits.forEach((s) => s.revert());
    splits = [];
    entranceBusy = false;
  };

  /** Ready to play, out of sight: rules undrawn, labels empty, names and lines hidden. */
  const hide = () => {
    holdCall?.kill();
    tl?.kill();
    tl = null;
    revertSplits();
    gsap.set(rules, { scaleX: 0 });
    scrambles.forEach((el) => (el.textContent = ''));
    gsap.set([...rows.map((r) => r.name), ...rows.map((r) => r.line)], { autoAlpha: 0 });
    gsap.set(rows.map((r) => r.accent), { clearProps: 'transform,transformOrigin' });
    shown = false;
  };

  /** Settled: everything in place (also the end of every run). */
  const finish = () => {
    revertSplits();
    gsap.set(rules, { clearProps: 'transform' });
    scrambles.forEach((el) => (el.textContent = finalText.get(el) ?? ''));
    gsap.set([...rows.map((r) => r.name), ...rows.map((r) => r.line)], { clearProps: 'opacity,visibility,transform' });
    gsap.set(rows.map((r) => r.accent), { clearProps: 'transform,transformOrigin' });
  };

  const scrambleTo = (el: HTMLElement, at: number) =>
    tl!.to(
      el,
      { duration: INDEX.scramble, ease: 'none', scrambleText: { text: finalText.get(el) ?? '', chars: INDEX.scrambleChars, speed: 0.6 } },
      at
    );

  const play = () => {
    if (shown) return;
    shown = true;
    tl?.kill();
    revertSplits();
    entranceBusy = true;
    tl = gsap.timeline({ onComplete: finish });

    if (headRule) tl.fromTo(headRule, { scaleX: 0 }, { scaleX: 1, duration: INDEX.ruleDraw, ease: 'power3.inOut' }, 0);
    headScrambles.forEach((el) => scrambleTo(el, 0.05));

    rows.forEach((row, i) => {
      const at = 0.15 + i * INDEX.rowStagger;
      tl!.fromTo(row.rule, { scaleX: 0 }, { scaleX: 1, duration: INDEX.ruleDraw, ease: 'power3.inOut' }, at);
      row.scrambles.forEach((el) => scrambleTo(el, at + 0.05));
      // smartWrap keeps each word whole, so a name never breaks mid-word while split.
      const split = SplitText.create(row.name, { type: 'chars', mask: 'chars', smartWrap: true, aria: 'auto' });
      for (const mask of split.masks) (mask as HTMLElement).classList.add('ledger-char-mask');
      splits.push(split);
      tl!.set(row.name, { autoAlpha: 1 }, at);
      tl!.fromTo(
        split.chars,
        { yPercent: 110 },
        { yPercent: 0, duration: INDEX.nameRise, ease: 'power3.out', stagger: INDEX.nameStagger },
        at + 0.1
      );
      tl!.fromTo(row.line, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, at + 0.3);
    });

    // The accent preview: one row at a time, each running in from the left and out to the right.
    const sweepAt = 0.15 + rows.length * INDEX.rowStagger + INDEX.nameRise + INDEX.sweepGap;
    rows.forEach((row, i) => {
      const t = sweepAt + i * INDEX.sweep;
      tl!.fromTo(
        row.accent,
        { scaleX: 0, transformOrigin: '0% 50%' },
        { scaleX: 1, duration: INDEX.sweep * 0.5, ease: 'power2.inOut' },
        t
      );
      tl!.to(row.accent, { scaleX: 0, transformOrigin: '100% 50%', duration: INDEX.sweep * 0.5, ease: 'power2.inOut' }, t + INDEX.sweep * 0.5);
    });
  };

  const enter = () => {
    const wait = Math.max(0, (readyAt - performance.now()) / 1000);
    holdCall?.kill();
    if (wait > 0) holdCall = gsap.delayedCall(wait, play);
    else play();
  };

  hide();
  gsap.set(items, { clearProps: 'opacity' });

  const triggers = [
    ScrollTrigger.create({ trigger: section, start: 'top 70%', end: 'bottom 30%', onEnter: enter, onEnterBack: enter }),
    // Reset only once it is fully out of view, so nothing snaps back on screen.
    ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top', onLeave: hide, onLeaveBack: hide }),
  ];

  return () => {
    triggers.forEach((t) => t.kill());
    holdCall?.kill();
    tl?.kill();
    finish();
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
      if (entranceBusy) return;
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
