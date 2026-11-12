// Cotrip's signature moment: the map grid fades in, the route draws itself
// (SVG strokeDashoffset), each pin drops as the line reaches it, the dotted
// leg draws on to the destination, and the phones stack in beside the map.
//
// One paused GSAP timeline, positioned by the scene's moment progress
// (src/lib/moments.ts), so replays and the settled state (reduced motion, a
// failed setup) line up exactly. Without JavaScript the markup is the settled map.
import gsap from 'gsap';
import { COTRIP } from '../lib/motion';
import { onMoment } from '../lib/moments';

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

export function mountCotrip(root: HTMLElement): void {
  const id = root.closest<HTMLElement>('[data-scene]')?.id;
  const grid = root.querySelector<SVGPathElement>('[data-cotrip-grid]');
  const route = root.querySelector<SVGPathElement>('[data-cotrip-route]');
  const reveal = root.querySelector<SVGPathElement>('[data-cotrip-ahead-reveal]');
  const destination = root.querySelector<SVGCircleElement>('[data-cotrip-destination]');
  const back = root.querySelector<HTMLElement>('[data-cotrip-phone-back]');
  const front = root.querySelector<HTMLElement>('[data-cotrip-phone]');
  if (!id || !grid || !route || !reveal || !destination || !back || !front) return;
  const pins = Array.from(root.querySelectorAll<SVGCircleElement>('[data-cotrip-pin]'));
  const labels = Array.from(root.querySelectorAll<HTMLElement>('[data-cotrip-label]'));

  const routeLength = route.getTotalLength();
  const revealLength = reveal.getTotalLength();
  gsap.set(route, { strokeDasharray: routeLength });
  gsap.set(reveal, { strokeDasharray: revealLength });

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  const g = span(COTRIP.grid);
  tl.fromTo(grid, { opacity: 0 }, { opacity: 1, duration: g.duration }, g.at);

  const r = span(COTRIP.route);
  tl.fromTo(route, { strokeDashoffset: routeLength }, { strokeDashoffset: 0, duration: r.duration, ease: 'sine.inOut' }, r.at);
  const routeEase = gsap.parseEase('sine.inOut');

  pins.forEach((pin, i) => {
    // The moment the line reaches this pin: invert the route's ease at the pin's fraction.
    const f = fractionNear(route, Number(pin.getAttribute('cx')), Number(pin.getAttribute('cy')));
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 20; k++) {
      const mid = (lo + hi) / 2;
      if (routeEase(mid) < f) lo = mid;
      else hi = mid;
    }
    const at = Math.max(0, r.at + lo * r.duration - COTRIP.pinDrop * 0.3);
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

  const a = span(COTRIP.ahead);
  tl.fromTo(reveal, { strokeDashoffset: revealLength }, { strokeDashoffset: 0, duration: a.duration, ease: 'power1.inOut' }, a.at);
  const d = span(COTRIP.destination);
  tl.fromTo(
    destination,
    { scale: 0, opacity: 0, transformOrigin: '50% 50%' },
    { scale: 1, opacity: 1, duration: d.duration, ease: 'back.out(2.2)' },
    d.at
  );

  // The back phone is a translucent ink shadow: it lands on its own CSS opacity, not 1.
  const backOpacity = Number(getComputedStyle(back).opacity) || 1;
  const pb = span(COTRIP.phoneBack);
  tl.fromTo(
    back,
    { xPercent: 30, rotation: 14, opacity: 0 },
    { xPercent: 0, rotation: 6, opacity: backOpacity, duration: pb.duration, ease: 'power3.out' },
    pb.at
  );
  const pf = span(COTRIP.phoneFront);
  tl.fromTo(front, { yPercent: 12, opacity: 0 }, { yPercent: 0, opacity: 1, duration: pf.duration, ease: 'power3.out' }, pf.at);
  tl.set({}, {}, 1);

  onMoment(id, (p) => tl.progress(p));
}
