# Implementation prompt: fanout-style Explore dropdown, a Tools page, and a premium About with a new video

Branch: `Eternal128/revamp-screen`, restarted from `origin/main` at `66601cf` (PR #3 merged).

## Goal

1. Replace the header's Explore mega menu (four columns of course links) with a small fanout-style
   dropdown, as in the reference screenshot: a white card with an icon and a label per row.
   Rows: **Blog** and **Tools** (plus **Roadmap** if the user picks it in the question).
2. Add the **Tools** page the dropdown links to.
3. Restyle `/about` in the premium fanout look, and **re-render its explainer video and the four
   step loops** in the new visual system (Geist, charcoal chrome, windmill colors, path cards).

## Skills and docs read

- `AGENTS.md` (§3 visual system, the fanout tokens), `prompts/revamp-screen-fanout-on-main.md`.
- `prompts/explainer-motion-graphics.md`: the explainer is code-rendered with Remotion from
  `studio/scripts/explainer/motion/`, over narration already voiced in `public/vo/n0–n6.mp3`.
- The reference screenshot (fanout Explore dropdown + "Info Roadmap" page) and https://fanout.sh.

## Code inspected

- `components/layout/explore-menu.tsx` (client mega menu: categories, popular, advanced, quick
  starts), `components/layout/site-header.tsx` (fetches the menu data), `components/nav/navbar.tsx`.
- `app/about/page.tsx`, `components/about/step-loop.tsx`, `public/about/*`.
- `studio/scripts/explainer/motion/src/{theme.ts,ui.tsx,Explainer.tsx,scenes/*}`, `render.mjs`:
  every scene draws with `theme.ts` colors (coral, zinc) and Source Sans 3, and the windmill in
  coral.

## Decisions

1. **Explore dropdown.** A click-to-open popover (same accessibility as today's menu: button with
   `aria-expanded`, Escape and outside click close it, focus returns to the trigger), styled as in
   the screenshot: white card, hairline border, soft shadow, 16px icon plus label rows. It lists
   Blog (`/blog`) and Tools (`/tools`), plus Roadmap (`/roadmap`) if chosen. The mega-menu data
   fetch in the header is removed, so the header gets cheaper.
2. **Nav.** `Courses` returns as a plain link (the catalog was only reachable through the mega
   menu), then `Explore ▾`, `Ideas`, `My Learning`. `Field notes` leaves the top bar because it now
   lives under Explore as Blog. The mobile menu lists the same destinations.
3. **Tools page (`/tools`).** Modeled on fanout's Labs page: a big tight headline, a "Find a tool"
   card with a filter field (client-side, `/` focuses it) and match count, and a grid of tool
   cards with an ASCII texture strip, an icon tile, a title, one line of what it does and an
   "Open …" link. The tools are **Vortex's own real features only**: Lesson search, Plan builder,
   Lesson quizzes, Resume and progress (My Learning), Ideas board, Field notes. No invented tools.
4. **Roadmap page (optional).** If chosen: `/roadmap`, a pixel-type "Learning Roadmap" title, tabs
   per category, and an SVG graph whose hub is the category and whose nodes are its real courses
   (shape and color from the path palette, lesson counts from GROQ), with an index panel listing
   the same courses by module. Data only from Sanity.
5. **About page.** Same content and order (hero with the video, Why we built it, How it works),
   restyled: mono eyebrow, huge tight headline with a pixel accent word, the video in a white
   framed card with a soft shadow, the "Why" block as a two-column editorial section with a squiggle
   rule, the four steps as white hairline cards with a mono `STEP 01` and the numbered-tile type,
   and a closing CTA band. The footer's About link stays.
6. **The new video.** Re-theme the existing Remotion project rather than generate AI footage (AI
   video invents UI; this stays accurate and free): `theme.ts` moves to the site tokens (off-white
   canvas, charcoal ink, amber accent, Geist and Geist Mono via `@remotion/google-fonts`), the
   category hues move to the path palette, the windmill takes its ocean, mint, amber and ink
   sails, and "you are here" markers use amber instead of coral. Scenes keep their timing and the
   existing narration and captions, so the story and voice-over match. Render with the sandbox's
   Chromium (`--browser-executable`) and ffmpeg, overwriting `public/about/*`.

## Security

No new data paths or write routes. The Tools page and the dropdown are static links. The Roadmap
page, if built, reads published content through the existing server-only `sanityFetch`. Videos are
static files served from `public/`.

## Files expected to change

`components/layout/explore-menu.tsx`, `components/layout/site-header.tsx`,
`components/nav/navbar.tsx`, `lib/routes.ts`, `app/about/page.tsx`,
`components/about/step-loop.tsx` (if needed), new `app/tools/page.tsx` and
`components/tools/*`, optional `app/roadmap/page.tsx` and `components/roadmap/*` plus a query,
`studio/scripts/explainer/motion/src/**`, `studio/scripts/explainer/motion/render.mjs`
(browser flag), `public/about/*` (re-rendered media), `prompts/explore-menu-tools-about-video.md`.

## Acceptance criteria

- Explore opens a small dropdown with Blog and Tools (and Roadmap if chosen), keyboard and screen
  reader accessible; the catalog is still one click from the header.
- `/tools` lists only real Vortex features and filters as you type.
- `/about` matches the site's premium look, light and dark, 360px to desktop.
- The explainer and the four loops play, show Geist and the windmill colors, and keep the
  narration and captions in sync.

## Checks

`npm run typecheck`, `npm run lint`, `npm run build` (against the local seed-data mock), the
Remotion render, and screenshots of the header dropdown, `/tools`, `/about` (plus `/roadmap`), and
stills from the video.

## Manual test steps

1. `git pull && npm run dev`, click **Explore**: the dropdown shows Blog and Tools; Escape closes it.
2. Open `/tools`, press `/`, type "quiz": one card remains.
3. Open `/about`, play the video: new look, narration and captions in sync; scroll the step loops.

## Implementation notes (added during the build)

- The user chose **Blog, Tools and Roadmap**. The Explore items live in `lib/explore.ts`, a plain
  module, because server components cannot read data exported from the `"use client"` menu.
- Mid-build the user asked for a **faster video**. The pauses around each scene were shortened
  (`LEAD` 0.5 → 0.35 s, `TAIL` 0.8 → 0.5 s) and the finished explainer and loops play at **1.2×**
  (`SPEED` in `render.mjs`; `atempo` keeps the narrator's pitch). Captions are scaled to match.
- Geist and Geist Mono are bundled as variable fonts in `motion/public/fonts/` (SIL OFL) and loaded
  with `@remotion/fonts`, so a render needs no network access.
- `render.mjs` takes `REMOTION_BROWSER` (an existing Chrome headless shell) and `FFMPEG` (a full
  ffmpeg with `setpts`; Remotion's bundled one lacks it).
- Commits on this branch are authored as `Eternal128`, as the user asked.
