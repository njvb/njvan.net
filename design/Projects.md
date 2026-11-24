# Projects

What each project is, as the site should describe it, and what its section draws on. Copy here is a starting draft for Nathan to edit.

## 01 · Tavren

- **Line.** A medieval hex-board strategy game for two to four players.
- **More.** Settle an island, build roads and villages, trade, and hold off the bandits. Plays against people on one device, online, or against the computer.
- **Stack.** `VUE 3 · TYPESCRIPT · THREE.JS`
- **Accent.** `tavren` (#FFD34D), text in `on-tavren` (#1F2A24). Tavren's own palette also has paper #FBF6EA and a red #B3261E; leave those to the screenshots.
- **Moment.** The hex board tilts into 3D.

## 02 · Kora

- **Line.** An operating system for agencies, with AI over everything.
- **More.** Clients, projects, scopes, plans, resourcing, timesheets, billing and a client portal in one place, with Ask Kora answering across all of it.
- **Stack.** `NUXT 4 · SUPABASE · AI`
- **Accent.** `kora` (#5B4BE0 light, #8B7CFF dark), Kora's own primary in both themes.
- **Moment.** The real overview screen slides in; Ask Kora asks "Which projects are off track?", the answer arrives word by word, and the off-track bar is outlined in the screen.

## 03 · Cotrip

- **Line.** Plan trips together, with AI.
- **More.** Days, places, stays and flights in one shared plan, with a group chat, packing lists and an AI planner that knows your trip. Native on iPhone.
- **Stack.** `SWIFTUI · VUE 3 · FIREBASE`
- **Accent.** `cotrip` (#F95C30), Cotrip's coral. Its brand violet (#5B3DF5) is left out so it never reads as Kora.
- **Moment.** A route draws itself across a map.

## 04 · Campaign Tower

- **Line.** Build an ad agency one floor at a time.
- **More.** A pixel-art tower game for iPhone. Hire creatives with strange habits, drive the lift yourself and win briefs from sixty made-up brands.
- **Stack.** `SWIFTUI · SPRITEKIT · STOREKIT`
- **Accent.** `tower` (#3FBF5F), from the game's pixel palette.
- **Moment.** Three phones rise in pixel steps: the front one reveals floor by floor and plays the real lift gameplay, with the lift-run and winter-tower screens fanned behind it.
- **Links.** Live on the App Store (approved 24 Nov 2026): the Apple badge goes to https://apps.apple.com/app/id6804446974 (`CAMPAIGN_TOWER_APP_STORE` in `src/data/projects.ts`), and "About the game" goes to /campaign-tower/. The original landing page at njvb.github.io/campaigntower-site stays live for App Review.

## 05 · WorldBar

- **Line.** Find a time that works for everyone.
- **More.** A menu bar app for your Mac. Keep up to 8 cities one click away, drag through the day, and see when everyone is in working hours.
- **Index.** "Find a time that works for everyone. A world clock and meeting planner in your Mac's menu bar." · `MENU BAR · MACOS`
- **Accent.** `worldbar` (#4DA3FF), text in `on-worldbar`.
- **Background.** The same light field as the hero on /worldbar/ (soft glows, two blurred orbs, a faint grid) over the azure. The one scene allowed gradients, because it is an app's own look; it is clipped with the accent wash like Campaign Tower's city.
- **Moment.** Three plates cut from the real capture fall in angled and apart, then close into the whole popover and turn to face you. The clock pills fade in with live times.
- **Links.** Live on the Mac App Store (app id 6836081075, `WORLDBAR_MAC_APP_STORE` in `src/data/projects.ts`): Apple's badge is the main button, and "See WorldBar" goes to /worldbar/, which has its own page. The TestFlight beta buttons were removed when it went live.

## 06 · PastePerfect

- **Line.** Copy anything. Paste perfectly.
- **More.** A Mac app that cleans up copied text and URLs before you paste. It strips tracking parameters, removes stray formatting and tidies messy text, all on your Mac.
- **Index.** "Copy anything, paste perfectly. Cleans tracking junk out of copied links and text." · `MENU BAR · MACOS`
- **Accent.** `pasteperfect` (#F1EDDD cream dark, #D8C9A3 sand light), text in `on-pasteperfect`.
- **Background.** Flat accent field, like the other scenes.
- **Moment.** The real window capture lands, tracking chips appear around it and are crossed out, then flung away while the link under it sheds its tracking tail. Values are `PASTEPERFECT_SCENE` in `motion.ts`.
- **Links.** "See PastePerfect" goes to /pasteperfect/. No store link until the app is live.

## 07 · Emergency Tower

- **Line.** Three patients are waiting. One lift. Who rides first?
- **More.** A pixel-art idle game about building a city's emergency services into one tower, one floor at a time. Patients arrive tagged red, amber or green, and you choose who rides the lift first, because critical cases can't wait.
- **Index.** "Three patients are waiting. One lift. Who rides first? A pixel-art triage game for iPhone." · `SWIFTUI · SPRITEKIT · STOREKIT`
- **Accent.** `emergency` (#1C2541 night navy), text in `on-emergency` (#F4F1EA). The one colour of the game's palette that sits near none of the other accents (its blue is WorldBar's, its yellow Tavren's, its amber Cotrip's).
- **Background.** Flat accent field, like the other scenes.
- **Moment.** A real whole-screen capture in a phone rises in pixel steps; three triage tags (critical, urgent, minor, each with a patience bar) drop in beside it, the bars drain, and the critical one is marked "Rides first". Values `EMERGENCY` in `motion.ts`.
- **Links.** "See Emergency Tower" goes to /emergency-tower/. No store link until the game is live (the page carries a "Coming soon" placeholder).
- **Licence.** Whole-screen screenshots only, never cut-out sprites.

## Order

Newest or most active first is the default; the order above is a draft. The index numbers (01-07) follow whatever order is chosen.
