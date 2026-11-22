// A signature moment's progress, from 0 (not started) to 1 (settled), per scene.
// src/scripts/scenes.ts drives it (scrubbed while pinned, played once when
// stacked, 1 under reduced motion); each scene's moment listens. Moments can
// load late (Tavren's 3D board loads as you approach): a listener gets the
// current value as soon as it subscribes.

type Listener = (p: number) => void;
type Moment = { p: number; listeners: Set<Listener> };

const moments = new Map<string, Moment>();

function get(id: string): Moment {
  let m = moments.get(id);
  if (!m) {
    m = { p: 0, listeners: new Set() };
    moments.set(id, m);
  }
  return m;
}

export function setMoment(id: string, p: number): void {
  const m = get(id);
  if (m.p === p) return;
  m.p = p;
  m.listeners.forEach((fn) => fn(p));
}

export function onMoment(id: string, fn: Listener): () => void {
  const m = get(id);
  m.listeners.add(fn);
  fn(m.p);
  return () => m.listeners.delete(fn);
}

/**
 * A moment whose visual loads late (Tavren's 3D board) can hold its start
 * until it is ready. Scenes wait for the hold, up to a timeout, before playing.
 */
const holds = new Map<string, Promise<void>>();

export function holdMoment(id: string, ready: Promise<unknown>): void {
  holds.set(
    id,
    ready.then(
      () => undefined,
      () => undefined
    )
  );
}

/** Resolves when the moment's visual is ready, or after `timeoutMs`, whichever comes first. */
export function momentReady(id: string, timeoutMs: number): Promise<void> {
  const hold = holds.get(id);
  if (!hold) return Promise.resolve();
  return Promise.race([hold, new Promise<void>((resolve) => setTimeout(resolve, timeoutMs))]);
}

/**
 * Heavy visuals (Tavren's 3D board, Campaign Tower's video) load on demand. The stage announces
 * a project as its card nears, is hovered or focused, and when it opens; a visual listens for its
 * own id (or "all", sent once the cards are near).
 */
const preloaded = new Set<string>();
const preloadListeners = new Map<string, Set<() => void>>();

export function preload(id: string): void {
  if (preloaded.has(id)) return;
  preloaded.add(id);
  preloadListeners.get(id)?.forEach((fn) => fn());
}

/** Runs `fn` once, when `id` is first preloaded (at once if it already has been). */
export function onPreload(id: string, fn: () => void): void {
  if (preloaded.has(id) || preloaded.has('all')) return fn();
  let set = preloadListeners.get(id);
  if (!set) preloadListeners.set(id, (set = new Set()));
  set.add(fn);
  let all = preloadListeners.get('all');
  if (!all) preloadListeners.set('all', (all = new Set()));
  all.add(fn);
}
