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
 * Project scenes. Timeline positions are fractions of the pinned scroll
 * (0 = the scene reaches the top, 1 = it unpins). Signature moments use the
 * span after `settledAt`.
 */
export const SCENE = {
  /** Scenes pin only where they have their frame layout and fit the viewport. */
  pinQuery: '(min-width: 1024px) and (min-height: 600px)',
  /** Pinned scroll distance, as a fraction of the viewport (1.5 screens). */
  pinLength: 1.5,
  /** The wash starts and ends as a rule this many px tall. */
  rulePx: 2,
  /** The wash grows from the top rule to fill the scene. */
  washIn: { at: 0, duration: 0.3 },
  /** How long a block takes to change ink as the wash passes it. */
  inkSwitch: 0.03,
  /** The name rises line by line behind its mask. */
  nameIn: { at: 0.08, duration: 0.2, stagger: 0.04 },
  /** Labels, copy and links rise in. */
  riseIn: { at: 0.14, duration: 0.16, stagger: 0.025 },
  /** The visual rises in (the signature moments take over here later). */
  visualIn: { at: 0.2, duration: 0.2 },
  /** Index links land here, so a jump shows the scene washed and settled. */
  settledAt: 0.45,
  /** Where scenes reveal once, when not pinned (stacked layouts). */
  revealStart: 'top 80%',
} as const;
