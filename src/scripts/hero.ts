// Page motion controller: owns the phases (initial -> intro -> settled), the
// boot handoff and recovery, the pause control, the hero's scroll blast-off,
// and starts the project index motion (src/scripts/ledger.ts).
// The effects it calls live in src/lib/effects; timings live in src/lib/motion.ts.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DURATION, EASE, HERO, STAGGER } from '../lib/motion';
import { prefersReducedMotion } from '../lib/effects/util';
import { buildPageIntro } from '../lib/effects/route-letters';
import { speakIn } from '../lib/effects/speak-in';
import { startWave, type WaveStop } from '../lib/effects/wave';
import { blastOff, type BlastOff } from '../lib/effects/blast-off';
import { attachParticleEffect, type ParticleEffectControls } from '../lib/effects/particles/attach';
import { reactor } from '../lib/effects/particles/reactor';
import { ledgerRevealItems, setupLedgerHover, startLedgerReveal } from './ledger';

gsap.registerPlugin(ScrollTrigger, SplitText);

declare global {
  interface Window {
    __motionBootTimer?: number;
  }
}

const html = document.documentElement;
/** The page root that carries data-phase. */
const owner = document.body;
/** Longest we wait for fonts before splitting; the boot deadline bounds it anyway. */
const FONT_WAIT_MS = 1200;
const PAUSE_KEY = 'motion-paused';

type Elements = {
  hero: HTMLElement;
  heading: HTMLElement;
  sub: HTMLElement;
  cta: HTMLElement;
  particleRoot: HTMLElement;
  canvas: HTMLCanvasElement;
  pause: HTMLButtonElement;
  wordmark: HTMLElement;
  wordmarkText: HTMLElement;
  wordmarkRule: HTMLElement;
  rise: HTMLElement[];
  intro: HTMLElement[];
};

