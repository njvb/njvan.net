// One weight wave across a word: each letter thins out and fills back in,
// left to right. `charsWeightWave` from the Animaxxing `split-entrances` recipe,
// reduced to the parts this site uses. A wave already running on the element
// is left to finish rather than restarted, so a jittery pointer cannot stack them.
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { EASE, STAGGER, WEIGHT } from '../motion';
import { guarded, prefersReducedMotion } from './util';

gsap.registerPlugin(SplitText);

const running = new WeakMap<HTMLElement, gsap.core.Timeline>();

/** Pins each character to the width it needs at its heaviest, so the weight axis can move without reflow. */
function pinWidths(chars: Element[], atWeight: number): void {
  for (const char of chars) {
    const element = char as HTMLElement;
    const previous = element.style.fontWeight;
    element.style.fontWeight = String(atWeight);
    const { width } = element.getBoundingClientRect();
    element.style.fontWeight = previous;
    element.style.display = 'inline-block';
    element.style.width = `${width}px`;
    element.style.textAlign = 'center';
  }
}

export function charsWeightWave(element: HTMLElement): gsap.core.Timeline | null {
  if (prefersReducedMotion()) return null;
  const current = running.get(element);
  if (current) return current;

  return guarded(() => {
    const settled = Number(getComputedStyle(element).fontWeight) || WEIGHT.display;
    const far = settled >= 600 ? WEIGHT.rest : WEIGHT.display;
    const split = SplitText.create(element, { type: 'chars', smartWrap: true, aria: 'auto' });
    pinWidths(split.chars, Math.max(settled, far));

    const release = () => {
      if (running.get(element) !== tl) return;
      running.delete(element);
      split.revert();
    };
    const tl = gsap.timeline({ defaults: { overwrite: 'auto' }, onComplete: release, onInterrupt: release });
    tl.fromTo(
      split.chars,
      { fontWeight: settled },
      { fontWeight: far, duration: 0.3, ease: EASE.shift, stagger: { each: STAGGER.tight, from: 'start' } }
    ).to(
      split.chars,
      { fontWeight: settled, duration: 0.4, ease: EASE.shift, stagger: { each: STAGGER.tight, from: 'start' } },
      0.18
    );
    running.set(element, tl);
    return tl;
  });
}
