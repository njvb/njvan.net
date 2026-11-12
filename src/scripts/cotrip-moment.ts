// Cotrip's signature moment: ask TripTalk to change the plan, and watch it change.
//   1. The map grid fades in and the route draws itself (SVG strokeDashoffset),
//      a traveller dot riding its tip (MotionPath); each pin drops as it passes.
//   2. The phones stack in beside the map.
//   3. A question to TripTalk pops out of the phones and types itself.
//   4. TripTalk answers, the dotted leg draws on to the new stop, its pin opens
//      and its label rises.
//   5. One ping from "you are here".
//
// One paused GSAP timeline positioned by the scene's moment (src/lib/moments.ts),
// so replays and the settled state (reduced motion, a failed setup) line up
// exactly. Without JavaScript the markup is the settled map, chat included.
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { TextPlugin } from 'gsap/TextPlugin';
import { COTRIP } from '../lib/motion';
import { onMoment } from '../lib/moments';

gsap.registerPlugin(MotionPathPlugin, TextPlugin);

const span = ([a, b]: [number, number]) => ({ at: a, duration: b - a });

/** Where along a path (0 to 1) it passes closest to a point. */
function fractionNear(path: SVGPathElement, x: number, y: number): number {
  const length = path.getTotalLength();
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i <= 200; i++) {
    const p = path.getPointAtLength((i / 200) * length);
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestDistance) {
      bestDistance = d;
      best = i / 200;
    }
  }
  return best;
}

/** x in [0, 1] where ease(x) = y. */
function invert(ease: (t: number) => number, y: number): number {
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 20; k++) {
    const mid = (lo + hi) / 2;
    if (ease(mid) < y) lo = mid;
    else hi = mid;
  }
  return lo;
}

