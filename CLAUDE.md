# njvan.net

Nathan VanderByl's personal site: a showcase of seven side projects (Tavren, Kora, Cotrip, Campaign Tower, WorldBar, PastePerfect, Emergency Tower). A monochrome editorial site in the Animaxxing style, where each project takes over the page in its own colour as you scroll. Motion is the point of the site; it has to feel slick.

## Read first

| File | What it is |
|---|---|
| `design/design-system.md` | The brand book: voice, colour rules, type, layout, page structure |
| `design/tokens.json` | Every colour (dark and light), type style, spacing, radius and border value. The source of truth |
| `design/Motion.md` | The motion system: durations, eases, what moves on each surface, each project's signature moment, mobile and reduced-motion rules |
| `design/Projects.md` | Copy, stack and accent for each project |
| `design/frames/*.dc.html` | The approved static designs. Open them in a browser for layout reference only: they are design-canvas files, not code to reuse |
| `design/frames/canvas.json` | Frame list; its `notes` hold the motion notes from the design canvas |

The live versions are on claude.ai: the njvan design system (https://claude.ai/artifact/7TudbuBnrogdYkgpxxTV4X) and the homepage canvas (https://claude.ai/artifact/AYfxaN5n5cTBuLPdVwbf4h). If a file here disagrees with them, ask Nathan which is current.

## Decisions already made

- **Hero:** "Nathan VanderByl" on two lines at poster size, no label above it, subheading "Games, tools and apps I've built.", one solid "See the projects" button. The header wordmark reads "njvan".
- **No GitHub links anywhere.** The repos are private.
- **Contact:** njvanderbyl@gmail.com and LinkedIn in the footer.
- **Accents:** Tavren #FFD34D, Kora #5B4BE0 / #8B7CFF dark, Cotrip #F95C30 (coral, not its brand violet), Campaign Tower #3FBF5F. One accent on screen at a time.
- **Dark is the default theme,** whatever the OS prefers. Light is only a manual choice from the footer toggle, remembered on the device.
- **Campaign Tower's landing page** is served at njvan.net/campaign-tower/ (linked from its scene), inside this site's header and footer. It comes from `docs/` in ~/Projects/CampaignTower: the markup is in `src/pages/campaign-tower/index.astro` wrapped in `.ct`, its stylesheet is scoped to `.ct` in `src/styles/campaign-tower.css` (with `.btn` renamed `.ct-btn`), and its images, videos, `motion.js` (two lines changed: the effects canvas joins `.ct`, and `.ct-btn`) and standalone support and privacy pages are in `public/campaign-tower/`. The original stays live at https://njvb.github.io/campaigntower-site/ because App Review and the App Store listing point there. Do not touch the `njvb.github.io` or `campaigntower-site` repos (they host its AdMob app-ads.txt). If the original changes, port the change here by hand.

- **WorldBar's page** is served at njvan.net/worldbar/ (with /worldbar/support/ and /worldbar/privacy/, the App Store's Support and Privacy URLs). Accent: azure #4DA3FF (`worldbar`, text `on-worldbar`). App landing pages may use gradients, glows and shadows (the flat rule is for the homepage only). The screenshots in `public/assets/worldbar/` are real captures of the app, never mock-ups; recapture them if the UI changes. The Mac App Store button is a labelled placeholder until there is a real URL. Until the app is released, "Join the TestFlight beta" buttons (hero, closing section and homepage scene) link to its public TestFlight (`WORLDBAR_TESTFLIGHT` in `src/data/projects.ts`); remove them and the constant when the app is on the store. It is the fifth scene on the homepage (index row 05 and a full scene in azure, linking to /worldbar/), added at Nathan's request.

