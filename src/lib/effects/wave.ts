// Ambient letter wave: every `period` seconds a different small move ripples
// across a heading's letters, left to right, and each letter ends where it started.
// From the Animaxxing `wave` recipe, with all ten of its moves.
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { HERO } from '../motion';
import { guarded, prefersReducedMotion } from './util';

gsap.registerPlugin(SplitText);

/** Delay between neighbouring letters starting their move. */
const RIPPLE = 0.03;
/** Each letter is back at rest this many seconds after it starts. */
const LETTER_TIME = 0.25;
/** The heading's resting weight. */
const REST = 800;

type Move = (chars: HTMLElement[]) => gsap.core.Timeline;

/** One out-and-back tween per letter; the yoyo lives inside the stagger so each letter turns on its own schedule. */
function ripple(chars: HTMLElement[], vars: gsap.TweenVars, ease = 'sine.inOut') {
  return gsap
    .timeline({ defaults: { overwrite: 'auto' } })
    .to(chars, { ...vars, duration: LETTER_TIME / 2, ease, stagger: { each: RIPPLE, yoyo: true, repeat: 1 } })
    .set(chars, { clearProps: 'transform,opacity,fontWeight' });
}

const rnd = gsap.utils.random;

/** A one-way tween per letter for moves that end where they began anyway. */
function sweep(chars: HTMLElement[], vars: gsap.TweenVars, ease = 'power2.inOut') {
  return gsap
    .timeline({ defaults: { overwrite: 'auto' } })
    .to(chars, { ...vars, duration: LETTER_TIME, ease, stagger: RIPPLE })
    .set(chars, { clearProps: 'transform,opacity,fontWeight' });
}

/** The heading sits at 800, so every weight move is a dip away from bold and back. */
const MOVES: Move[] = [
  // Hop: each letter lifts and lands.
  (chars) => ripple(chars, { y: -14 }, 'power2.out'),
  // Breathe: a swell from the baseline.
  (chars) => ripple(chars, { scale: 1.07, transformOrigin: '50% 100%' }),
  // Lean: a nod to the right and back.
  (chars) => ripple(chars, { rotation: 7, transformOrigin: '50% 100%' }),
  // Flip: a full turn about the vertical axis, so the letter folds to a line and back.
  (chars) => sweep(chars, { rotationY: 360, transformOrigin: '50% 50%' }),
  // Lighten: the weight axis eases down to medium and back.
  (chars) => ripple(chars, { fontWeight: 500 }),
  // Hairline: weight drops to the floor while the letter stretches to keep its footprint.
  (chars) => ripple(chars, { fontWeight: 400, scaleX: 1.14, transformOrigin: '50% 100%' }, 'power2.inOut'),
  // Ink: weight snaps to thin, then fills back in to bold.
  (chars) =>
    gsap
      .timeline({ defaults: { overwrite: 'auto' } })
      .fromTo(
        chars,
        { fontWeight: 400 },
        { fontWeight: REST, duration: LETTER_TIME, ease: 'power2.out', stagger: RIPPLE, immediateRender: false }
      )
      .set(chars, { clearProps: 'fontWeight' }),
  // Shear: a quick italic slant.
  (chars) => ripple(chars, { skewX: 12 }, 'power2.inOut'),
  // Squash: pressed flat and released.
  (chars) => ripple(chars, { scaleY: 0.82, transformOrigin: '50% 100%' }, 'power2.inOut'),
  // Twist: each letter swells with its own small twist, then back.
  (chars) => ripple(chars, { scale: 1.1, rotation: () => rnd(-12, 12), transformOrigin: '50% 50%' }, 'power2.inOut'),
];

/** Pins each letter to its resting width so weight changes cannot reflow the line. */
function pinWidths(chars: HTMLElement[]): void {
  const widths = chars.map((char) => char.getBoundingClientRect().width);
  chars.forEach((char, i) => {
    char.style.display = 'inline-block';
    char.style.width = `${widths[i] ?? 0}px`;
    char.style.textAlign = 'center';
  });
}

export type WaveOptions = { period?: number };

/** Stops the wave and reverts its split. Carries `pause` and `resume`. */
export type WaveStop = (() => void) & { pause: () => void; resume: () => void };

export function startWave(heading: HTMLElement, { period = HERO.wavePeriod }: WaveOptions = {}): WaveStop {
  if (prefersReducedMotion()) return Object.assign(() => {}, { pause: () => {}, resume: () => {} });
  const { split, chars } = guarded(() => {
    const split = SplitText.create(heading, { type: 'chars,words', aria: 'auto' });
    const chars = split.chars as HTMLElement[];
    // Two lines: order by line, then left to right, so the ripple reads like text.
    chars.sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return Math.abs(ra.top - rb.top) > ra.height / 2 ? ra.top - rb.top : ra.left - rb.left;
    });
    pinWidths(chars);
    return { split, chars };
  });

  let deck = gsap.utils.shuffle([...MOVES]);
  let index = 0;
  let current: gsap.core.Timeline | undefined;

  const wave = () => {
    const move = deck[index];
    index++;
    if (index >= deck.length) {
      deck = gsap.utils.shuffle([...MOVES]);
      if (deck[0] === move && deck.length > 1) deck.push(deck.shift() as Move);
      index = 0;
    }
    current?.kill();
    current = move ? move(chars) : undefined;
  };

  const clock = gsap.delayedCall(period, () => {
    wave();
    clock.restart(true);
  });

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clock.kill();
    current?.kill();
    current = undefined;
    split.revert();
  };
  return Object.assign(stop, {
    pause: () => {
      if (!stopped) clock.pause();
    },
    resume: () => {
      if (!stopped) clock.resume();
    },
  });
}
