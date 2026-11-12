// Every motion value on the site lives here. Mirrors design/Motion.md.
// Change a value here and in Motion.md together.

/** Durations in seconds. */
export const DURATION = {
  /** Hovers, presses, underline draws (range 100-180ms). */
  micro: 0.14,
  /** Chips, cards, menus (160-240ms). */
  component: 0.2,
  /** Panels and route changes (220-320ms). */
  page: 0.28,
} as const;

export const EASE = {
  /** Things arriving: fast, then settled. */
  entrance: 'power2.out',
  /** Things leaving: accelerate away, feel shorter. */
  exit: 'power2.in',
  /** Moves that start and end at rest. */
  shift: 'power2.inOut',
} as const;

/** The animaxxing curve, for large deliberate moves only: accent washes, Flip morphs, scene changes. Register with CustomEase. */
export const ANIMAXXING_CURVE = 'M0,0 C0.16,1 0.3,1 1,1';

/** Travel distance in px for rises. */
export const SHIFT = {
  micro: 4,
  component: 8,
  page: 16,
} as const;

/** Stagger in seconds for letters and list items. */
export const STAGGER = {
  tight: 0.03,
  loose: 0.05,
} as const;

/** Animated weight stays inside 400-800. */
export const WEIGHT = {
  rest: 400,
  emphasis: 600,
  display: 800,
} as const;

/** Scrubbed project moments follow the scroll with this lag. */
export const SCRUB = 0.6;

/** Below this width there is no pinning; scenes stack and moments play once in view. */
export const MOBILE_MAX = 767;

/**
 * Hero choreography (seconds from the start of the intro unless noted).
 * The tuning knobs for step 2. Recipe internals (per-letter tumbles, particle
 * physics) stay in src/lib/effects and are tuned there only if these are not enough.
 */
export const HERO = {
  /** Wordmark letters spring in from the start; the underline draws after them. */
  wordmarkUnderlineDelay: 0.25,
  wordmarkUnderlineDuration: 0.5,
  /** "Nathan VanderByl" scatters in from off screen and lands from here. */
  lettersDelay: 0.75,
  lettersDuration: 0.75,
  lettersStagger: 0.02,
  /** How far a letter starts from home, as a fraction of the viewport. */
  lettersSpread: 0.6,
  /** The subhead starts speaking. */
  speakDelay: 1.05,
  /** Subhead words that arrive letter by letter. */
  speakEmphasis: ['built'],
  /** The particle button starts assembling (speak start + 0.2s). */
  buttonDelay: 1.25,
  /** Supporting items (nav, meta row) rise after the letters start landing. */
  riseDelay: 0.89,
  riseDuration: 0.42,
  riseStagger: 0.09,
  /** Seconds between the starts of two passes of the letter wave. Each pass is a different move. */
  wavePeriod: 4,
  /** The hero blasts off when this point of the hero reaches the top of the viewport. */
  blastStart: '25% top',
} as const;

/**
 * Project scenes. On wide screens the page moves one scene per gesture, each
 * filling the viewport, then its sequence plays on its own time: wash, ink,
 * name, copy, then the signature moment. Times are seconds from the scene
 * becoming active.
 */
export const SCENE = {
  /** Scenes page and play where they have their frame layout and fit the viewport. */
  pageQuery: '(min-width: 1024px) and (min-height: 600px)',
  /**
   * Paging (src/scripts/pager.ts): from one screen above the first scene to the
   * footer, each wheel flick, swipe or arrow key moves exactly one stop.
   */
  pageDuration: 0.8,
  pageEase: 'power3.inOut',
  /** A gesture has ended once no wheel events arrive for this long (seconds); trackpad momentum is absorbed until then. */
  pageRest: 0.2,
  /** Wheel deltas smaller than this (px) never start a move. */
  pageTolerance: 4,
  /** A swipe pages once it has travelled this far (px). */
  swipeDistance: 30,
  /** Scrolled off a stop by other means (scrollbar, find, focus)? Settle onto the nearest after this pause (seconds). */
  settleDelay: 0.18,
  /** A scene is active while its middle band holds the viewport's middle. */
  activeStart: 'top 55%',
  activeEnd: 'bottom 45%',
  /** The wash starts and ends as a rule this many px tall. */
  rulePx: 2,
  /** The rule draws in, then the wash grows from it to fill the scene. */
  ruleIn: 0.15,
  washIn: { at: 0.1, duration: 0.8 },
  /** How long a block takes to change ink as the wash passes it. */
  inkSwitch: 0.12,
  /** The name rises line by line behind its mask. */
  nameIn: { at: 0.35, duration: 0.6, stagger: 0.08 },
  /** Labels, copy and links rise in. */
  riseIn: { at: 0.5, duration: 0.45, stagger: 0.06 },
  /** The visual rises in, ready for its moment. */
  visualIn: { at: 0.55, duration: 0.5 },
  /** The signature moment plays once, the first time the scene is active. */
  moment: { at: 0.7, duration: 2.8 },
  /** Leaving: the wash retracts down and the name slides up behind its mask. */
  washOut: 0.55,
  nameOut: 0.35,
  /** Stacked layouts (no paging): contents rise once, and the moment plays, on entering view. */
  revealStart: 'top 80%',
  momentOnce: 2.4,
} as const;

/**
 * Tavren's signature moment (src/scripts/tavren-3d.ts). Spans are fractions of
 * the moment's progress (0 to 1), which SCENE.moment maps onto the pinned scroll.
 */
export const TAVREN = {
  /** Camera field of view, degrees. */
  fov: 30,
  /** The camera tilts from straight down to the three-quarter view across this span. */
  tilt: [0, 0.45] as [number, number],
  /** Final tilt from vertical, degrees. */
  tiltTo: 52,
  /** The board turns from this heading to the frame's slight angle as it tilts, degrees. */
  turnFrom: 24,
  turnTo: -8,
  /** Hexes extrude across this span, rippling out from the centre. */
  rise: [0.12, 0.62] as [number, number],
  /** Delay per ring of the ripple, and how long one hex takes. */
  ripple: 0.07,
  tileTime: 0.2,
  /** Forests, quarries, pastures and fields grow in across this span. */
  dress: [0.45, 0.82] as [number, number],
  /** The village drops in and the gold ring lights across this span. */
  village: [0.8, 0.97] as [number, number],
} as const;