- **PastePerfect's page** is served at njvan.net/pasteperfect/ (with /pasteperfect/support/ and /pasteperfect/privacy/), ported from the app's own website. Accent: warm cream, sand in light (not blue, so it never reads as WorldBar) (`pasteperfect`, text `on-pasteperfect`). The window capture is a real screenshot of the app. The app is not on the Mac App Store yet (TestFlight is internal only), so its store button is a labelled "Coming soon" placeholder: link https://apps.apple.com/app/id6837888565 with Apple's badge once it is live, and do not add a TestFlight link. It is the sixth scene on the homepage (index row 06 and a full scene in cream, linking to /pasteperfect/), added at Nathan's request. The page's demo and motion are `src/scripts/pasteperfect-page.ts`; the scene's moment is `src/scripts/pasteperfect-moment.ts`.

- **Emergency Tower's page** is served at njvan.net/emergency-tower/ (with /support/ and /privacy/, the App Store's Support and Privacy URLs, and https://njvan.net/app-ads.txt serves AdMob for it and Campaign Tower). The text comes from the Emergency Tower session's content file (marketing/emergency/website.txt in ~/Projects/EmergencyTower). Accent: night navy `emergency` (#1C2541, text `on-emergency` paper white), chosen by Nathan from four options. The screenshots are the game's real whole-screen captures only: its Pixel Spaces sprite licence allows the sprites inside composite whole-screen screenshots, never on their own, and never to feed AI-generated content (so no cut-out sprites; the icon and the title wordmark are fine alone). The triage tags beside the phone are HTML, not sprites. The game is not on the App Store yet, so its store button is a labelled "Coming soon" placeholder: link its listing with Apple's badge once it is live. It is the seventh scene on the homepage (card and scene in navy), added at Nathan's request. The page's motion is `src/scripts/emergency-page.ts`; the phone and tags are `src/scripts/emergency-fan.ts`.

- **Homepage layout:** the hero, then a grid of project cards (`src/components/ProjectIndex.astro`). A card opens its project's full-colour scene in the stage (`src/components/Stage.astro`, `src/scripts/stage.ts`): the card grows to fill the screen, the scene's sequence and signature moment play, and Prev / Next, the pills and the arrow keys move between projects. Each project's address (`/#cotrip`) opens it on load; Back closes it. The page does not scroll-snap. Moments are time-played (progress in `src/lib/moments.ts`), so they replay on every open. Heavy parts (Tavren's 3D board, Campaign Tower's video) load on `preload(id)`. Adding a project means a `projects.ts` entry, a card thumbnail in `public/assets/thumbs/`, a scene visual and its accent tokens.

## Stack

- **Astro** (static output) + **TypeScript** + **GSAP** (ScrollTrigger, SplitText, CustomEase, Flip; all free since 3.13). Lenis for smooth scroll only if the Animaxxing skill recommends it.
- Plain CSS custom properties generated from `design/tokens.json`. No Tailwind unless Nathan asks.
- Fonts: Rethink Sans (variable 400-800) and JetBrains Mono (variable), self-hosted via Fontsource.
- Keep all motion values in one module, `src/lib/motion.ts`, matching `design/Motion.md`.

## Animaxxing skills

Install once, before building any motion:

```
/plugin marketplace add johnpolacek/animaxxing-skills
```

Use `gsap-astro` for lifecycle (mount, intro, settled, outro, cleanup), `animaxxing` for the effect recipes, and `style-animaxxing` for the look. This site uses the Animaxxing frame plus project accents, so follow `design/` where it differs from `style-animaxxing` (it differs only in colour: the accents).

## Build order

1. Scaffold Astro, tokens to CSS, fonts, base layout, header and footer. Static page matching `design/frames/Main.dc.html` and `Mobile.dc.html`, readable with JavaScript off.
2. Hero motion: name scatter-in, speak-in subheading, particle button, letter wave, blast-off on scroll.
3. Project index: rise-in, hover accent rule and name wave.
4. The four scenes, one at a time, starting with the accent wash and pinning shared by all four, then each signature moment (Tavren hex tilt, Kora Flip panels, Cotrip route draw, Campaign Tower pixel floors).
5. Mobile behaviour, reduced motion, performance pass (60fps on a mid-range phone, no layout shift).
6. Deploy (below).

