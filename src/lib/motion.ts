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
  // Cursor letters (settled only, fine pointers only): letters near the cursor
  // push away, swell and thin out, falling off smoothly with distance.
  // Lengths are in ems of the poster size, so the effect scales with the name.
  /** Reach of the cursor: letters farther than this are untouched. */
  cursorRadius: 1.4,
  /** How far a letter right under the cursor is pushed away from it. */
  cursorPush: 0.14,
  /** Extra scale right under the cursor (0.1 = 110%). */
  cursorSwell: 0.12,
  /** Weight right under the cursor; the name rests at WEIGHT.display (800). Keep inside 400-800. */
  cursorWeight: 450,
  /** Time constants in seconds: how quickly letters follow the cursor, and how slowly they settle back. */
  cursorFollow: 0.08,
  cursorSettle: 0.35,
} as const;

/**
 * Project scenes. On wide screens the browser snaps each scene to fill the
 * viewport, then its sequence plays on its own time: wash, ink, name, copy,
 * then the signature moment. Times are seconds from the scene becoming active.
 */
export const SCENE = {
  /**
   * Where scenes snap and play: their frame layout, fitting the viewport. The
   * snapping itself is native CSS scroll snap (global.css), which handles
   * wheels, trackpad momentum, keys, touch and the scrollbar; keep that media
   * query in step with this one.
   */
  pageQuery: '(min-width: 1024px) and (min-height: 600px)',
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
  /** Scenes whose moment tells a longer story get their own length, in seconds. */
  momentLength: { cotrip: 5, kora: 4.5 } as Record<string, number>,
  /** A moment whose visual loads late waits for it, up to this many seconds. */
  momentWait: 4,
  /** Leaving: the wash retracts down and the name slides up behind its mask. */
  washOut: 0.55,
  nameOut: 0.35,
  /** Stacked layouts (no snapping): contents rise, and the moment plays, on entering view. */
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

/**
 * Kora's signature moment (src/scripts/kora-moment.ts). Spans are fractions of
 * the moment's progress (0 to 1); the moment runs SCENE.momentLength.kora seconds.
 */
export const KORA = {
  /** The overview screen slides in from the right. */
  screen: [0, 0.22] as [number, number],
  /** Ask Kora pops out over its corner. */
  askPop: [0.2, 0.28] as [number, number],
  /** The question types itself behind a violet caret. */
  type: [0.3, 0.54] as [number, number],
  /** The answer arrives word by word, then its sources. */
  answer: [0.58, 0.8] as [number, number],
  sources: [0.8, 0.86] as [number, number],
  /** The off-track bar the answer describes is outlined in the overview. */
  mark: [0.86, 0.96] as [number, number],
} as const;

/**
 * Cotrip's signature moment (src/scripts/cotrip-moment.ts): ask TripTalk to
 * change the plan, and watch the plan change. Spans are fractions of the
 * moment's progress (0 to 1); the moment runs SCENE.momentLength.cotrip seconds.
 */
export const COTRIP = {
  /** The map grid fades in. */
  grid: [0, 0.08] as [number, number],
  /** The route draws itself, a traveller dot riding its tip; each pin drops as the line reaches it. */
  route: [0.04, 0.4] as [number, number],
  pinDrop: 0.05,
  /** The phones stack in beside the map: the back one slides and tilts, the front one rises. */
  phoneBack: [0.18, 0.36] as [number, number],
  phoneFront: [0.24, 0.42] as [number, number],
  /** A question to TripTalk pops out, then types itself. */
  askPop: [0.44, 0.48] as [number, number],
  askType: [0.48, 0.62] as [number, number],
  /** TripTalk answers, and the plan changes: the dotted leg draws on to the new stop. */
  reply: [0.66, 0.72] as [number, number],
  ahead: [0.72, 0.84] as [number, number],
  destination: [0.82, 0.88] as [number, number],
  /** One ping from "you are here" to finish. */
  ping: [0.9, 1] as [number, number],
} as const;

/**
 * Campaign Tower's signature moment (src/scripts/tower-moment.ts): the game's
 * own gameplay in a phone. Stepped, unsmoothed motion, the one place it is
 * allowed, to match the pixel art. Spans are fractions of the moment's progress.
 */
export const TOWER = {
  /** The phone rises into place in this many pixel steps. */
  rise: [0, 0.25] as [number, number],
  riseSteps: 6,
  /** The screen reveals bottom to top, a floor at a time. */
  reveal: [0.2, 0.75] as [number, number],
  floors: 9,
  /** Once the moment passes this point, the gameplay video plays. */
  playAt: 0.75,
  /** Start loading the video when the scene is this close (viewport heights). */
  preloadMargin: '400%',
} as const;

/**
 * The project index's entrance (src/scripts/ledger.ts), replayed each time the
 * index comes into view. Times in seconds.
 */
export const INDEX = {
  /** Each row starts this long after the one above it. */
  rowStagger: 0.12,
  /** A hairline's draw, left to right. */
  ruleDraw: 0.7,
  /** Mono labels decode into place (ScrambleText) over this long. */
  scramble: 0.55,
  scrambleChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  /** Name letters rise from behind their masks. */
  nameRise: 0.6,
  nameStagger: 0.025,
  /** Then the accent preview: each row's accent runs under it and retracts, one at a time. */
  sweepGap: 0.3,
  sweep: 0.42,
} as const;
