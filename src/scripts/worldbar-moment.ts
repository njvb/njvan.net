// WorldBar's signature moment: three plates cut from the real capture fall in angled and apart,
// then close into the whole popover, which turns almost face-on. The plates are flat 2D: one
// matrix each (rotate, squash, lift), the same maths as the /worldbar/ hero, so Chrome and Safari
// match and no 3D context is needed.
//
// The moment's progress (src/lib/moments.ts) drives everything, so scrubbing and replays line up.
// Under reduced motion the progress is 1 and the popover shows closed. Values: WORLDBAR_SCENE.
import gsap from 'gsap';
import { WORLDBAR_SCENE as WS } from '../lib/motion';
import { onMoment } from '../lib/moments';

const RAD = Math.PI / 180;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const span = (p: number, [a, b]: readonly [number, number]) => clamp01((p - a) / (b - a));

export function mountWorldbar(root: HTMLElement): void {
  const id = root.closest<HTMLElement>('[data-scene]')?.id;
  const box = root.querySelector<HTMLElement>('[data-wbs-box]');
  const slabs = Array.from(root.querySelectorAll<HTMLElement>('[data-wbs-slab]'));
  const chips = Array.from(root.querySelectorAll<HTMLElement>('[data-wbs-chip]'));
  if (!id || !box || slabs.length !== 3) return;
  const ease = gsap.parseEase(WS.ease);

  slabs.forEach((s) => (s.style.transformOrigin = '0 0'));

  // Live local times on the pills.
  const fmt = new Map<string, Intl.DateTimeFormat>();
  const tick = () => {
    for (const c of chips) {
      const tz = c.dataset.tz ?? 'UTC';
      let f = fmt.get(tz);
      if (!f) {
        f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
        fmt.set(tz, f);
      }
      const b = c.querySelector('b');
      if (b) b.textContent = f.format(new Date());
    }
  };
  tick();
  window.setInterval(tick, 15000);

  let p = 0;
  const render = () => {
    const W = box.clientWidth;
    const H = box.clientHeight;
    if (!W) return;
    const q = ease(span(p, WS.assemble));
    const g = lerp(WS.from.gap, WS.to.gap, q);
    const th = lerp(WS.from.rz, WS.to.rz, q) * RAD;
    const ph = lerp(WS.from.rx, WS.to.rx, q) * RAD;
    const a = Math.cos(th);
    const b = Math.sin(th) * Math.cos(ph);
    const c = -Math.sin(th);
    const d = Math.cos(th) * Math.cos(ph);
    const lift = Math.sin(ph);
    const cx = W / 2;
    const cy = H / 2;
    const w = slabs[0]!.offsetWidth;
    const top0 = (H - (w * 1404) / 756) / 2;
    const tops = [top0 + (w * 842) / 756, top0 + (w * 640) / 756, top0];
    const dx = -w / 2;
    // A small scale as the plates lock together.
    const s = 1 + WS.settle.scale * Math.sin(Math.PI * span(p, WS.settle.span));
    const fade = span(p, WS.fade);
    slabs.forEach((el, i) => {
      const dy = tops[i]! - cy;
      const e = cx + a * dx + c * dy;
      const f = cy + b * dx + d * dy - H * 0.04 - i * g * W * lift;
      el.style.transform = `translate(${cx}px, ${cy}px) scale(${s}) translate(${-cx}px, ${-cy}px) matrix(${a},${b},${c},${d},${e},${f})`;
      el.style.opacity = String(fade);
    });
    // Plate shadows and edge lines die away before the plates touch; corners square off as they close.
    const lit = Math.pow(Math.min(1, g / 0.06), 2);
    box.style.setProperty('--lit', String(lit));
    box.style.setProperty('--ri', `${Math.min(1, g / 0.02) * 1.6}cqi`);
    const chipFade = span(p, WS.chips);
    chips.forEach((el) => (el.style.opacity = String(chipFade)));
  };

  onMoment(id, (v) => {
    p = v;
    render();
  });
  window.addEventListener('resize', render);
}