Show Nathan each step running locally (`npm run dev`) before moving on. He tunes motion by eye.

## Placeholders still to fill

- Screenshots for Tavren, Kora and Cotrip, and each project's logo. Ask Nathan for them; until then use labelled placeholders, never invented screens.
- Kora's status (live, beta or in development).
- Links: play Tavren, Cotrip on the App Store, Kora. Ask before inventing any URL. (Campaign Tower is live on the App Store: `CAMPAIGN_TOWER_APP_STORE` in `src/data/projects.ts`, app id 6804446974.)

## Testing

The site has Playwright UI tests (`tests/`, config in `playwright.config.ts`) that run against the built site. They run in CI on every pull request and **before every deploy**: if they fail, nothing is deployed.

- Run `npm test` (builds, then tests) before opening a PR and after any further change. `npm run test:only` reuses the existing build.
- Add or update a test with every change to behaviour, a page, a project or a rule on this page. Do not skip, delete or loosen a test to get green; if a change is intended, update the test in the same PR.
- Full guide (what each spec covers, how to add tests, how to read a CI failure): `.claude/skills/ui-tests/SKILL.md` (the `ui-tests` skill).

## Deploy

The site is live at https://njvan.net on GitHub Pages, built by the official Astro action (`.github/workflows/deploy.yml`) on every push to `main`. `public/CNAME` holds `njvan.net` and HTTPS is enforced. There are no `SITE` or `BASE` overrides: assets load from the site root.

- Work on `site-build` and open a PR to `main`. Merging deploys to the live site, so merge only when Nathan says to.
- Check the deploy afterwards: the run succeeds, and the changed files return 200 on njvan.net.

## Domain and mail

- **njvan.net** is registered through iwantmyname, and its DNS is hosted there: the four GitHub Pages A records and four AAAA records, `www` as a CNAME to `njvb.github.io`, and iCloud's MX, SPF, DKIM (`sig1._domainkey`) and `apple-domain` records. HostGator's old zone for it was edited to match, so any resolver that still asks HostGator gets the same answers. The HostGator hosting is being cancelled.
- **Mail** for njvan.net runs on iCloud+ as a custom domain (hello@ and i.am@). SPF and DKIM pass.
- **epilogue.com.au** is registered and hosted at GoDaddy. Its mail is on iCloud, and it forwards with a 301 to https://njvan.net.
- Ask Nathan before changing any DNS. Keep the iCloud and GitHub Pages records above intact, or mail or the site stops.

## SEO and social

- Every page uses `src/layouts/Base.astro`, which writes the title, description, canonical URL, Open Graph and Twitter tags. Pass `image` (1200 x 630, a path from the site root), `imageAlt`, `jsonLd` and `noindex` as needed. A new page needs its own title, description and image.
- Share images: `public/og/home.jpg`, `public/og/tavren.jpg` and `public/campaign-tower/img/share.jpg`. The first two were rendered in Chrome from HTML using the site's fonts and colours; redo them if the name, tagline or Tavren wordmark changes.
- Structured data: `Person` and `WebSite` on the home page (LinkedIn comes from `contact` in `src/data/projects.ts`), `SoftwareApplication` on Tavren and Campaign Tower. Add only facts that are on the page.
- The sitemap comes from `@astrojs/sitemap` (`/sitemap-index.xml`) and `public/robots.txt` points to it. New pages are included automatically. The 404 page is `noindex` and left out.
- Google Search Console is verified by the `google-site-verification` meta tag in `Base.astro` (URL prefix property `https://njvan.net/`). Keep the tag.
- Icons: `public/favicon.svg` (the "N" tile), plus `favicon.ico` and `apple-touch-icon.png` made from it. Redo the two if the SVG changes.

## Writing rules

- Never use em dashes in copy, comments or commit messages. Use a hyphen.
- No AI-isms in copy. Plain, short, specific, first person.
