// The stage: opens a project's scene from its card. The card grows to fill the screen in the
// project's accent, the scene's sequence plays (name rises behind its mask, copy and visual rise
// in), then its signature moment plays. Prev / Next, the pills and the arrow keys move between
// projects with a colour wipe; Esc or the close button shrinks the scene back into its card.
// Every project has its own address (njvan.net/#cotrip): it opens on load, Back closes it.
// Timings live in src/lib/motion.ts (STAGE, SCENE). Reduced motion: no growing or wiping, the
// scene simply appears, settled.
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { ANIMAXXING_CURVE, SCENE, SHIFT, STAGE } from '../lib/motion';
import { prefersReducedMotion } from '../lib/effects/util';
import { momentReady, preload, setMoment } from '../lib/moments';

gsap.registerPlugin(SplitText, CustomEase);
CustomEase.create('animaxxing', ANIMAXXING_CURVE);

type Scene = {
  id: string;
  el: HTMLElement;
  inner: HTMLElement;
  name: HTMLElement;
  rise: HTMLElement[];
  visual: HTMLElement | null;
  split: SplitText | null;
  intro: gsap.core.Timeline | null;
  tween: gsap.core.Tween | null;
  ticket: number;
};

const reduced = prefersReducedMotion();
const $ = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));
const PAGE_PARTS = '[data-hero], #projects, .site-header, .site-footer, .progress';