function query(): Elements | null {
  const $ = <T extends Element>(sel: string) => document.querySelector<T & HTMLElement>(sel);
  const hero = $<HTMLElement>('[data-hero]');
  const heading = $<HTMLElement>('[data-letters]');
  const sub = $<HTMLElement>('[data-speak]');
  const cta = $<HTMLElement>('[data-cta]');
  const particleRoot = $<HTMLElement>('[data-particle-button]');
  const canvas = $<HTMLCanvasElement>('[data-particles]');
  const pause = $<HTMLButtonElement>('[data-motion-pause]');
  const wordmark = $<HTMLElement>('[data-wordmark]');
  const wordmarkText = $<HTMLElement>('[data-wordmark-text]');
  const wordmarkRule = $<HTMLElement>('[data-wordmark-rule]');
  if (!hero || !heading || !sub || !cta || !particleRoot || !canvas || !pause) return null;
  if (!wordmark || !wordmarkText || !wordmarkRule) return null;
  // Only rise items that are actually displayed at this width (nav vs menu button).
  const rise = Array.from(document.querySelectorAll<HTMLElement>('[data-rise]')).filter(
    (el) => el.getClientRects().length > 0
  );
  const intro = Array.from(document.querySelectorAll<HTMLElement>('[data-intro]'));
  return {
    hero,
    heading,
    sub,
    cta,
    particleRoot,
    canvas: canvas as HTMLCanvasElement,
    pause: pause as HTMLButtonElement,
    wordmark,
    wordmarkText,
    wordmarkRule,
    rise,
    intro,
  };
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Claims the boot from the inline head script: stops its recovery timer. */
function claimBoot(): boolean {
  if (html.dataset.motionBoot !== 'pending') return false;
  window.clearTimeout(window.__motionBootTimer);
  html.dataset.motionBoot = 'running';
  return true;
}

function releaseBoot(state: 'recovered' | 'settled') {
  window.clearTimeout(window.__motionBootTimer);
  html.dataset.motionBoot = state;
}

/* ---------- Pause control (WCAG 2.2.2: loops past five seconds need one) ---------- */

function readPaused(): boolean {
  try {
    return localStorage.getItem(PAUSE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writePaused(paused: boolean) {
  try {
    localStorage.setItem(PAUSE_KEY, String(paused));
  } catch {}
}

/* ---------- Wordmark: letters spring in, the underline draws ---------- */

function wordmarkIntro(text: HTMLElement, rule: HTMLElement): gsap.core.Timeline {
  const split = SplitText.create(text, { type: 'chars', aria: 'auto' });
  const revert = () => split.revert();
  const tl = gsap.timeline({ defaults: { overwrite: 'auto' }, onComplete: revert, onInterrupt: revert });
  tl.from(
    split.chars,
    { yPercent: 115, autoAlpha: 0, duration: 1.1, ease: 'elastic.out(1, 0.5)', stagger: STAGGER.tight },
    0
  );
  tl.fromTo(
    rule,
    { scaleX: 0 },
    { scaleX: 1, duration: HERO.wordmarkUnderlineDuration, ease: EASE.entrance, immediateRender: true },
    HERO.wordmarkUnderlineDelay
  );
  tl.set(rule, { clearProps: 'transform' });
  return tl;
}

/* ---------- Settled: wave, embers, pause, blast-off ---------- */

function settle(els: Elements, words: HTMLElement[], particles: ParticleEffectControls | null) {
  owner.dataset.phase = 'settled';

  let paused = readPaused();
  let heroVisible = true;
  let blasted = false;
  let wave: WaveStop | null = null;
  let blast: BlastOff | null = null;

  const running = () => !paused && heroVisible;
  const applyRunning = () => {
    if (running()) {
      wave?.resume();
      particles?.play();
    } else {
      wave?.pause();
      particles?.pause();
    }
  };
  const beginWave = () => {
    wave?.();
    wave = startWave(els.heading, { period: HERO.wavePeriod });
    applyRunning();
  };
  const endWave = () => {
    wave?.();
    wave = null;
  };

  // Pause button.
  const syncPause = () => {
    els.pause.textContent = paused ? 'Play motion' : 'Pause motion';
    els.pause.setAttribute('aria-pressed', String(paused));
  };
  els.pause.addEventListener('click', () => {
    paused = !paused;
    writePaused(paused);
    syncPause();
    applyRunning();
  });
  syncPause();

  beginWave();

  // The wave rests while the hero is off screen.
  ScrollTrigger.create({
    trigger: els.hero,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      heroVisible = self.isActive;
      applyRunning();
    },
  });

  // Blast-off when the visitor scrolls past; scrolling back reverses it.
  ScrollTrigger.create({
    trigger: els.hero,
    start: HERO.blastStart,
    onEnter: () => {
      blasted = true;
      particles?.blast();
      if (blast) {
        blast.timeline.play();
        return;
      }
      endWave();
      const b = blastOff({ root: els.hero, heading: els.heading, words, pressed: els.cta, others: [] });
      blast = b;
      b.timeline.eventCallback('onReverseComplete', () => {
        b.revert();
        if (blast === b) blast = null;
        if (!blasted) {
          particles?.idle();
          beginWave();
        }
      });
      b.timeline.play(0);
    },
    onLeaveBack: () => {
      blasted = false;
      blast?.timeline.reverse();
    },
  });

  // The poster size is fluid, so the wave's pinned letter widths go stale on resize.
  let lastWidth = els.heading.getBoundingClientRect().width;
  let resizeTimer = 0;
  new ResizeObserver(() => {
    const width = els.heading.getBoundingClientRect().width;
    if (Math.abs(width - lastWidth) < 1) return;
    lastWidth = width;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (wave && !blasted && !blast) beginWave();
    }, 150);
  }).observe(els.heading.parentElement ?? els.heading);

  applyRunning();
}

/* ---------- Intro paths ---------- */

function introFull(els: Elements) {
  const ctx = gsap.context(() => {});
  let particles: ParticleEffectControls | null = null;
  let ledgerTeardown: (() => void) | null = null;
  let master: gsap.core.Timeline | null = null;
  let words: HTMLElement[] = [];
  let failure: unknown;

  // Every start value is written here, before the phase flips and the CSS gate releases.
  ctx.add(() => {
    try {
      const mark = wordmarkIntro(els.wordmarkText, els.wordmarkRule);
      const page = buildPageIntro({ letters: [els.heading], standard: els.rise });
      const spoken = speakIn(els.sub, { emphasis: HERO.speakEmphasis, delay: HERO.speakDelay });
      words = spoken.words;
      particles = attachParticleEffect(els.particleRoot, els.canvas, els.cta, reactor);
      particles.enter(HERO.buttonDelay);
      if (readPaused()) particles.pause();
      ledgerTeardown = startLedgerReveal(ledgerRevealItems());
      master = gsap.timeline({ paused: true }).add(mark, 0).add(page, 0).add(spoken.timeline, 0);
    } catch (error) {
      failure = error;
    }
  });

  if (failure || !master) {
    (particles as ParticleEffectControls | null)?.destroy();
    (ledgerTeardown as (() => void) | null)?.();
    ctx.revert();
    throw failure ?? new Error('hero intro did not build');
  }

  const timeline: gsap.core.Timeline = master;
  els.pause.hidden = false;
  owner.dataset.phase = 'intro';
  timeline.eventCallback('onComplete', () => {
    releaseBoot('settled');
    settle(els, words, particles);
  });
  timeline.play();
}

/** Reduced motion: no scatter, wave, speak-in, particles or blast. Everything fades in. */
function introReduced(els: Elements) {
  const ledger = ledgerRevealItems();
  gsap.set(els.intro, { autoAlpha: 0 });
  // Opacity only for the index, so its rows stay in the tab order.
  gsap.set(ledger, { opacity: 0 });
  owner.dataset.phase = 'intro';
  gsap.to(ledger, { opacity: 1, duration: DURATION.component, ease: EASE.entrance, clearProps: 'opacity' });
  gsap.to(els.intro, {
    autoAlpha: 1,
    duration: DURATION.component,
    ease: EASE.entrance,
    clearProps: 'opacity,visibility',
    onComplete: () => {
      owner.dataset.phase = 'settled';
      releaseBoot('settled');
    },
  });
}

/** The deadline passed first: the page is already showing settled. Run only the settled effects. */
function lateSettle(els: Elements) {
  owner.dataset.phase = 'settled';
  if (prefersReducedMotion()) return;
  const particles = attachParticleEffect(els.particleRoot, els.canvas, els.cta, reactor);
  particles.idle();
  const words = SplitText.create(els.sub, { type: 'words' }).words as HTMLElement[];
  els.pause.hidden = false;
  settle(els, words, particles);
}

async function main() {
  const els = query();
  if (!els) {
    releaseBoot('recovered');
    owner.dataset.phase = 'settled';
    return;
  }

  await Promise.race([document.fonts.ready, wait(FONT_WAIT_MS)]);

  // Index name waves on hover and keyboard focus. A no-op under reduced motion.
  setupLedgerHover();

  if (!claimBoot()) {
    lateSettle(els);
    return;
  }

  try {
    if (prefersReducedMotion()) introReduced(els);
    else introFull(els);
  } catch (error) {
    console.error('[hero] intro failed, showing the settled page', error);
    releaseBoot('recovered');
    owner.dataset.phase = 'settled';
  }
}

// Returning from the back-forward cache: no intro, just re-measure.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) ScrollTrigger.refresh();
});

main();
