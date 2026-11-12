// The `reactor` treatment from the Animaxxing `particle-effects` recipe:
// sparks spiral into the button, which pops in; embers rise from it at rest.
import gsap from "gsap";
import { perimeterPoint } from "./field";
import type { ParticleEffectDefinition, ParticleEffectInstance } from "./attach";

const rnd = gsap.utils.random;
export type ButtonEffect = ParticleEffectDefinition<ParticleEffectInstance> & { layer: "under" | "over" };

const EMBER_RATE = { idle: 9, hover: 70 };
const EMBER_RISE = { idle: 55, hover: 220 };
const PULSE_EVERY = 2.6;

export const reactor: ButtonEffect = {
  layer: "under",
  bleed: 180,
  create(field, button) {
    const state = { rate: EMBER_RATE.idle, rise: EMBER_RISE.idle, hovering: false };
    let emberAcc = 0;
    let pulseIn = 1.2;
    let echoes: gsap.core.Tween[] = [];
    let swell: gsap.core.Tween | undefined;

    const ambient = (dt: number) => {
      const { box } = field;
      // Embers start inside the button, hidden behind it, and surface as they rise past its top edge.
      emberAcc += state.rate * dt;
      while (emberAcc >= 1) {
        emberAcc -= 1;
        field.spawn({
          x: box.x + rnd(4, box.w - 4), y: box.y + rnd(2, box.h - 2),
          vx: rnd(-10, 10) * (state.hovering ? 3 : 1), vy: -rnd(state.rise * 0.6, state.rise * 1.3),
          size: rnd(1.2, 2.8), alpha: rnd(0.7, 1), life: rnd(1.1, 2.1), gravity: -12,
          wobble: rnd(6, 16), wobbleFreq: rnd(1.5, 4), phase: rnd(0, Math.PI * 2),
        });
      }
      pulseIn -= dt;
      if (pulseIn <= 0) {
        pulseIn = PULSE_EVERY;
        if (!state.hovering) shockwave(28, 1.3, 0.35);
      }
    };

    function shockwave(spread: number, duration: number, alpha: number) {
      field.spawn({
        x: 0, y: 0, shape: "outline", size: 0, alpha, life: duration,
        update: (p) => { p.size = spread * gsap.parseEase("power2.out")(p.age / p.life); },
      });
    }

    function erupt(count: number, speed: [number, number]) {
      const { box, radius } = field;
      for (let i = 0; i < count; i++) {
        const pt = perimeterPoint(box, radius, Math.random());
        const v = rnd(speed[0], speed[1]);
        const jitter = rnd(-0.5, 0.5);
        const square = Math.random() < 0.35;
        field.spawn({
          x: pt.x, y: pt.y,
          vx: (pt.nx + jitter * pt.ny) * v, vy: (pt.ny - jitter * pt.nx) * v - 40,
          size: square ? rnd(1.5, 3) : rnd(1, 2.4), shape: square ? "square" : "dot",
          rotation: rnd(0, Math.PI), spin: rnd(-12, 12), life: rnd(0.5, 1.1), drag: 0.12, gravity: 320,
        });
      }
    }

    return {
      enter(delay) {
        field.sync();
        field.particles.length = 0;
        const { box } = field;
        const cx = box.x + box.w / 2;
        const cy = box.y + box.h / 2;
        const tl = gsap.timeline({ delay });
        gsap.set(button, { autoAlpha: 0, scale: 0.5, transformOrigin: "50% 50%" });

        const count = 110;
        for (let i = 0; i < count; i++) {
          const orbit = { radius: rnd(200, 320), angle: rnd(0, Math.PI * 2) };
          const landing = { x: rnd(-box.w * 0.4, box.w * 0.4), y: rnd(-box.h * 0.4, box.h * 0.4) };
          const p = field.spawn({ x: cx + Math.cos(orbit.angle) * orbit.radius, y: cy + Math.sin(orbit.angle) * orbit.radius, size: rnd(1, 2.4), alpha: 0, life: Infinity, fade: false, shape: "spark" });
          const turn = rnd(1.2, 2.4) * (Math.random() < 0.5 ? -1 : 1);
          tl.to(
            orbit,
            {
              radius: 0, angle: orbit.angle + turn, duration: rnd(0.6, 0.9), ease: "power3.in",
              onUpdate() {
                const k = 1 - orbit.radius / 320;
                const nx = cx + landing.x * k + Math.cos(orbit.angle) * orbit.radius;
                const ny = cy + landing.y * k + Math.sin(orbit.angle) * orbit.radius;
                // Velocity only orients the spark's tail; position is set here.
                p.vx = (nx - p.x) * 60; p.vy = (ny - p.y) * 60;
                p.x = nx; p.y = ny;
                p.alpha = Math.min(1, this.progress() * 3);
              },
              onComplete: () => { p.life = 0.12; p.age = 0; p.fade = true; p.vx = 0; p.vy = 0; },
            },
            rnd(0, 0.2),
          );
        }
        tl.to(button, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "back.out(2.2)" }, 0.82);
        tl.call(() => { shockwave(60, 0.7, 0.9); erupt(44, [140, 320]); }, [], 0.84);
        tl.call(() => shockwave(90, 0.9, 0.5), [], 0.96);
        tl.call(() => field.addEmitter(ambient), [], 1.05);
        return tl;
      },
      exit() { field.removeEmitter(ambient); field.release(0.25); },
      blast() {
        field.removeEmitter(ambient);
        shockwave(120, 0.6, 1);
        echoes = [gsap.delayedCall(0.08, () => shockwave(160, 0.7, 0.6)), gsap.delayedCall(0.16, () => shockwave(200, 0.8, 0.3))];
        erupt(140, [400, 1000]);
      },
      idle() { field.addEmitter(ambient); },
      hover(on) {
        state.hovering = on;
        gsap.to(state, { rate: on ? EMBER_RATE.hover : EMBER_RATE.idle, rise: on ? EMBER_RISE.hover : EMBER_RISE.idle, duration: on ? 0.3 : 0.9, ease: on ? "power3.out" : "power2.inOut", overwrite: true });
        swell = gsap.to(button, { scale: on ? 1.04 : 1, duration: 0.3, ease: on ? "back.out(2)" : "power2.out", overwrite: "auto" });
        if (on) { shockwave(40, 0.5, 0.8); erupt(56, [160, 360]); }
      },
      destroy() {
        field.removeEmitter(ambient);
        gsap.killTweensOf(state);
        echoes.forEach((echo) => echo.kill());
        swell?.kill();
      },
    };
  },
};
