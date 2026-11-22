// Direct links to a part of the home page (njvan.net/#cotrip).
//
// The browser jumps to the anchor by itself, but that jump races the page's
// boot (the intro starts, fonts load, the scenes are staged) and on some loads
// it never lands, so the visitor sees the top of the page. This lands it for
// real: scroll the target to the top, jumping rather than gliding, and check
// again for a moment in case the layout shifts underneath. It lets go as soon
// as the visitor scrolls, presses a key or taps, so it never fights them.

/** How often to check the target is still at the top. */
const CHECK_EVERY_MS = 120;
/** Longest it keeps checking: past the intro and the scene setup. */
const GIVE_UP_AFTER_MS = 3000;
/** Closer than this counts as landed. */
const TOLERANCE_PX = 2;

const target = (): HTMLElement | null => {
  let id = location.hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    // A malformed link: use it as written.
  }
  return id ? document.getElementById(id) : null;
};

function landOnHash(): void {
  // A project's address (#cotrip) opens it in the stage (src/scripts/stage.ts); there is nothing to scroll to.
  if (!target() || target()!.closest('[data-stage]')) return;

  const stopEvents = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
  let timer = 0;
  let giveUp = 0;
  const stop = () => {
    window.clearInterval(timer);
    window.clearTimeout(giveUp);
    stopEvents.forEach((type) => window.removeEventListener(type, stop));
  };
  const check = () => {
    const el = target();
    if (!el || el.closest('[data-stage]')) return stop();
    // "instant" overrides the page's smooth scrolling for this jump.
    if (Math.abs(el.getBoundingClientRect().top) > TOLERANCE_PX) el.scrollIntoView({ block: 'start', behavior: 'instant' });
  };

  stopEvents.forEach((type) => window.addEventListener(type, stop, { passive: true }));
  timer = window.setInterval(check, CHECK_EVERY_MS);
  giveUp = window.setTimeout(stop, GIVE_UP_AFTER_MS);
  check();
}

landOnHash();
