# njvan

The design system for njvan.net: a home for Nathan VanderByl's side projects, Tavren, Kora, Cotrip and Campaign Tower. A monochrome editorial stage, built on the Animaxxing look, where each project brings its own colour in as you scroll.

## The idea in one line

**One quiet frame, four loud guests.** The frame (type, rules, grid, motion) is the same everywhere and never takes colour. Colour belongs to the projects: each one arrives with its accent, takes over its section, and leaves.

## Content fundamentals

- **Voice.** Plain, short and specific. Say what a thing is and does: "A medieval hex-board strategy game for two to four players", not "Reimagining strategy gaming".
- **Who is speaking.** First person, lightly: "I build things on the side." No third-person bio voice.
- **Case.** Sentence case for headings and copy. Uppercase only in the mono voice (labels, annotations) and on chips.
- **Numbers and metadata** go in mono: `01 · TAVREN`, `VUE 3 · THREE.JS`, `2026`. The middle dot is a real `·` with a space either side.
- **No hiring language.** This is not a CV. No "results-driven", no skills lists, no logos of past employers.
- **Punctuation.** Hyphens, never em dashes. No exclamation marks.

## Visual foundations

### Colour

Monochrome by default. Twelve neutral tokens run the frame; dark is the primary theme and light follows the visitor's setting.

| Role | Tokens |
|---|---|
| Ground and text | `canvas`, `foreground`, `muted` |
| Structure | `border` (hairlines), `surface`, `surface-hover` |
| The one solid button | `inverse`, `inverse-hover`, `inverse-foreground` |
| Focus and selection | `focus`, `selection`, `selection-foreground` |

**Project accents** are taken from each project's own code:

| Project | Token | Value | Source | Text on it |
|---|---|---|---|---|
| Tavren | `tavren` | #FFD34D | game UI `--gold` | `on-tavren` (Tavren's ink) |
| Kora | `kora` | #5B4BE0 light / #8B7CFF dark | Kora `--primary` | `on-kora` |
| Cotrip | `cotrip` | #F95C30 | Cotrip `--coral` | `on-cotrip` |
| Campaign Tower | `tower` | #3FBF5F | pixel palette `--green` | `on-tower` |

Rules for accents:

- **An accent lives only in its own project's section.** Never two accents on screen at once, except the project index, where each is a small mark beside its name.
- **Accents are fields, not text.** Use them as full-bleed washes, highlights, drawn lines and progress rules. Text on an accent uses its `on-` token. In the light theme no text takes an accent, Kora's violet included; hover and focus keep text in ink and put the accent in a rule.
- **Cotrip uses coral, not its brand violet,** so it never reads as Kora.
- The four accents differ in lightness as well as hue (gold lightest, violet darkest), so they stay distinct for colour-blind visitors.
- No gradients, glows or shadows. Depth comes from hairlines and from colour taking over the page.

### Type

Two families, both from Google Fonts:

- **Rethink Sans** (variable, 400-800) for everything read and everything big. Display rests at 800.
- **JetBrains Mono** (variable) in small uppercase for metadata: the `caption` and `annotation` styles.

The contrast is the point: poster-size sans against tiny mono. `poster` and `statement` are fluid in the build (`clamp()` against the container); the sizes listed under Typography are their desktop value. Poster type may be cropped by its column; reading text and annotations never are. Text sits flush left, ragged right.

### Layout

- A twelve-column grid, max width 1280px, padded by `gutter` (mobile) and `gutter-lg` (640px up).
- Sections are separated by `hairline` rules in `border`, never by boxes or backgrounds.
- Radii are tight: `radius-xl` (12px) is the largest, used on chips, cards and screenshot frames.
- Borders: `hairline` by default, `strong` on chips, buttons and focus.

### Page structure (the homepage)

1. **Hero.** Wordmark top-left, a poster "njvan" and one line of lead copy that speaks in. Monochrome.
2. **Index.** The four projects as a numbered ledger: `01 · TAVREN`, a statement-size name, one line, the stack. Hovering a row previews its accent as a thin rule.
3. **Four project scenes.** Each pinned for a scroll's length: the accent washes in, the project's signature moment plays (see Motion), screenshots stack, metadata settles. The accent washes out as the next scene arrives.
4. **Footer.** Hairline rule, contact in mono, theme toggle.

## Motion

Motion is part of the look. Full rules are in the Motion section; the short version:

- Display type moves (scatter-in, letter wave); reading text never does, except the hero subhead.
- Each project scene has one signature moment in its accent.
- Everything respects `prefers-reduced-motion` and reads complete with motion off.

## Iconography

None. The system uses type, mono labels and arrows (`→`, `↗` for external links) set in the current text colour. Project screenshots and each project's own logo are the only images. No icon set, no emoji, no illustrations.

## Accessibility

- Text meets 4.5:1 in both themes; `muted` is never used on inverse or accent fields.
- Focus is a 2px `focus` outline at 2px offset (4px where a particle canvas surrounds the control).
- Every animated element has a readable end state with scripts off and under reduced motion.
