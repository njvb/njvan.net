---
name: ui-tests
description: Run, extend and debug the njvan.net UI tests (Playwright). Use before opening or merging any pull request on this site, after changing any page, component, script, style or content, when adding a page or project, and whenever a deploy or CI test run fails.
---

# njvan.net UI tests

The site has a Playwright suite that tests the **built** site (`dist/`) the way GitHub Pages serves it. CI runs it on every pull request and **before every deploy**; a failing test stops the deploy (`.github/workflows/test.yml`, called by `deploy.yml`).

## Run it

```
npm test            # builds (type-checks too), then runs everything
npm run test:only   # runs against the existing dist/ (fast, after a build)
npx playwright test tests/home.spec.ts            # one file
npx playwright test --project=desktop -g "Kora"   # one project, by name
npm run test:ui     # Playwright's interactive UI, to watch or debug
```

First time on a machine: `npx playwright install chromium webkit`.

Run `npm test` before opening a PR, and again if you change anything after. If it fails, read the failure, fix the site or the test (see below), and re-run. Do not skip, delete or loosen a test just to get green.

## What is covered (`tests/`)

| File | Checks |
|---|---|
| `smoke.spec.ts` | Every built page (found from `dist/`, so new pages are covered automatically) loads with status 200, a title and an h1, no console or page errors, no failed same-site requests, no sideways scroll. |
| `home.spec.ts` | Hero; one card per project in `src/data/projects.ts`; each project opens in the stage, shows its name and buttons, makes the rest of the page inert, closes (button, Escape), returns focus; Prev, Next, pills and arrow keys; `/#id` opens a project; Back closes it; a bad hash does nothing. Runs on desktop, a phone (WebKit) and with reduced motion. |
| `theme.spec.ts` | Dark by default even if the OS prefers light; the footer toggle switches to light and is remembered. |
| `links-seo.spec.ts` | Title, description, canonical, Open Graph and Twitter tags, a real share image and valid JSON-LD on every indexed page; 404 is noindex; robots.txt and the sitemap; internal links resolve; no `github.com` links (the repos are private); external `_blank` links have `noopener`; the contact links are present. |
| `pasteperfect.spec.ts` | The Try it window really cleans text (tidy, clean URLs, each mode, custom rules); the store button is still the "Coming soon" placeholder (no TestFlight or store link yet); support and privacy pages carry the contact address. |
| `motion.spec.ts` | With JavaScript off, the cards and every scene are still on the page. |
| `a11y.spec.ts` | axe (WCAG 2 A and AA): serious or critical problems fail, on every page and inside an opened project. |

## When you change the site

- **New page:** nothing to add for smoke, SEO or accessibility (they find it in `dist/`). Give it its own title, description and share image (see CLAUDE.md), or the SEO test fails.
- **New project on the home page:** add it to `src/data/projects.ts`; the home tests pick it up. Add its card thumbnail and a scene visual as CLAUDE.md says.
- **New behaviour** (a demo, a control, a rule in CLAUDE.md such as "no GitHub links"): add a test for it in the matching spec, or a new `tests/<name>.spec.ts`. Prefer stable hooks (`data-*` attributes, roles, accessible names) over CSS classes. Add a `data-` hook to the markup if there is none.
- **Intended change that breaks a test** (copy, a button label, a rule that changed on purpose): update the test in the same PR and say why in the description.
- Tests must be deterministic: wait on state (`expect(...).toHaveClass`, `toBeVisible`), never on fixed timeouts, except the one short settle in `a11y.spec.ts`.

## When CI fails

Open the failed run on GitHub, download the `playwright-report` artifact (screenshots and traces of the failures), or reproduce with `npm test`. A deploy that was blocked by a failing test runs again once a fix is merged to `main`.

## Config

`playwright.config.ts`: serves `dist/` with `sirv` on port 4173; projects `desktop` (Chrome, 1440x900), `phone` (iPhone 14, WebKit; smoke, home, theme only) and `reduced-motion` (home only). Do not point tests at the live site.
