// Page progress: a rule along the top that grows with scroll. Foreground on
// the canvas; over an accent field it takes that scene's ink (an accent rule
// would vanish into its own field) and thickens to the frames' 2px.
// It reports state, so it runs under reduced motion too.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fieldProbes } from './scenes';

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

  // Which field is under the rule. Scrubbed washes keep moving after scrolling stops, so check per frame.
  let ink = '';
  gsap.ticker.add(() => {
    const probe = fieldProbes().find((f) => f.covers(0.5));
    const next = probe ? probe.ink() : '';
    if (next === ink) return;
    ink = next;
    rule.classList.toggle('is-on-field', Boolean(probe));
    rule.style.setProperty('--progress-ink', next || 'var(--color-foreground)');
  });
}
