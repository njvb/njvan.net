// Kora's signature moment: the interface panels Flip from a loose pile into
// their grid, the resourcing bars and timesheet columns grow in, a question to
// Ask Kora types itself, and the answer speaks in. Timings in KORA (motion.ts).
//
// The scene's moment (src/lib/moments.ts) is the trigger: at 0 the panels wait
// in the pile; once it starts the sequence plays on its own clock; when the
// moment resets (the scene has left the screen) everything goes back to the
// pile, ready to replay. If the moment arrives already settled (reduced motion,
// a failed setup) the panels stay in their grid with everything shown. Without
// JavaScript nothing changes: the settled grid is the markup.
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { CustomEase } from 'gsap/CustomEase';
import { ANIMAXXING_CURVE, EASE, KORA, SHIFT } from '../lib/motion';
import { onMoment } from '../lib/moments';
import { revertTyping, typeIn } from '../lib/effects/typewriter';
import { speakIn } from '../lib/effects/speak-in';

gsap.registerPlugin(Flip, CustomEase);
CustomEase.create('animaxxing', ANIMAXXING_CURVE);

export function mountKora(root: HTMLElement): void {
  const grid = root.querySelector<HTMLElement>('[data-kora-grid]');
  const question = root.querySelector<HTMLElement>('[data-kora-question]');
  const answer = root.querySelector<HTMLElement>('[data-kora-answer]');
  const sources = root.querySelector<HTMLElement>('[data-kora-sources]');
  const id = root.closest<HTMLElement>('[data-scene]')?.id;
  if (!grid || !question || !answer || !sources || !id) return;
  const panels = Array.from(grid.querySelectorAll<HTMLElement>('[data-kora-panel]'));
  const bars = Array.from(root.querySelectorAll<HTMLElement>('[data-kora-bar]'));
  const hours = Array.from(root.querySelectorAll<HTMLElement>('[data-kora-hour]'));

  let state: 'idle' | 'pile' | 'playing' | 'done' = 'idle';
  let running: gsap.core.Timeline | null = null;
  let spokenRevert: (() => void) | null = null;

  /** Waiting: panels piled (the grid keeps its settled height), question and answer hidden, bars empty. */
  const toPile = () => {
    grid.style.minHeight = `${grid.offsetHeight}px`;
    grid.dataset.layout = 'pile';
    root.classList.add('is-moving');
    gsap.set([question, answer, sources], { autoAlpha: 0 });
    gsap.set(bars, { scaleX: 0, transformOrigin: '0% 50%' });
    gsap.set(hours, { scaleY: 0, transformOrigin: '50% 100%' });
    state = 'pile';
  };

  /** Stops a run in flight and puts its text back, without settling it. */
  const stop = () => {
    const tl = running;
    running = null;
    tl?.kill();
    revertTyping(question);
    spokenRevert?.();
    spokenRevert = null;
    gsap.killTweensOf([...panels, ...bars, ...hours, question, answer, sources]);
    gsap.set(panels, { clearProps: 'transform,position,top,left,width,height,opacity,zIndex' });
  };

  /** Settled: the markup's own grid with everything shown. */
  const settle = () => {
    running?.progress(1);
    delete grid.dataset.layout;
    grid.style.removeProperty('min-height');
    root.classList.remove('is-moving');
    gsap.set([question, answer, sources], { clearProps: 'opacity,visibility,transform' });
    gsap.set([...bars, ...hours], { clearProps: 'transform,transformOrigin' });
    state = 'done';
  };

  const play = () => {
    state = 'playing';
    const before = Flip.getState(panels);
    delete grid.dataset.layout;
    const tl = gsap.timeline({ onComplete: settle });
    running = tl;

    tl.add(
      Flip.from(before, {
        targets: panels,
        duration: KORA.flip.duration,
        ease: 'animaxxing',
        stagger: KORA.flip.stagger,
        absolute: true,
      }),
      0
    );
    tl.to(bars, { scaleX: 1, duration: KORA.bars.duration, ease: EASE.entrance, stagger: KORA.bars.stagger }, KORA.bars.at);
    tl.to(hours, { scaleY: 1, duration: KORA.bars.duration, ease: EASE.entrance, stagger: KORA.bars.stagger }, KORA.bars.at);

    // The question types itself, then the answer speaks in and its sources rise.
    tl.add(typeIn(question, { speed: KORA.typeSpeed, blinks: 1 }), KORA.typeAt);
    const spoken = speakIn(answer);
    spokenRevert = spoken.revert;
    tl.add(spoken.timeline, `>+${KORA.answerGap}`);
    tl.fromTo(
      sources,
      { autoAlpha: 0, y: SHIFT.component },
      { autoAlpha: 1, y: 0, duration: 0.3, ease: EASE.entrance },
      '>+0.1'
    );
    tl.call(() => {
      spoken.revert();
      spokenRevert = null;
    });
  };

  onMoment(id, (p) => {
    if (p <= 0) {
      // Reset (the scene has left): back to the pile, ready to replay.
      if (state === 'playing') stop();
      if (state !== 'pile') toPile();
      return;
    }
    if (state === 'playing' || state === 'done') return;
    if (p >= 1) {
      // Arrived settled without playing (reduced motion, or a failed scene setup).
      if (state === 'pile') settle();
      else state = 'done';
      return;
    }
    if (state === 'idle') toPile();
    play();
  });
}
