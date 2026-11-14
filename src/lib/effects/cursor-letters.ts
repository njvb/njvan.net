// Cursor letters: the letters of a heading react to a fine pointer. Letters
// near the cursor are pushed away from it, swell a little and thin out, with a
// smooth falloff by distance, and settle back when the cursor leaves.
//
// It rides on an existing SplitText split (the wave's), so the heading is never
// split twice. Each char gets an inner span: the wave keeps animating the char,
// this effect moves the inner span, so the two never write the same transform.
// Weight goes through font-variation-settings on the inner span, inside the
// char's pinned width, so nothing around it reflows.
//
// One pointermove listener records the pointer; a gsap.ticker callback (rAF)
// reads the heading's box once, then writes, and removes itself once every
// letter is back at rest.
import gsap from 'gsap';
import { HERO, WEIGHT } from '../motion';
import { prefersReducedMotion } from './util';

/** Hover-capable fine pointers only: no effect on touch. */
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

/** A letter counts as at rest once it is within this many px of home and its swell is below REST_SWELL. */
const REST_PX = 0.1;
/** Small enough that the weight rounds back to rest. */
const REST_SWELL = 0.001;

export type CursorLetters = {
  /** True while the cursor is within reach of a letter. */
  readonly engaged: boolean;
  /** Snaps every letter back, removes the listeners and unwraps the inner spans. */
  destroy: () => void;
};

type Letter = {
  inner: HTMLElement;
  setX: (value: number) => void;
  setY: (value: number) => void;
  setScale: (value: number) => void;
  /** Centre relative to the heading's top-left, in px, untransformed. */
  cx: number;
  cy: number;
  /** Current eased influence values. */
  x: number;
  y: number;
  swell: number;
  thin: number;
  /** Last weight written, so unchanged frames skip the style write. */
  wght: number;
};

export type CursorLettersOptions = {
  /** Where the pointer is tracked (the hero), so letters respond as the cursor approaches. */
  area: HTMLElement;
  /** The heading whose box the char offsets are measured against. */
  heading: HTMLElement;
  /** The split chars, already width-pinned by their owner. */
  chars: HTMLElement[];
  /** Called when the cursor comes within reach of the letters, and again when it leaves. */
  onEngage?: (engaged: boolean) => void;
};

export function cursorLetters({ area, heading, chars, onEngage }: CursorLettersOptions): CursorLetters | null {
  if (prefersReducedMotion() || chars.length === 0) return null;
  if (!window.matchMedia(FINE_POINTER).matches) return null;

  const {
    cursorRadius,
    cursorPush,
    cursorSwell,
    cursorWeight,
    cursorFollow,
    cursorSettle,
  } = HERO;
  const restWeight = WEIGHT.display;

  // Offsets are read against the heading, which the hero CSS positions.
  const letters: Letter[] = chars.map((char) => {
    const inner = document.createElement('span');
    inner.style.display = 'inline-block';
    while (char.firstChild) inner.appendChild(char.firstChild);
    char.appendChild(inner);
    return {
      inner,
      setX: gsap.quickSetter(inner, 'x', 'px') as (value: number) => void,
      setY: gsap.quickSetter(inner, 'y', 'px') as (value: number) => void,
      setScale: gsap.quickSetter(inner, 'scale') as (value: number) => void,
      cx: 0,
      cy: 0,
      x: 0,
      y: 0,
      swell: 0,
      thin: 0,
      wght: restWeight,
    };
  });

  let fontSize = 0;
  const measure = () => {
    fontSize = parseFloat(getComputedStyle(heading).fontSize) || 100;
    for (const letter of letters) {
      const char = letter.inner.parentElement as HTMLElement;
      // offsetLeft/Top ignore the wave's transforms, so the home position is stable.
      let left = 0;
      let top = 0;
      let node: HTMLElement | null = char;
      while (node && node !== heading) {
        left += node.offsetLeft;
        top += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      letter.cx = left + char.offsetWidth / 2;
      letter.cy = top + char.offsetHeight / 2;
    }
  };
  measure();
  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(heading);

  let pointerX = 0;
  let pointerY = 0;
  let inside = false;
  let engaged = false;
  let ticking = false;

  const setEngaged = (value: boolean) => {
    if (value === engaged) return;
    engaged = value;
    onEngage?.(value);
  };

  const tick = (_time: number, deltaTime: number) => {
    // One read per frame, before any write.
    const box = heading.getBoundingClientRect();
    const px = pointerX - box.left;
    const py = pointerY - box.top;
    const radius = cursorRadius * fontSize;
    const push = cursorPush * fontSize;
    const seconds = Math.min(deltaTime, 100) / 1000;

    let near = false;
    let moving = false;
    for (const letter of letters) {
      let tx = 0;
      let ty = 0;
      let tf = 0;
      if (inside) {
        const dx = letter.cx - px;
        const dy = letter.cy - py;
        const distance = Math.hypot(dx, dy);
        if (distance < radius) {
          // Smoothstep falloff: full at the cursor, zero at the radius, no hard edge.
          const t = 1 - distance / radius;
          tf = t * t * (3 - 2 * t);
          const unit = distance > 0.001 ? 1 / distance : 0;
          tx = dx * unit * push * tf;
          ty = dy * unit * push * tf;
          near = true;
        }
      }
      // Exponential approach: quick to follow, slower to settle back.
      const tau = tf > letter.swell ? cursorFollow : cursorSettle;
      const k = 1 - Math.exp(-seconds / tau);
      letter.x += (tx - letter.x) * k;
      letter.y += (ty - letter.y) * k;
      letter.swell += (tf - letter.swell) * k;

      const atRest = tf === 0 && Math.hypot(letter.x, letter.y) < REST_PX && letter.swell < REST_SWELL;
      if (atRest) {
        letter.x = letter.y = letter.swell = 0;
      } else {
        moving = true;
      }

      letter.setX(letter.x);
      letter.setY(letter.y);
      letter.setScale(1 + cursorSwell * letter.swell);
      const wght = Math.round(restWeight + (cursorWeight - restWeight) * letter.swell);
      if (wght !== letter.wght) {
        letter.wght = wght;
        letter.inner.style.fontVariationSettings = wght === restWeight ? '' : `"wght" ${wght}`;
      }
    }

    setEngaged(near);
    if (!moving && !inside) stopTicking();
  };

  const startTicking = () => {
    if (ticking) return;
    ticking = true;
    gsap.ticker.add(tick);
  };
  const stopTicking = () => {
    if (!ticking) return;
    ticking = false;
    gsap.ticker.remove(tick);
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    inside = true;
    startTicking();
  };
  const onLeave = () => {
    inside = false;
  };

  area.addEventListener('pointermove', onMove, { passive: true });
  area.addEventListener('pointerleave', onLeave);

  let destroyed = false;
  return {
    get engaged() {
      return engaged;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      area.removeEventListener('pointermove', onMove);
      area.removeEventListener('pointerleave', onLeave);
      resizeObserver.disconnect();
      stopTicking();
      setEngaged(false);
      for (const letter of letters) {
        const { inner } = letter;
        gsap.set(inner, { clearProps: 'all' });
        const char = inner.parentElement;
        if (!char) continue;
        while (inner.firstChild) char.insertBefore(inner.firstChild, inner);
        inner.remove();
      }
    },
  };
}
