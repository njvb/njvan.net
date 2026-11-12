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
| Hero poster "njvan" | route `letters`: scatter in from off screen, land from 0.75s | letter wave every 4s, a different move each pass (hop, breathe, lean, flip, weight dips to 500 or 400, shear, squash, twist) | blast-off when the visitor scrolls past |
| Hero lead line | speak-in, word by word, from 1.05s | words persist | thrown with the blast |
| Index rows | rise, staggered 0.05s, on entering view | hover: name waves once, accent rule draws under it | standard exit |
| Project names (statement) | masked split by line once the scene is in view | still | slide up behind the mask |
| Labels and annotations | standard rise | still | standard exit |
| Body copy | appears with its block, never split | still | with its block |
| Page progress | none | 1px rule along the top in `foreground`, in the project's accent inside a scene | none |
| Primary button (one per page) | particle `reactor` assembles it | embers | `blast()` on press |
| External links `↗` | `slipstream` | drifting hairlines | `blast()` on press |

## Project scenes: one signature moment each

On wide screens the browser's own CSS scroll snapping stops on each scene (`scroll-snap-type: y mandatory`, `scroll-snap-stop: always` on scenes), so a flick never skips one and wheels, trackpad momentum, keys and touch all behave natively; nothing in JavaScript holds the scroll. The hero and index form one snap area taller than the screen and scroll freely; the footer snaps to the bottom. Each scene then plays on its own time (Nathan's call, replacing the earlier pinned, scroll-scrubbed version). A rule draws along the top and the accent grows from it to fill the scene on the `animaxxing` curve; text switches to the `on-` token as the wash passes under it; the name and copy rise in; then the signature moment plays. When the visitor scrolls on, the wash retracts down and the name slides up. Scrolling up out of the first scene returns to the free-scrolling index.

| Project | Accent | Signature moment (plays once the scene is in view) |
|---|---|---|
| **Tavren** | `tavren` | The hex board tilts from flat to 3D (CSS 3D or a small Three.js scene). Hexes rise in a ripple from the centre; one village lights up gold. |
| **Kora** | `kora` | The violet wash arrives, then the real overview screen (from kora-os.com) slides in, bleeding off the edge. Ask Kora pops out over its corner, the question types itself, the answer arrives word by word with its sources, and the off-track bar it describes is outlined. (Replaced the earlier Flip panels.) |
| **Cotrip** | `cotrip` | A route line draws itself across a stylised map (SVG `strokeDashoffset`), dropping pins at each stop; phone screenshots stack beside it. |
| **Campaign Tower** | `tower` | The tower builds itself floor by floor in pixel blocks (stepped ease, no smoothing). A small pixel lift rides up the side as the scroll indicator. |

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
