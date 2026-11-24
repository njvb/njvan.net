# Motion

The motion system for njvan.net, built with GSAP (ScrollTrigger, SplitText, CustomEase, Flip) and the Animaxxing recipes. The frame moves the same way everywhere; each project adds one signature moment of its own.

## Tokens

Keep these in one module in the build (`motion.ts`). The design-system page has no motion family, so they live here.

| Token | Value | Use |
|---|---|---|
| `DURATION.micro` | 0.14s | Hovers, presses, underline draws (range 100-180ms) |
| `DURATION.component` | 0.2s | Chips, cards, menus (160-240ms) |
| `DURATION.page` | 0.28s | Panels and route changes (220-320ms) |
| `EASE.entrance` | `power2.out` | Things arriving: fast, then settled |
| `EASE.exit` | `power2.in` | Things leaving: accelerate away, feel shorter |
| `EASE.shift` | `power2.inOut` | Moves that start and end at rest |
| `animaxxing` curve | `M0,0 C0.16,1 0.3,1 1,1` | Large deliberate moves only: accent washes, Flip morphs, scene changes |
| `SHIFT` | 4 / 8 / 16px | Travel for micro / component / page rises |
| `STAGGER` | 0.03s tight, 0.05s loose | Letters and list items |
| `WEIGHT` | 400 rest, 600 emphasis, 800 display | Animated weight stays inside 400-800 |

A coordinated sequence rarely runs past 500ms. Display effects (scatter, wave, project moments) run longer on purpose.

## The frame: same on every surface

| Surface | Intro | Settled | Outro |
|---|---|---|---|
| Wordmark | letters spring in, 1px underline draws `scaleX 0 → 1` | still | none (shell persists) |
| Hero poster "njvan" | route `letters`: scatter in from off screen, land from 0.75s | letter wave every 4s, a different move each pass (hop, breathe, lean, flip, weight dips to 500 or 400, shear, squash, twist); cursor letters on a fine pointer (below) | blast-off when the visitor scrolls past |
| Hero lead line | speak-in, word by word, from 1.05s | words persist | thrown with the blast |
| Index rows | rise, staggered 0.05s, on entering view | hover: name waves once, accent rule draws under it | standard exit |
| Project names (statement) | masked split by line once the scene is in view | still | slide up behind the mask |
| Labels and annotations | standard rise | still | standard exit |
| Body copy | appears with its block, never split | still | with its block |
| Page progress | none | 1px rule along the top in `foreground`, in the project's accent inside a scene | none |
| Primary button (one per page) | particle `reactor` assembles it | embers | `blast()` on press |
| External links `↗` | `slipstream` | drifting hairlines | `blast()` on press |

### Cursor letters (hero name)

Once the intro has settled, the letters of "Nathan VanderByl" react to a mouse or trackpad. Letters within `HERO.cursorRadius` (in ems of the poster size) of the cursor are pushed away from it by up to `cursorPush`, swell by up to `cursorSwell` and thin from 800 towards `cursorWeight`, with a smoothstep falloff so there is no hard edge. They follow the cursor quickly (`cursorFollow`) and settle back more slowly (`cursorSettle`) when it leaves. While the cursor is working the letters the wave holds off, and the effect ends with the wave when the hero blasts off, coming back with it. It shares the wave's split and moves an inner span per letter, so it never writes the transform the wave animates; weight changes stay inside each letter's pinned width, so nothing reflows. Fine pointers only (no touch equivalent: it is decoration, the wave carries the motion there), and off under reduced motion.

## Project scenes: one signature moment each

The homepage is the hero, then a grid of project cards (they rise in with the ledger's entrance: hairlines draw, labels decode, names rise, one accent sweeps at a time, and a name waves on hover). A card floods with its accent on hover. Clicking one opens its scene in the **stage** (`src/scripts/stage.ts`; values `STAGE` and `SCENE` in `motion.ts`): the card grows to fill the screen on the `animaxxing` curve (a clip-path from the card's own rectangle), then the name rises behind its mask, the copy and visual rise in, and the signature moment plays. Prev / Next, the pills and the arrow keys wipe the next project's colour across from the side while the old content slides away; Esc or the close button shrinks the scene back into its card. Each project has its own address (`/#cotrip`), which opens it on load; Back closes it. The page itself does not scroll-snap. Moments are time-played (progress 0 to 1 in `src/lib/moments.ts`), so they replay on every open and switch. (This replaces the earlier full-height scroll-snapped scenes.)

