// Scroll reveal: items rise in batches as they cross into view.
// `revealOnScroll` from the Animaxxing `scroll-effects` recipe.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./util";

gsap.registerPlugin(ScrollTrigger);


/** Where a reveal fires: the item's top crosses this line of the viewport. */
const REVEAL_START = "top 85%";

export type Teardown = () => void;
export type Scroller = Element | string | undefined;

type Register = (fn: () => void) => void;

/**
 * Runs setup in its own GSAP context, which reverts its tweens, triggers, pins, and splits (SplitText 3.13+).
 * Returns a once-only teardown that also rolls back a throw. `dispose` stops writers before the revert; `after` restores after it.
 */
function own(setup: (dispose: Register, after: Register) => void): Teardown {
  const ctx = gsap.context(() => {});
  const disposers: Array<() => void> = [];
  const restores: Array<() => void> = [];
  let done = false;
  const teardown = () => {
    if (done) return;
    done = true;
    let failure: unknown;
    const attempt = (fn: () => void) => {
      try {
        fn();
      } catch (error) {
        failure ??= error;
      }
    };
    disposers.splice(0).reverse().forEach(attempt);
    attempt(() => ctx.revert());
    restores.splice(0).reverse().forEach(attempt);
    if (failure) throw failure;
  };
  let failure: { error: unknown } | undefined;
  // Catch inside add: GSAP restores its current context only when add returns.
  ctx.add(() => {
    try {
      setup((fn) => disposers.push(fn), (fn) => restores.push(fn));
    } catch (error) {
      failure = { error };
    }
  });
  if (failure) {
    teardown();
    throw failure.error;
  }
  return teardown;
}

export type RevealOptions = {
  start?: string;
  /** Rise distance in px. */
  y?: number;
  /** Starting scale, such as 0 for a pop; omitted leaves scale alone. */
  scale?: number;
  /** Starting rotation in degrees; omitted leaves rotation alone. */
  rotation?: number;
  duration?: number;
  stagger?: number;
  /** Accepts a registered CustomEase name. */
  ease?: string;
  /** Hide again when scrolled back above `start`, and reveal again on the way down. */
  repeat?: boolean;
  scroller?: Scroller;
};

export function revealOnScroll(
  targets: gsap.DOMTarget,
  { start = REVEAL_START, y = 16, scale, rotation, duration = 0.42, stagger = 0.09, ease = "power3.out", repeat = false, scroller }: RevealOptions = {},
): Teardown {
  const items = gsap.utils.toArray<HTMLElement>(targets);
  if (!items.length || prefersReducedMotion()) return () => {};
  return own((dispose) => {
    // Reveal tweens start later, outside the context, so they are tracked here.
    const live = new Set<gsap.core.Tween>();
    dispose(() => live.forEach((tween) => tween.kill()));
    // Opacity only: visibility would drop waiting items from the accessibility tree and the tab order.
    const from: gsap.TweenVars = { opacity: 0, y };
    const to: gsap.TweenVars = { opacity: 1, y: 0 };
    if (scale !== undefined) {
      from.scale = scale;
      to.scale = 1;
    }
    if (rotation !== undefined) {
      from.rotation = rotation;
      to.rotation = 0;
    }
    gsap.set(items, from);
    ScrollTrigger.batch(items, {
      start,
      once: !repeat,
      scroller,
      // Leaving is quicker than arriving, straight, with no overshoot.
      onLeaveBack: repeat
        ? (batch) => {
            const tween = gsap.to(batch, {
              ...from,
              duration: duration * 0.6,
              stagger: { each: stagger * 0.4, from: "end" },
              ease: "power2.in",
              overwrite: "auto",
              onComplete: () => live.delete(tween),
            });
            live.add(tween);
          }
        : undefined,
      onEnter: (batch) => {
        const tween = gsap.to(batch, {
          ...to,
          duration,
          stagger,
          ease,
          overwrite: "auto",
          onComplete: () => {
            live.delete(tween);
            gsap.set(batch, { clearProps: "transform,opacity" });
          },
        });
        live.add(tween);
      },
    });
    // Focus can reach an item before it crosses the line; a focused item is never invisible.
    const onFocus = (event: FocusEvent) => {
      const item = event.currentTarget as HTMLElement;
      // Only the reveal's own properties; other effects on the item keep running.
      gsap.killTweensOf(item, "opacity,y,scale,rotation");
      gsap.set(item, { clearProps: "transform,opacity" });
    };
    items.forEach((item) => item.addEventListener("focusin", onFocus));
    dispose(() => items.forEach((item) => item.removeEventListener("focusin", onFocus)));
  });
}
