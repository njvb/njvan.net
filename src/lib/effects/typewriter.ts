// Typewriter: text typed one character at a time behind a caret, at a human rhythm.
// `typeIn` and `typeOut` from the Animaxxing `typewriter` recipe.
import gsap from "gsap";
import { guarded, prefersReducedMotion } from "./util";

export type TypeOptions = {
  delay?: number;
  onComplete?: () => void;
  /** Characters per second, on average. */
  speed?: number;
  /** Show a caret while typing. */
  caret?: boolean;
  /** Times the caret blinks after typing ends, before it goes. Each blink is about a second. */
  blinks?: number;
};

/** Seconds per caret blink: half on, half off, under three flashes a second. */
const BLINK = 1.06;

/** The element's text with `<br>` as a line break. */
function plainText(element: HTMLElement): string {
  return Array.from(element.childNodes)
    .map((node) => (node.nodeName === "BR" ? "\n" : (node.textContent ?? "")))
    .join("");
}

/** Seconds before each character appears: uneven, slower after spaces, slowest after punctuation. */
function rhythm(text: string, speed: number): number[] {
  const each = 1 / speed;
  return [...text].map((_, i) => {
    const before = text[i - 1] ?? "";
    const base = each * gsap.utils.random(0.6, 1.4);
    if (/[.,!?;:\n]/.test(before)) return base + each * 4;
    if (before === " ") return base + each * 0.6;
    return base;
  });
}

function makeCaret(): HTMLElement {
  const caret = document.createElement("span");
  caret.dataset.caret = "";
  caret.setAttribute("aria-hidden", "true");
  return caret;
}

type Run = { timeline: gsap.core.Timeline; restore: () => void };
/** The run currently typing each element. */
const runs = new WeakMap<HTMLElement, Run>();

/** Stops the run typing `element` and restores it. Call it after killing a parent timeline. */
export function revertTyping(element: HTMLElement): void {
  const run = runs.get(element);
  if (!run) return;
  runs.delete(element);
  run.timeline.kill();
  run.restore();
}

/**
 * Lays an aria-hidden overlay over the element, whose own content stays in place at opacity 0
 * so its size never changes. Returns the overlay's text node, its caret, and a restore.
 */
function overlay(element: HTMLElement, withCaret: boolean) {
  const position = [element.style.getPropertyValue("position"), element.style.getPropertyPriority("position")] as const;
  if (getComputedStyle(element).position === "static") element.style.position = "relative";
  const source = document.createElement("span");
  source.style.opacity = "0";
  source.append(...Array.from(element.childNodes));
  const layer = document.createElement("span");
  layer.setAttribute("aria-hidden", "true");
  Object.assign(layer.style, { position: "absolute", inset: "0", padding: "inherit", boxSizing: "border-box", whiteSpace: "pre-line", pointerEvents: "none" });
  const typed = document.createTextNode("");
  const caret = withCaret ? makeCaret() : undefined;
  layer.append(typed, ...(caret ? [caret] : []));
  element.append(source, layer);
  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    layer.remove();
    source.replaceWith(...Array.from(source.childNodes));
    if (position[0]) element.style.setProperty("position", position[0], position[1]);
    else element.style.removeProperty("position");
  };
  return { typed, caret, restore };
}

/** Steps `count` from `from` to `to`, one character per beat, writing each frame. Reversible. */
function typeSteps(tl: gsap.core.Timeline, beats: number[], write: (n: number) => void, forward: boolean): void {
  const state = { n: forward ? 0 : beats.length };
  beats.forEach((beat, i) => {
    const target = forward ? i + 1 : beats.length - 1 - i;
    tl.to(state, { n: target, duration: beat, ease: "steps(1)", onUpdate: () => write(Math.round(state.n)) });
  });
}

/** Blinks the caret `count` times, then hides it. Solid while typing. */
function blinkOut(tl: gsap.core.Timeline, caret: HTMLElement | undefined, count: number): void {
  if (!caret) return;
  for (let i = 0; i < count; i++) {
    tl.set(caret, { autoAlpha: 0 }, `+=${BLINK / 2}`).set(caret, { autoAlpha: 1 }, `+=${BLINK / 2}`);
  }
  tl.set(caret, { autoAlpha: 0 }, `+=${BLINK / 2}`);
}

function typeRun(entering: boolean) {
  return (element: HTMLElement | null, { delay = 0, onComplete, speed = 22, caret = true, blinks = entering ? 2 : 0 }: TypeOptions = {}) => {
    const tl = gsap.timeline({ delay, defaults: { overwrite: "auto" } });
    if (!element) return onComplete ? tl.eventCallback("onComplete", onComplete) : tl;
    revertTyping(element);
    if (prefersReducedMotion()) {
      if (onComplete) tl.eventCallback("onComplete", onComplete);
      return tl.set(element, { autoAlpha: entering ? 1 : 0 });
    }
    let restore = () => {};
    return guarded(
      () => {
        const text = plainText(element);
        const made = overlay(element, caret);
        restore = made.restore;
        const run = { timeline: tl, restore };
        runs.set(element, run);
        const release = () => {
          if (runs.get(element) !== run) return;
          runs.delete(element);
          restore();
        };
        const write = (n: number) => {
          made.typed.data = text.slice(0, n);
        };
        write(entering ? 0 : text.length);
        tl.set(element, { autoAlpha: 1 }, 0);
        typeSteps(tl, rhythm(text, entering ? speed : speed * 2), write, entering);
        blinkOut(tl, made.caret, blinks);
        if (!entering) tl.set(element, { autoAlpha: 0 });
        tl.eventCallback("onComplete", () => {
          release();
          onComplete?.();
        });
        tl.eventCallback("onInterrupt", release);
        return tl;
      },
      () => {
        runs.delete(element);
        restore();
      },
    );
  };
}

/** Types the element's text in. */
export const typeIn = typeRun(true);
/** Deletes the element's text, last character first, at twice the speed, then hides it. */
export const typeOut = typeRun(false);