export function mountCotrip(root: HTMLElement): void {
  const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel);
  const id = root.closest<HTMLElement>('[data-scene]')?.id;
  const grid = $<SVGPathElement>('[data-cotrip-grid]');
  const route = $<SVGPathElement>('[data-cotrip-route]');
  const reveal = $<SVGPathElement>('[data-cotrip-ahead-reveal]');
  const destination = $<SVGCircleElement>('[data-cotrip-destination]');
  const destinationLabel = $<HTMLElement>('[data-cotrip-destination-label]');
  const traveller = $<SVGCircleElement>('[data-cotrip-traveller]');
  const ping = $<SVGCircleElement>('[data-cotrip-ping]');
  const back = $<HTMLElement>('[data-cotrip-phone-back]');
  const front = $<HTMLElement>('[data-cotrip-phone]');
  const ask = $<HTMLElement>('[data-cotrip-ask]');
  const askText = $<HTMLElement>('[data-cotrip-ask-text]');
  const caret = $<HTMLElement>('[data-cotrip-caret]');
  const reply = $<HTMLElement>('[data-cotrip-reply]');
  if (!id || !grid || !route || !reveal || !destination || !destinationLabel || !traveller || !ping) return;
  if (!back || !front || !ask || !askText || !caret || !reply) return;
  const pins = Array.from(root.querySelectorAll<SVGCircleElement>('[data-cotrip-pin]'));
  const labels = Array.from(root.querySelectorAll<HTMLElement>('[data-cotrip-label]'));
  const question = askText.textContent ?? '';

  const routeLength = route.getTotalLength();
  const revealLength = reveal.getTotalLength();
  gsap.set(route, { strokeDasharray: routeLength });
  gsap.set(reveal, { strokeDasharray: revealLength });
  // The back phone may carry its own CSS opacity: it lands there, not on 1.
  const backOpacity = Number(getComputedStyle(back).opacity) || 1;

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });

  // 1. Grid, route, traveller, pins.
  const g = span(COTRIP.grid);
  tl.fromTo(grid, { opacity: 0 }, { opacity: 1, duration: g.duration }, g.at);
  const r = span(COTRIP.route);
  const routeEase = 'sine.inOut';
  tl.fromTo(route, { strokeDashoffset: routeLength }, { strokeDashoffset: 0, duration: r.duration, ease: routeEase }, r.at);
  tl.fromTo(traveller, { opacity: 0 }, { opacity: 1, duration: 0.02 }, r.at);
  tl.fromTo(
    traveller,
    { motionPath: { path: route, align: route, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
    { motionPath: { path: route, align: route, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: r.duration, ease: routeEase },
    r.at
  );
  tl.to(traveller, { opacity: 0, duration: 0.03 }, r.at + r.duration - 0.02);
  const parsed = gsap.parseEase(routeEase);
  pins.forEach((pin, i) => {
    const f = fractionNear(route, Number(pin.getAttribute('cx')), Number(pin.getAttribute('cy')));
    const at = Math.max(0, r.at + invert(parsed, f) * r.duration - COTRIP.pinDrop * 0.3);
    tl.fromTo(
      pin,
      { y: -24, scale: 0.4, opacity: 0, transformOrigin: '50% 50%' },
      { y: 0, scale: 1, opacity: 1, duration: COTRIP.pinDrop, ease: 'back.out(2.5)' },
      at
    );
    const label = labels[i];
    if (label) {
      tl.fromTo(label, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: COTRIP.pinDrop, ease: 'power2.out' }, at + COTRIP.pinDrop * 0.6);
    }
  });

  // 2. Phones.
  const pb = span(COTRIP.phoneBack);
  tl.fromTo(
    back,
    { xPercent: 30, rotation: 14, opacity: 0 },
    { xPercent: 0, rotation: 6, opacity: backOpacity, duration: pb.duration, ease: 'power3.out' },
    pb.at
  );
  const pf = span(COTRIP.phoneFront);
  tl.fromTo(front, { yPercent: 12, opacity: 0 }, { yPercent: 0, opacity: 1, duration: pf.duration, ease: 'power3.out' }, pf.at);

  // 3. Ask TripTalk: the bubble pops out, then the question types itself behind a caret.
  const ap = span(COTRIP.askPop);
  tl.fromTo(
    ask,
    { scale: 0.6, opacity: 0, transformOrigin: '100% 100%' },
    { scale: 1, opacity: 1, duration: ap.duration, ease: 'back.out(2)' },
    ap.at
  );
  const at = span(COTRIP.askType);
  tl.fromTo(caret, { opacity: 0 }, { opacity: 1, duration: 0.005 }, at.at);
  tl.fromTo(askText, { text: '' }, { text: question, duration: at.duration, ease: 'none' }, at.at);
  tl.to(caret, { opacity: 0, duration: 0.005 }, at.at + at.duration + 0.01);

  // 4. The answer, and the plan changing.
  const rp = span(COTRIP.reply);
  tl.fromTo(
    reply,
    { scale: 0.6, opacity: 0, transformOrigin: '0% 100%' },
    { scale: 1, opacity: 1, duration: rp.duration, ease: 'back.out(2)' },
    rp.at
  );
  const a = span(COTRIP.ahead);
  tl.fromTo(reveal, { strokeDashoffset: revealLength }, { strokeDashoffset: 0, duration: a.duration, ease: 'power1.inOut' }, a.at);
  const d = span(COTRIP.destination);
  tl.fromTo(
    destination,
    { scale: 0, opacity: 0, transformOrigin: '50% 50%' },
    { scale: 1, opacity: 1, duration: d.duration, ease: 'back.out(2.2)' },
    d.at
  );
  tl.fromTo(destinationLabel, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: d.duration, ease: 'power2.out' }, d.at + d.duration * 0.5);

  // 5. One ping from "you are here". It ends invisible, so the settled map is unchanged.
  const pg = span(COTRIP.ping);
  // Hidden until its turn (a fromTo applies its start values straight away).
  tl.fromTo(ping, { opacity: 0, scale: 1, transformOrigin: '50% 50%' }, { opacity: 0.9, duration: 0.001 }, pg.at);
  tl.to(ping, { scale: 2.6, opacity: 0, duration: pg.duration - 0.001, ease: 'power2.out' }, pg.at + 0.001);
  tl.set({}, {}, 1);

  onMoment(id, (p) => tl.progress(p));
}
