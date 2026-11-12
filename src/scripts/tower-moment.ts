// Campaign Tower's signature moment: the tower builds itself floor by floor,
// bottom to top. Each floor drops into place in pixel steps and fills in cell
// by cell; the lift hops up the shaft a floor at a time as each one lands.
// Stepped easing throughout, no smoothing, to match the pixel art.
//
// One paused GSAP timeline positioned by the scene's moment (src/lib/moments.ts),
// so replays and the settled state line up. Without JavaScript the markup is
// the finished tower.
import gsap from 'gsap';
import { TOWER } from '../lib/motion';
import { onMoment } from '../lib/moments';

export function mountTower(root: HTMLElement): void {
  const id = root.closest<HTMLElement>('[data-scene]')?.id;
  const lift = root.querySelector<HTMLElement>('[data-tower-lift]');
  if (!id || !lift) return;
  // Markup runs top to bottom; the tower builds bottom to top.
  const floors = Array.from(root.querySelectorAll<HTMLElement>('[data-tower-floor]')).reverse();
  const count = floors.length;
  if (count === 0) return;

  const tl = gsap.timeline({ paused: true });
  const [b0, b1] = TOWER.build;
  const slot = (b1 - b0) / count;
  // The lift starts on the ground floor: (count - 1) floors below its parked spot.
  const liftHop = 100 * TOWER.liftPerFloor;
  tl.set(lift, { yPercent: (count - 1) * liftHop }, 0);

  floors.forEach((floor, i) => {
    const at = b0 + i * slot;
    const cells = Array.from(floor.querySelectorAll<HTMLElement>('[data-tower-cell]'));
    tl.fromTo(
      floor,
      { autoAlpha: 0, yPercent: -50 },
      { autoAlpha: 1, yPercent: 0, duration: slot * 0.3, ease: `steps(${TOWER.dropSteps})` },
      at
    );
    const cellTime = (slot * TOWER.cellsShare) / Math.max(1, cells.length);
    cells.forEach((cell, c) => {
      tl.fromTo(cell, { autoAlpha: 0 }, { autoAlpha: 1, duration: cellTime, ease: 'steps(1)' }, at + slot * 0.2 + c * cellTime);
    });
    // Once a floor above the ground is in, the lift hops up to it.
    if (i > 0) {
      tl.to(
        lift,
        { yPercent: (count - 1 - i) * liftHop, duration: slot * 0.4, ease: `steps(${TOWER.liftSteps})` },
        at + slot * 0.5
      );
    }
  });
  tl.set({}, {}, 1);

  onMoment(id, (p) => tl.progress(p));
}
