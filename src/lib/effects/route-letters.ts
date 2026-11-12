// Route intro: headline letters scatter in from off screen; supporting items rise.
// Adapted from the Animaxxing `route-letters` recipe (intro only: this is a
// single-page site, so there is no route outro).
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { HERO, SHIFT } from '../motion';
import { guarded, prefersReducedMotion } from './util';

gsap.registerPlugin(SplitText);

const spreadX = () => window.innerWidth * HERO.lettersSpread;
const spreadY = () => window.innerHeight * HERO.lettersSpread;

export type IntroTargets = {
  /** Headlines that scatter in letter by letter. */
  letters: HTMLElement[];
  /** Supporting items that rise in. */
  standard: HTMLElement[];
};

/**
 * Builds the intro timeline. Splits are reverted on completion or interruption,
 * so the headline ends as plain, kerned-as-at-rest text.
 */
export function buildPageIntro({ letters, standard }: IntroTargets): gsap.core.Timeline {
  const splits: SplitText[] = [];
  const revertAll = () => {
    for (const split of splits.splice(0)) {
      gsap.killTweensOf(split.chars);
      split.revert();
    }
  };
  return guarded(() => intro(letters, standard, splits, revertAll), revertAll);
}

function intro(
  letters: HTMLElement[],
  standard: HTMLElement[],
  splits: SplitText[],
  revertAll: () => void
): gsap.core.Timeline {
  const items = [...letters, ...standard];
  const timeline = gsap.timeline({ defaults: { overwrite: 'auto' } });

  timeline.eventCallback('onComplete', () => {
    revertAll();
    if (letters.length > 0) gsap.set(letters, { autoAlpha: 1, clearProps: 'transform,willChange' });
  });
  timeline.eventCallback('onInterrupt', revertAll);

  if (prefersReducedMotion()) {
    return timeline.set(items, { autoAlpha: 1, clearProps: 'transform,willChange' });
  }

  if (standard.length > 0) gsap.set(standard, { autoAlpha: 0, y: SHIFT.page });
  for (const item of letters) {
    const split = SplitText.create(item, { type: 'chars', smartWrap: true, aria: 'auto' });
    splits.push(split);
    gsap.set(item, { autoAlpha: 1, y: 0 });
    gsap.set(split.chars, {
      autoAlpha: 0,
      x: () => gsap.utils.random(-spreadX(), spreadX()),
      y: () => gsap.utils.random(-spreadY(), spreadY()),
      rotation: () => gsap.utils.random(-90, 90),
      scale: 0.5,
    });
  }

  timeline.addLabel('enter', 0).set(items, { willChange: 'transform, opacity' }, 'enter');
  for (const split of splits) {
    timeline.to(
      split.chars,
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        duration: HERO.lettersDuration,
        ease: 'power4.out',
        stagger: { each: HERO.lettersStagger, from: 'random' },
      },
      `enter+=${HERO.lettersDelay}`
    );
  }
  if (standard.length > 0) {
    timeline.to(
      standard,
      { autoAlpha: 1, y: 0, duration: HERO.riseDuration, ease: 'power3.out', stagger: HERO.riseStagger },
      `enter+=${HERO.riseDelay}`
    );
  }
  return timeline.set(items, { clearProps: 'transform,willChange' }, timeline.duration());
}
