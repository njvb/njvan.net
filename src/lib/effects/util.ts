// Shared helpers for the effect recipes in this folder (adapted from the Animaxxing skills).
import gsap from 'gsap';

/**
 * True when motion should be reduced: the OS setting, or an explicit
 * <html data-motion="reduced|full"> override.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  const choice = document.documentElement.dataset.motion;
  if (choice === 'reduced') return true;
  if (choice === 'full') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Runs setup in its own GSAP context; on throw, reverts what it created and rethrows. */
export function guarded<T>(setup: () => T, onFail?: () => void): T {
  const ctx = gsap.context(() => {});
  let result: T | undefined;
  let failure: { error: unknown } | undefined;
  // Catch inside add: GSAP restores its current context only when add returns.
  ctx.add(() => {
    try {
      result = setup();
    } catch (error) {
      failure = { error };
    }
  });
  if (failure) {
    onFail?.();
    ctx.revert();
    throw failure.error;
  }
  return result as T;
}
