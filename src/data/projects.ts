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
    notes: ['Vue 3 · TypeScript · Three.js', '2-4 players · plays in the browser'],
    links: [
      { label: 'Play Tavren', external: true, variant: 'solid' },
      { label: 'How it plays', variant: 'outline' },
    ],
  },
  {
    id: 'kora',
    number: '02',
    name: 'Kora',
    kind: 'Tool',
    indexLine: 'An operating system for agencies, with AI over everything.',
    indexStack: 'Nuxt 4 · Supabase · AI',
    line: 'An operating system for agencies, with AI over everything.',
    more: 'Clients, projects, scopes, plans, resourcing, timesheets, billing and a client portal in one place, with Ask Kora answering across all of it.',
    notes: ['Nuxt 4 · Supabase · AI', 'For agencies · [status]'],
    links: [{ label: 'See Kora', external: true, variant: 'solid' }],
  },
  {
    id: 'cotrip',
    number: '03',
    name: 'Cotrip',
    kind: 'App',
    indexLine: 'Plan trips together, with AI. Native on iPhone.',
    indexStack: 'SwiftUI · Firebase',
    line: 'Plan trips together, with AI.',
    more: 'Days, places, stays and flights in one shared plan, with a group chat, packing lists and an AI planner that knows your trip. Native on iPhone.',
    notes: ['SwiftUI · Vue 3 · Firebase', 'iPhone and web'],
    links: [{ label: 'App Store', external: true, variant: 'solid' }],
  },
  {
    id: 'tower',
    number: '04',
    name: 'Campaign Tower',
    kind: 'Game',
    indexLine: 'Build an ad agency one floor at a time. Pixel art, for iPhone.',
    indexStack: 'iOS · Pixel art',
    // From the game's landing page (njvb.github.io/campaigntower-site).
    line: "Your ad agency starts in one room above a shop. It won't stay there.",
    more: "A pixel-art tower game for iPhone. Build new floors, hire creatives who all think they're the next big thing, and drive the lift yourself, because nobody budgeted for a lift operator.",
    notes: ['Free on iPhone · iOS 17 or later', 'No energy meter · Nothing behind a paywall'],
    links: [
      {
        label: 'Visit the tower',
        href: 'https://njvb.github.io/campaigntower-site/',
        external: true,
        variant: 'solid',
      },
    ],
  },
];

export const contact = {
  email: 'njvanderbyl@gmail.com',
  /** Waiting on Nathan's profile URL. */
  linkedin: undefined as string | undefined,
};
