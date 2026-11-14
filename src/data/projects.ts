// Copy and metadata for the four projects. Source: design/Projects.md and the frames.
// A link with no href is a placeholder still waiting on Nathan: it renders as a
// labelled placeholder, never as a guessed URL.

export type ProjectId = 'tavren' | 'kora' | 'cotrip' | 'tower';

export interface ProjectLink {
  label: string;
  href?: string;
  external?: boolean;
  /** Solid (primary) or outline. */
  variant: 'solid' | 'outline';
}

export interface Project {
  id: ProjectId;
  number: string;
  name: string;
  /** Index ledger: kind shown beside the number. */
  kind: string;
  /** Index ledger line. */
  indexLine: string;
  /** Index ledger stack (short). */
  indexStack: string;
  /** Scene subhead. */
  line: string;
  /** Scene body copy. */
  more: string;
  /** Scene annotations along the bottom rule. */
  notes: string[];
  /** The project's own logo, shown in its scene's top row (drawn in the scene's ink). */
  logo?: { src: string; /** Width over height. */ ratio: number };
  /** A full-colour wordmark shown as the scene's name instead of the text (the text becomes its alt). */
  wordmark?: {
    /** Path under BASE_URL, with {w} for the width. */
    src: string;
    widths: number[];
    /** Width over height. */
    ratio: number;
  };
  links: ProjectLink[];
}

export const projects: Project[] = [
  {
    id: 'tavren',
    number: '01',
    name: 'Tavren',
    kind: 'Game',
    indexLine: 'A medieval hex-board strategy game for two to four players.',
    indexStack: 'Vue 3 · Three.js',
    line: 'A medieval hex-board strategy game for two to four players.',
    more: 'Settle an island, build roads and villages, trade, and hold off the bandits. Play on one device, online, or against the computer.',
    notes: ['Vue 3 · TypeScript · Three.js', '2-4 players · browser, iPhone, iPad and Mac'],
    wordmark: { src: 'assets/tavren/wordmark-{w}.webp', widths: [600, 1100, 1700], ratio: 1100 / 252 },
    links: [
      { label: 'Play Tavren', href: 'https://mac-mini.tail94f02c.ts.net/', external: true, variant: 'solid' },
      { label: 'Get the app', href: '/tavren/', variant: 'outline' },
    ],
  },
  {
    id: 'kora',
    number: '02',
    name: 'Kora',
    kind: 'Tool',
    indexLine: 'The operating system for creative agencies. Ask Kora answers across all of it.',
    indexStack: 'Nuxt 4 · Supabase · AI',
    // From the product's site (kora-os.com).
    line: 'Run the agency. Not the spreadsheets.',
    more: 'Kora is where your team wins, plans and delivers client work. With a portal your clients will actually use.',
    notes: ['Nuxt 4 · Supabase · AI', 'Live · 14 days free, no card needed'],
    logo: { src: 'assets/kora/kora-logo.svg', ratio: 424.86 / 100 },
    links: [
      { label: 'Try Kora free', href: 'https://app.kora-os.com/signup', external: true, variant: 'solid' },
      { label: 'Visit kora-os.com', href: 'https://www.kora-os.com', external: true, variant: 'outline' },
    ],
  },
  {
    id: 'cotrip',
    number: '03',
    name: 'Cotrip',
    kind: 'App',
    indexLine: 'Your whole trip, in one place. Planned with your crew, with AI.',
    indexStack: 'SwiftUI · Firebase',
    // From the app's landing page (cotrip.app).
    line: 'Your whole trip, in one place.',
    more: "Find a place and let AI draft the days. Plan it with your crew, ask TripTalk to change it, split what you spend, and on the day see what's next and how to get there.",
    notes: ['SwiftUI · Vue 3 · Firebase', 'Free · iPhone, iPad and web'],
    logo: { src: 'assets/cotrip/cotrip-logo.png', ratio: 440 / 112 },
    links: [
      { label: 'App Store', href: 'https://apps.apple.com/app/id1536158484', external: true, variant: 'solid' },
      { label: 'Visit cotrip.app', href: 'https://cotrip.app', external: true, variant: 'outline' },
    ],
  },
  {
    id: 'tower',
    number: '04',
    name: 'Campaign Tower',
    kind: 'Game',
    indexLine: 'Build an ad agency one floor at a time. Pixel art, for iPhone.',
    indexStack: 'SwiftUI · SpriteKit · StoreKit',
    // From the game's landing page, copied to /campaign-tower (public/campaign-tower).
    line: "Your ad agency starts in one room above a shop. It won't stay there.",
    more: "A pixel-art tower game for iPhone. Build new floors, hire creatives who all think they're the next big thing, and drive the lift yourself, because nobody budgeted for a lift operator.",
    notes: ['Free on iPhone · iOS 17 or later', 'No energy meter · Nothing behind a paywall'],
    wordmark: { src: 'assets/tower/wordmark-{w}.webp', widths: [600, 1100, 1700], ratio: 1774 / 887 },
    links: [
      {
        label: 'Visit the tower',
        href: '/campaign-tower/',
        variant: 'solid',
      },
    ],
  },
];

export const contact = {
  email: 'njvanderbyl@gmail.com',
  linkedin: 'https://www.linkedin.com/in/njvan/' as string | undefined,
};