| Project | Accent | Signature moment (plays each time the project opens) |
|---|---|---|
| **Tavren** | `tavren` | The hex board tilts from flat to 3D (CSS 3D or a small Three.js scene). Hexes rise in a ripple from the centre; one village lights up gold. |
| **Kora** | `kora` | The violet wash arrives, then the real overview screen (from kora-os.com) slides in, bleeding off the edge. Ask Kora pops out over its corner, the question types itself, the answer arrives word by word with its sources, and the off-track bar it describes is outlined. (Replaced the earlier Flip panels.) |
| **Cotrip** | `cotrip` | A route line draws itself across a stylised map (SVG `strokeDashoffset`), dropping pins at each stop; phone screenshots stack beside it. |
| **Campaign Tower** | `tower` | Three phones rise in pixel blocks (stepped ease, no smoothing): the front one first, then the lift-run and winter-tower screens fanned behind it. The front screen reveals floor by floor, then the real lift gameplay plays. Values are `TOWER` in `motion.ts`; the script is `src/scripts/tower-moment.ts`. |
| **WorldBar** | `worldbar` | Three plates cut from the real capture (the same bands as the /worldbar/ hero) fall in angled and apart, leaning toward the title, then close into the whole popover and turn almost face-on, with a small settle and one shadow. Flat 2D matrices, no 3D context. The clock pills fade in with live times. Values are `WORLDBAR_SCENE` in `motion.ts`; the script is `src/scripts/worldbar-moment.ts`. Reduced motion and no-script show the closed popover. |
| **PastePerfect** | `pasteperfect` | The real window capture lands (rises and straightens), tracking chips appear around it one after another and are crossed out, then flung outward and away in the same order, while the link under the window shows its tracking tail, crosses it out and folds it away. Flat: an ink outline instead of a shadow. Values are `PASTEPERFECT_SCENE` in `motion.ts`; the script is `src/scripts/pasteperfect-moment.ts`. Reduced motion and no-script show the window and the clean link. |

Rules for project moments:

- **One signature moment per scene.** Everything else in the scene uses frame motion.
- Moments play every time the scene comes into view, along with the wash and name, and reset once it has left the screen, so they replay on each return.
- Campaign Tower is the one place stepped, unsmoothed motion is allowed, to match its pixel art.

## Mobile

- No pinning or paging below the wide layout. Scenes become stacked sections; the name and contents rise and the signature moment plays each time the scene enters view.
- Hover effects have a tap or in-view equivalent; nothing important hides behind hover.
- The letter wave pauses when the hero leaves the viewport.

## Reduced motion and no-script

- `prefers-reduced-motion: reduce`: no scatter, wave, speak-in, particles, pinning or scrubbing. Elements fade in over `DURATION.component`. Accent washes are shown as static fields.
- No script: the page renders its settled state. Nothing starts hidden unless a script is there to reveal it.

## WorldBar page (`/worldbar/`)

An app landing page, so it may use gradients, glows and shadows. Values are in `motion.ts` under `WORLDBAR`; the script is `src/scripts/worldbar-page.ts`.

| Surface | Moment |
|---|---|
| Hero name | Letters drop in (rotate up from below, `animaxxing`), then a slow wave runs through them every few seconds. |
| Isometric stack | Three plates cut from one real capture of the app fall in from high above, bottom plate first, and settle at the resting gap. The stack is flat 2D: one matrix per plate (rotate, squash, lift) written each frame, no `preserve-3d`, so Chrome and Safari match; the gap closes to zero on assemble with square inner corners and no labels. They bob gently, follow the pointer (fine pointers only), close into the whole popover a moment after landing (turning almost face-on so the app can be read); hovering or tapping pulls them apart again, and letting go closes them, and pull apart as the stack scrolls away (the scroll starts once the stack itself is leaving, so on a phone it is still whole when it comes into view). On phones the popover is wider and the clock pills are hidden. |
| Clock pills | Real local times (Intl) drift around the stack; the little menu bars further down tick on the minute. |
| Live demo | The first time it is seen, the slider slides in one continuous move from early morning to the real time now, at a steady pace with no 15 minute steps and no jump at the end; it then follows the clock. Once dragged, it snaps to 15 minutes. Dragging the slider or ticking a city recomputes the overlap. |
| Story | Pinned on wide screens (each step is clickable and scrolls to its share): steps on the left, the real screenshots on the right in a slowly turning frame, with a spotlight: the rest of the capture dims and a soft-edged band glides to the part being described (the band comes from the capture's own pixel rows). Narrow screens and no-script get the same steps stacked. |
| Details | Cards rise in as a batch; the light/dark wipe scrubs with the scroll; "194" counts up. "Choose who's in the meeting" ticks Singapore and Sydney in and out on a 9 s CSS loop, fading its "Comparing" line away while all five are in (as the app does); "Pop it out" shows the real floating-window capture lifting and settling. Both stand still, in the capture's resting state, under reduced motion. |
| Questions | As the section enters view, each item's top rule draws across, its number and question rise behind masks, then the answer fades up, staggered by row. Hovering an item draws an azure rule along its foot and nudges its number. The section also feeds the FAQPage structured data. The facts strip draws its rule then raises each fact; the closing buttons pop in one by one. Values are `WORLDBAR.faq`. |

Reduced motion shows the stack and everything else settled; the demo still works. No script: the page reads complete (the demo shows the 19 Nov example).