export function setupStage(): void {
  const stage = $<HTMLElement>('[data-stage]');
  if (!stage) return;
  const scenes: Scene[] = $$<HTMLElement>('[data-scene]', stage).flatMap((el) => {
    const inner = $<HTMLElement>('.scene__inner', el);
    const name = $<HTMLElement>('[data-scene-name]', el);
    if (!inner || !name) return [];
    return [
      {
        id: el.id,
        el,
        inner,
        name,
        rise: $$<HTMLElement>('[data-scene-rise]', el).filter((n) => !n.classList.contains('scene__top')),
        visual: $<HTMLElement>('[data-scene-visual]', el),
        split: null,
        intro: null,
        tween: null,
        ticket: 0,
      },
    ];
  });
  if (scenes.length === 0) return;
  const byId = (id: string | null) => scenes.find((s) => s.id === id) ?? null;
  const ids = scenes.map((s) => s.id);
  const closeBtn = $<HTMLElement>('[data-stage-close]', stage);
  const bar = $<HTMLElement>('[data-stage-bar]', stage);
  const pills = $$<HTMLElement>('[data-stage-pill]', stage);

  let current: Scene | null = null;
  let entering: Scene | null = null;
  let busy = false;
  let pushed = false;
  let opener: HTMLElement | null = null;

  /* ---------- a scene's own sequence ---------- */

  const hideParts = (s: Scene) => {
    if (reduced) return;
    gsap.set(s.rise, { opacity: 0, y: SHIFT.page });
    if (s.visual) gsap.set(s.visual, { opacity: 0, y: SHIFT.page });
  };
  scenes.forEach((s) => {
    hideParts(s);
    setMoment(s.id, reduced ? 1 : 0);
  });

  const resetScene = (s: Scene) => {
    s.ticket++;
    s.tween?.kill();
    s.tween = null;
    s.intro?.kill();
    s.intro = null;
    s.split?.revert();
    s.split = null;
    gsap.set(s.inner, { clearProps: 'opacity,transform' });
    hideParts(s);
    setMoment(s.id, reduced ? 1 : 0);
  };

  const playMoment = (s: Scene) => {
    if (reduced) return setMoment(s.id, 1);
    const ticket = ++s.ticket;
    s.tween?.kill();
    setMoment(s.id, 0);
    const o = { p: 0 };
    void momentReady(s.id, SCENE.momentWait * 1000).then(() => {
      if (ticket !== s.ticket || (s !== current && s !== entering)) return;
      s.tween = gsap.to(o, {
        p: 1,
        duration: SCENE.momentLength[s.id] ?? SCENE.moment.duration,
        ease: 'none',
        delay: STAGE.intro.moment,
        onUpdate: () => setMoment(s.id, o.p),
      });
    });
  };

  const playIntro = (s: Scene) => {
    if (reduced) return playMoment(s);
    const mark = $<HTMLElement>('[data-scene-mark]', s.name);
    let lines: Element[];
    if (mark) lines = [mark];
    else {
      s.split = SplitText.create(s.name, { type: 'lines', mask: 'lines', aria: 'auto' });
      for (const mask of s.split.masks) (mask as HTMLElement).classList.add('scene-line-mask');
      lines = s.split.lines;
    }
    const tl = gsap.timeline();
    tl.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: SCENE.nameIn.duration, ease: 'power3.out', stagger: SCENE.nameIn.stagger }, STAGE.intro.name);
    tl.fromTo(s.rise, { opacity: 0, y: SHIFT.page }, { opacity: 1, y: 0, duration: SCENE.riseIn.duration, ease: 'power2.out', stagger: SCENE.riseIn.stagger }, STAGE.intro.rise);
    if (s.visual) tl.fromTo(s.visual, { opacity: 0, y: SHIFT.page }, { opacity: 1, y: 0, duration: SCENE.visualIn.duration, ease: 'power2.out' }, STAGE.intro.visual);
    s.intro = tl;
    playMoment(s);
  };

  /* ---------- helpers ---------- */

  const styleOf = (s: Scene) => {
    const cs = getComputedStyle(s.el);
    return { field: cs.getPropertyValue('--field').trim(), on: cs.getPropertyValue('--on').trim() };
  };

  const markPills = (id: string) => pills.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.stagePill === id)));

  const setInert = (on: boolean) => $$<HTMLElement>(PAGE_PARTS).forEach((el) => (on ? el.setAttribute('inert', '') : el.removeAttribute('inert')));

  const cardRect = (id: string): DOMRect | null => {
    const card = $<HTMLElement>(`[data-open-project="${id}"]`);
    const r = card?.getBoundingClientRect();
    if (!r || r.bottom < 0 || r.top > innerHeight) return null;
    return r;
  };

  const vw = () => document.documentElement.clientWidth;
  const inset = (r: DOMRect | null) => {
    if (!r) {
      const w = vw();
      return `inset(${innerHeight * 0.5}px ${w * 0.5}px ${innerHeight * 0.5}px ${w * 0.5}px round ${STAGE.radius}px)`;
    }
    return `inset(${r.top}px ${vw() - r.right}px ${innerHeight - r.bottom}px ${r.left}px round ${STAGE.radius}px)`;
  };
  const FULL = 'inset(0px 0px 0px 0px round 0px)';

  const hashId = () => {
    let h = location.hash.slice(1);
    try {
      h = decodeURIComponent(h);
    } catch {
      // A malformed link: use it as written.
    }
    return ids.includes(h) ? h : null;
  };

  /* ---------- open, switch, close ---------- */

  const open = (id: string, from: HTMLElement | null) => {
    const s = byId(id);
    if (!s || busy || current) return;
    busy = true;
    current = s;
    opener = from;
    const { field, on } = styleOf(s);
    stage.style.setProperty('--field', field);
    stage.style.setProperty('--on', on);
    stage.classList.add('is-open');
    scenes.forEach((x) => x.el.classList.toggle('is-current', x === s));
    s.el.scrollTop = 0;
    markPills(id);
    setInert(true);
    preload(id);
    if (reduced) {
      playIntro(s);
      busy = false;
    } else {
      gsap.fromTo(
        stage,
        { clipPath: inset(cardRect(id)) },
        { clipPath: FULL, duration: STAGE.open.duration, ease: 'animaxxing', clearProps: 'clipPath', onComplete: () => (busy = false) }
      );
      if (bar) gsap.fromTo(bar, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.4, delay: STAGE.bar, ease: 'power2.out', clearProps: 'opacity,transform' });
      playIntro(s);
    }
    closeBtn?.focus({ preventScroll: true });
  };

  const swap = (id: string, dir: 1 | -1) => {
    const next = byId(id);
    const prev = current;
    if (!next || !prev || busy || next === prev) return;
    busy = true;
    entering = next;
    preload(id);
    const { field, on } = styleOf(next);
    markPills(id);
    next.el.classList.add('is-entering');
    next.el.scrollTop = 0;
    const done = () => {
      prev.el.classList.remove('is-current');
      next.el.classList.remove('is-entering');
      next.el.classList.add('is-current');
      gsap.set(next.el, { clearProps: 'clipPath' });
      resetScene(prev);
      current = next;
      entering = null;
      busy = false;
      stage.style.setProperty('--field', field);
      stage.style.setProperty('--on', on);
      history.replaceState(history.state, '', `#${id}`);
    };
    if (reduced) {
      done();
      playIntro(next);
      return;
    }
    gsap.to(stage, { '--on': on, duration: 0.5, ease: 'power2.out' });
    gsap.to(prev.inner, { x: -dir * STAGE.swap.slide, opacity: 0, duration: STAGE.swap.slideOut, ease: 'power2.in' });
    gsap.fromTo(
      next.el,
      { clipPath: dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: STAGE.swap.duration, ease: 'animaxxing', onComplete: done }
    );
    playIntro(next);
  };

  const go = (step: 1 | -1) => {
    if (!current) return;
    const i = ids.indexOf(current.id);
    swap(ids[(i + step + ids.length) % ids.length]!, step);
  };

  const finishClose = (s: Scene) => {
    stage.classList.remove('is-open');
    gsap.set(stage, { clearProps: 'clipPath' });
    s.el.classList.remove('is-current');
    resetScene(s);
    setInert(false);
    current = null;
    busy = false;
    pushed = false;
    const target = opener ?? $<HTMLElement>(`[data-open-project="${s.id}"]`);
    target?.focus({ preventScroll: true });
    opener = null;
  };

  const close = () => {
    const s = current;
    if (!s || busy) return;
    busy = true;
    stage.dataset.closing = '';
    if (reduced) {
      delete stage.dataset.closing;
      return finishClose(s);
    }
    gsap.to(s.inner, { opacity: 0, duration: STAGE.close.contentOut, ease: 'power1.in' });
    if (bar) gsap.to(bar, { opacity: 0, duration: STAGE.close.contentOut });
    gsap.to(stage, {
      clipPath: inset(cardRect(s.id)),
      duration: STAGE.close.duration,
      delay: STAGE.close.contentOut * 0.5,
      ease: 'power3.inOut',
      onComplete: () => {
        delete stage.dataset.closing;
        if (bar) gsap.set(bar, { clearProps: 'opacity' });
        finishClose(s);
      },
    });
  };

  /** The visitor asked to close: step back in history if this open added an entry, else just close and clear the hash. */
  const requestClose = () => {
    if (!current || busy) return;
    if (pushed) history.back();
    else {
      history.replaceState(null, '', location.pathname + location.search);
      close();
    }
  };

  /* ---------- wiring ---------- */

  for (const card of $$<HTMLAnchorElement>('[data-open-project]')) {
    const id = card.dataset.openProject!;
    const warm = () => preload(id);
    card.addEventListener('pointerenter', warm, { passive: true });
    card.addEventListener('focus', warm);
    card.addEventListener('touchstart', warm, { passive: true });
    card.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      if (busy || current) return;
      history.pushState({ stage: id }, '', `#${id}`);
      pushed = true;
      open(id, card);
    });
  }

  closeBtn?.addEventListener('click', requestClose);
  $('[data-stage-prev]', stage)?.addEventListener('click', () => go(-1));
  $('[data-stage-next]', stage)?.addEventListener('click', () => go(1));
  pills.forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.stagePill!;
      if (!current) return;
      swap(id, ids.indexOf(id) > ids.indexOf(current.id) ? 1 : -1);
    })
  );

  window.addEventListener('keydown', (e) => {
    if (!current) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      requestClose();
    } else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Tab') {
      const items = $$<HTMLElement>('button, a[href]', stage).filter((n) => n.offsetParent !== null && getComputedStyle(n).visibility !== 'hidden');
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Back and Forward follow the address.
  window.addEventListener('popstate', () => {
    const id = hashId();
    if (current && !id) {
      pushed = false;
      close();
    } else if (!current && id) open(id, null);
    else if (current && id && id !== current.id) swap(id, ids.indexOf(id) > ids.indexOf(current.id) ? 1 : -1);
  });

  // The projects' heavy parts load as the cards come near.
  const section = $<HTMLElement>('#projects');
  if (section) {
    new IntersectionObserver(
      (entries, io) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        preload('all');
      },
      { rootMargin: '150% 0px' }
    ).observe(section);
  }

  // A direct link (njvan.net/#cotrip) opens that project once the page has settled.
  const first = hashId();
  if (first) window.setTimeout(() => open(first, null), 500);
}
