// Kora's signature moment, after kora-os.com's own hero: the overview screen
// slides in, Ask Kora pops out over its corner, the site's question types
// itself, the answer arrives word by word with its sources, and the off-track
// bar it describes is outlined in the screen.
//
// One paused GSAP timeline positioned by the scene's moment (src/lib/moments.ts),
// like Cotrip and Campaign Tower, so replays and the settled state (reduced
// motion, a failed setup) line up exactly. Without JavaScript the markup is the
// settled layout.
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { TextPlugin } from 'gsap/TextPlugin';
import { KORA } from '../lib/motion';
import { onMoment } from '../lib/moments';

gsap.registerPlugin(SplitText, TextPlugin);

const span = ([a, b]: [number, number]) => ({ at: a, duration: b - a });

export function mountKora(root: HTMLElement): void {
  const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel);
  const id = root.closest<HTMLElement>('[data-scene]')?.id;
  const screen = $<HTMLElement>('[data-kora-screen]');
  const mark = $<HTMLElement>('[data-kora-mark]');
  const ask = $<HTMLElement>('[data-kora-ask]');
  const caret = $<HTMLElement>('[data-kora-caret]');
  const question = $<HTMLElement>('[data-kora-question]');
  const answer = $<HTMLElement>('[data-kora-answer]');
  const sources = $<HTMLElement>('[data-kora-sources]');
  if (!id || !screen || !mark || !ask || !caret || !question || !answer || !sources) return;
  const text = question.textContent ?? '';
  // The visual is aria-hidden, so the answer can stay split for good.
  const words = SplitText.create(answer, { type: 'words' }).words as HTMLElement[];

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });

  const sc = span(KORA.screen);
  tl.fromTo(screen, { xPercent: 8, opacity: 0 }, { xPercent: 0, opacity: 1, duration: sc.duration, ease: 'power3.out' }, sc.at);

  const ap = span(KORA.askPop);
  tl.fromTo(
    ask,
    { scale: 0.7, opacity: 0, transformOrigin: '0% 100%' },
    { scale: 1, opacity: 1, duration: ap.duration, ease: 'back.out(2)' },
    ap.at
  );

  const ty = span(KORA.type);
  tl.fromTo(caret, { opacity: 0 }, { opacity: 1, duration: 0.005 }, ty.at);
  tl.fromTo(question, { text: '' }, { text, duration: ty.duration }, ty.at);
  tl.to(caret, { opacity: 0, duration: 0.005 }, ty.at + ty.duration + 0.02);

  const an = span(KORA.answer);
  tl.fromTo(
    words,
    { opacity: 0, y: 4 },
    { opacity: 1, y: 0, duration: an.duration * 0.35, ease: 'power2.out', stagger: (an.duration * 0.65) / Math.max(1, words.length) },
    an.at
  );

  const so = span(KORA.sources);
  tl.fromTo(sources, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: so.duration, ease: 'power2.out' }, so.at);

  const mk = span(KORA.mark);
  tl.fromTo(
    mark,
    { opacity: 0, scale: 1.25, transformOrigin: '50% 50%' },
    { opacity: 1, scale: 1, duration: mk.duration, ease: 'back.out(2)' },
    mk.at
  );
  tl.set({}, {}, 1);

  onMoment(id, (p) => tl.progress(p));
}
