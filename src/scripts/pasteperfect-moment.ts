// PastePerfect's signature moment: the real window lands, tracking chips appear on it and are
// crossed out, then flung away while the link under it sheds its tracking tail. Driven by the
// moment's progress (src/lib/moments.ts), so scrubbing and replays line up. Under reduced motion
// the progress is 1 and the frame is settled (no chips, clean link). Values: PASTEPERFECT_SCENE.
import gsap from 'gsap';
import { PASTEPERFECT_SCENE as PS } from '../lib/motion';
import { onMoment } from '../lib/moments';

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const span = (p: number, [a, b]: readonly [number, number]) => clamp01((p - a) / (b - a));

export function mountPasteperfect(root: HTMLElement): void {
  const id = root.closest<HTMLElement>('[data-scene]')?.id;
  const win = root.querySelector<HTMLElement>('[data-pps-win]');
  const chips = Array.from(root.querySelectorAll<HTMLElement>('[data-pps-chip]'));
  const link = root.querySelector<HTMLElement>('[data-pps-link]');
  const tail = root.querySelector<HTMLElement>('[data-pps-tail]');
  if (!id || !win || !link || !tail) return;
  const ease = gsap.parseEase(PS.ease);

  // The tail's natural width, measured while it is allowed to be as wide as it likes.
  let tailW = 0;
  const measure = () => {
    const keep = tail.style.maxWidth;
    tail.style.maxWidth = 'none';
    tailW = tail.scrollWidth;
    tail.style.maxWidth = keep;
  };

  let p = 0;
  const render = () => {
    const w = ease(span(p, PS.window));
    win.style.opacity = String(w);
    win.style.transform = `translateY(${(1 - w) * 70}px) rotate(${(1 - w) * -3}deg)`;

    const cin = span(p, PS.chipsIn);
    const strike = span(p, PS.strike);
    const fling = ease(span(p, PS.fling));
    chips.forEach((el, i) => {
      const side = el.className.includes('--1') || el.className.includes('--3') ? 1 : -1;
      // Chips come in one after another, then leave in the same order.
      const k = clamp01(cin * 1.6 - i * 0.15);
      const gone = clamp01(fling * 1.4 - i * 0.1);
      const dx = side * gone * 260;
      const dy = -gone * (60 + i * 30);
      el.style.opacity = String(k * (1 - gone));
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(${side * gone * 18}deg) scale(${0.7 + 0.3 * k - gone * 0.3})`;
      el.style.setProperty('--x', String(clamp01(strike * 1.4 - i * 0.08)));
    });

    // The link: the tail appears, is struck through, then folds away.
    const lin = span(p, PS.link);
    const ls = span(p, PS.linkStrike);
    const fold = ease(span(p, PS.linkFold));
    if (!tailW) measure();
    link.style.opacity = String(Math.max(lin, 0));
    tail.style.maxWidth = `${tailW * clamp01(lin) * (1 - fold)}px`;
    tail.style.opacity = String(clamp01(lin) * (1 - fold));
    tail.style.textDecoration = ls > 0 && fold < 1 ? 'line-through' : 'none';
  };

  onMoment(id, (v) => {
    p = v;
    render();
  });
  window.addEventListener('resize', () => {
    tailW = 0;
    render();
  });
}
