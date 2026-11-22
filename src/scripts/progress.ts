// Page progress: a rule along the top that grows with scroll, foreground on the canvas.
// It reports state, so it runs under reduced motion too.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupProgress(): void {
  const rule = document.querySelector<HTMLElement>('[data-progress]');
  const bar = rule?.querySelector<HTMLElement>('[data-progress-bar]');
  if (!rule || !bar) return;
  rule.hidden = false;

  const setScale = gsap.quickSetter(bar, 'scaleX');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => setScale(self.progress),
    onRefresh: (self) => setScale(self.progress),
  });
}
