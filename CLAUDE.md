# njvan.net

Nathan VanderByl's personal site: a showcase of four side projects (Tavren, Kora, Cotrip, Campaign Tower). A monochrome editorial site in the Animaxxing style, where each project takes over the page in its own colour as you scroll. Motion is the point of the site; it has to feel slick.

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
- **Dark is the primary theme;** light follows the OS setting or the footer toggle.
- **Campaign Tower's landing page** stays at https://njvb.github.io/campaigntower-site/ and is linked from its scene. Do not touch the `njvb.github.io` or `campaigntower-site` repos (they host its AdMob app-ads.txt).

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
- Links: play Tavren, Cotrip on the App Store, Kora. Ask before inventing any URL.

## Deploy

GitHub Pages from this repo with the official Astro GitHub Action, custom domain `njvan.net` (add `public/CNAME` containing `njvan.net`). DNS for njvan.net is still at HostGator and is being moved to Cloudflare; Nathan will point the domain once the site is ready. Do not change any DNS from here.

## Writing rules

- Never use em dashes in copy, comments or commit messages. Use a hyphen.
- No AI-isms in copy. Plain, short, specific, first person.
