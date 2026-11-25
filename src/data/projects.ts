// Copy and metadata for the eight projects. Source: design/Projects.md and the frames.
// A link with no href is a placeholder still waiting on Nathan: it renders as a
// labelled placeholder, never as a guessed URL.

export type ProjectId = 'tavren' | 'kora' | 'cotrip' | 'tower' | 'worldbar' | 'pasteperfect' | 'emergency' | 'dropshelf';

export interface ProjectLink {
  label: string;
  href?: string;
  external?: boolean;
  /** Solid (primary) or outline. */
  variant: 'solid' | 'outline';
  /** Show Apple's own badge instead of a text button (black, for a light or coloured field): the Mac App Store's or the iPhone App Store's. */
  badge?: 'mac-app-store' | 'app-store';
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
  /** Shown first, on a bigger card (Nathan's lead projects). */
  featured?: boolean;
}

/** WorldBar's Mac App Store listing (app id 6836081075). */
export const WORLDBAR_MAC_APP_STORE = 'https://apps.apple.com/app/id6836081075';

/** Emergency Tower's App Store listing (app id 6834648880). */
export const EMERGENCY_TOWER_APP_STORE = 'https://apps.apple.com/app/id6834648880';

/** Campaign Tower's App Store listing (app id 6804446974). */
export const CAMPAIGN_TOWER_APP_STORE = 'https://apps.apple.com/app/id6804446974';

export const projects: Project[] = [
  {
    id: 'kora',
    featured: true,
    number: '01',
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
    featured: true,
    number: '02',
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
    id: 'tavren',
    number: '03',
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
      // Live on the App Store (approved 24 Nov 2026).
      { label: 'Download Campaign Tower on the App Store', href: CAMPAIGN_TOWER_APP_STORE, external: true, variant: 'solid', badge: 'app-store' },
      { label: 'About the game', href: '/campaign-tower/', variant: 'outline' },
    ],
  },
  {
    id: 'worldbar',
    number: '05',
    name: 'WorldBar',
    kind: 'Tool',
    indexLine: "Find a time that works for everyone. A world clock and meeting planner in your Mac's menu bar.",
    indexStack: 'Menu bar · macOS',
    line: 'Find a time that works for everyone.',
    more: 'A menu bar app for your Mac. Keep up to 8 cities one click away, drag through the day, and see when everyone is in working hours.',
    notes: ['macOS 15 or later', 'No account · No tracking'],
    links: [
      // Live on the Mac App Store (app id 6836081075).
      { label: 'Download WorldBar on the Mac App Store', href: WORLDBAR_MAC_APP_STORE, external: true, variant: 'solid', badge: 'mac-app-store' },
      { label: 'See WorldBar', href: '/worldbar/', variant: 'outline' },
    ],
  },
  {
    id: 'pasteperfect',
    number: '06',
    name: 'PastePerfect',
    kind: 'Tool',
    indexLine: 'Copy anything, paste perfectly. Cleans tracking junk out of copied links and text.',
    indexStack: 'Menu bar · macOS',
    line: 'Copy anything. Paste perfectly.',
    more: 'A Mac app that cleans up copied text and URLs before you paste. It strips tracking parameters, removes stray formatting and tidies messy text, all on your Mac.',
    notes: ['macOS 15 or later', 'No account · No tracking'],
    links: [{ label: 'See PastePerfect', href: '/pasteperfect/', variant: 'solid' }],
  },
  {
    id: 'emergency',
    number: '07',
    name: 'Emergency Tower',
    kind: 'Game',
    indexLine: 'Three patients are waiting. One lift. Who rides first? A pixel-art triage game for iPhone.',
    indexStack: 'SwiftUI · SpriteKit · StoreKit',
    // From the app's own content file (marketing/emergency/website.txt in its repo).
    line: 'Three patients are waiting. One lift. Who rides first?',
    more: "A pixel-art idle game about building a city's emergency services into one tower, one floor at a time. Patients arrive tagged red, amber or green, and you choose who rides the lift first, because critical cases can't wait.",
    notes: ['iPhone · iOS 17 or later', 'Free · optional rewarded ads'],
    wordmark: { src: 'assets/emergency-tower/wordmark-{w}.webp', widths: [600, 1000], ratio: 992 / 328 },
    // Live on the App Store (app id 6834648880).
    links: [
      { label: 'Download Emergency Tower on the App Store', href: EMERGENCY_TOWER_APP_STORE, external: true, variant: 'solid', badge: 'app-store' },
      { label: 'See Emergency Tower', href: '/emergency-tower/', variant: 'outline' },
    ],
  },
  {
    id: 'dropshelf',
    number: '08',
    name: 'DropShelf',
    kind: 'Tool',
    indexLine: 'Your files, all in one place. A visual shelf for the files you are working on, on your Mac.',
    indexStack: 'SwiftUI · AppKit · macOS',
    // From the app's own landing page (dropshelf-site in its repo).
    line: 'Your files. All in one place.',
    more: 'A visual workspace for your Mac. Keep the files you are working on close, wherever they live, and link, copy or move them, your way.',
    notes: ['macOS 15 or later', 'No account · No tracking'],
    // Not on the Mac App Store yet: the scene links to the page, which carries the "Coming soon" placeholder.
    links: [{ label: 'See DropShelf', href: '/dropshelf/', variant: 'solid' }],
  },
];

export const contact = {
  email: 'njvanderbyl@gmail.com',
  linkedin: 'https://www.linkedin.com/in/njvan/' as string | undefined,
};
