# Implementation prompt: Restyle Vortex to the Coursera-style design spec

## Goal

Reskin the whole web app so it reads as built on the design system in
`design/coursera.design.md`: white canvas, one voltage blue (`#0056d2`) for actions and
links, a navy (`#002761`) callout surface, one typeface (Source Sans), rectangular 8px
buttons, 50px capsule chips, 16px hairline-bordered cards, and no decorative shadows.

This is visual only. Routes, data fetching, Sanity queries, Clerk gating, PostHog events,
progress writes, search behavior, component props, hooks, and state stay exactly as they are.

This spec supersedes the PNG references in `design/*.png` and the token sheet in
`prompts/design-system.md` as the visual source of truth.

## Skills and docs read

- `AGENTS.md` (workflow, section 3 UI rules, section 13 checks).
- `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`: variable fonts
  need no `weight`; `next/font/google` exposes the family through a CSS `variable`.
- `design/coursera.design.md` in full (tokens, components, do's and don'ts, known gaps).
- No Sanity, Clerk, or PostHog skill is needed: nothing in those layers changes.

## Code inspected

- `app/globals.css`: Tailwind v4 CSS-first theme. All tokens live in `@theme`; `.dark`
  swaps the same names; the type scale is `@utility text-*`. No `tailwind.config` exists.
- `app/layout.tsx`: loads Inter (`--font-inter`) and Playfair Display (`--font-playfair`)
  and renders a fixed film-grain overlay.
- `components/ui/*`: `button`, `card`, `badge`, `search-input`, `select`, `progress-bar`,
  `status-indicator`, `avatar`, `theme-toggle`. They are variant maps over token classes.
  `button.tsx` hardcodes an orange glow shadow (`rgba(234,90,11,…)`).
- `components/layout/page-frame.tsx` (1440px column, diagonal-stripe gutters),
  `components/layout/site-header.tsx`, `components/nav/navbar.tsx`.
- `components/home/hero.tsx` (centered search hero on a generated paper backdrop,
  `public/hero-light.png` / `hero-dark.png`) and `app/page.tsx`.
- `components/brand/logo.tsx` (3 hardcoded orange/white hex values) and
  `components/brand/course-marks.tsx` (Docker, TypeScript, Next.js marks in their own
  brand colors).
- `app/design-system/page.tsx` (555 lines): the living token sheet, 15 hardcoded swatch hex values.
- Usage across 59 `.tsx` files: 127 `primary-*` classes, 50 `canvas`/`canvas-line`,
  23 `font-display`, 21 `font-medium`, 22 `shadow-*`, and about 150 arbitrary values,
  almost all font sizes such as `text-[15px]` and `text-[13px]`.
- Git: branch `main` has no commits; everything is untracked. `.env.local` is ignored.

## Decisions and assumptions

1. **Remap token values, keep token names.** Components already speak `primary-*`,
   `neutral-*`, `canvas`, `surface`. Changing values in `@theme` reskins most of the app with
   no class churn. New names are added only for roles that do not exist yet (navy callout,
   text on primary).
2. **Font:** Source Sans Pro is published on Google Fonts as **Source Sans 3**, exported by
   `next/font/google` as `Source_Sans_3`. It is a variable font. No npm package is added.
   Inter and Playfair are removed. `--font-display` is pointed at the same sans stack so the
   23 `font-display` usages cannot fall back to a serif. They are then swept to type utilities.
3. **Weights are 400, 600, and 700 only.** Every `font-medium` (500) becomes `font-semibold`.
4. **Type sizes snap to the spec scale by role, not by nearest pixel.** Arbitrary
   `text-[Npx]` values become utilities. Meta and card text goes to 14px, lead paragraphs to
   16px, and headings to the heading utilities.
5. **Hero headline size:** see "Open decisions". Default: add one documented extension,
   `text-display-1` at 40px / 600, used only for the home `h1`, because the spec's
   largest size (28px) comes from a split marketing hero, not a search-first one.
6. **Home hero treatment:** see "Open decisions". Default: keep today's content and order
   (eyebrow, h1, subtitle, Explore Courses, search) inside a `callout-card-navy` surface
   (navy fill, white text, voltage-blue CTA, 16px radius, 32px padding). The search field stays
   white on the navy.
7. **Decoration:** see "Open decisions". Default: stop rendering the film grain, the diagonal
   stripe gutters, and the paper backdrop images. The spec calls for a flat white canvas with no
   atmospheric imagery. The PNG files stay in `public/` and are not deleted. `ChartDecoration`
   is kept and recolored to tokens.
8. **Dark mode is kept.** The spec lists dark mode as a known gap, so the dark values below
   are derived from its blue and gray ladders. They are marked "derived".
9. **Text on primary gets its own token.** In dark mode the primary blue has to lighten
   (`#3587fc`) to stay readable as link text on near-black. White on `#3587fc` is 3.5:1 and
   fails AA, so buttons use `text-on-primary`: white in light mode, ink in dark mode (5.4:1).
10. **Button heights:** `md` becomes the spec's 36px. `lg` stays 44px. `xl` (hero) becomes 48px
    to match the spec's input height. All of them are above the 24px AA target-size minimum.
11. **Badges follow `skill-chip`:** 2px radius and a tinted fill. The label text and content
    are unchanged; only the CSS transform, size, and colors change.
12. **Course marks keep their colors.** Docker blue, TypeScript blue, and Next.js black are the
    technologies' own marks, not Vortex palette.
13. **The Vortex logo** keeps its shape. Its fills move from hex to `var(--color-primary-*)`
    and `var(--color-surface)`, so it turns blue and follows dark mode.
14. **No Coursera assets:** no logo, name, partner logos, copy, or imagery. Only the design
    language. `metadata` and UI copy still say Vortex.
15. **Clerk's hosted UI** (the sign-in modal, `UserButton`, and the `/sign-in` and `/sign-up`
    pages) is left on Clerk's defaults. Theming it needs an `appearance` prop on
    `ClerkProvider`. That is visual, but it is a third-party config change, so it goes under
    "Needs your attention" rather than being done silently.
16. **AGENTS.md section 3** still says the `design/*.png` images are the source of truth. It is
    updated to name `design/coursera.design.md`, so future agents do not "restore" the old look.
17. **Page width** moves from 1440px (`max-w-360`) to the spec's ~1280px content column
    (`max-w-320`), with 48px desktop gutters.

## Open decisions (asked in the approval panel)

- Home hero: navy callout card (default) or flat white.
- Home `h1`: 40px extension (default) or strict 28px spec maximum.
- Decoration (grain, stripes, paper backdrop): remove (default) or keep.

## Token mapping (spec token → `app/globals.css`)

### Colors, light (`@theme`)

| Spec token | Value | Lives at | Replaces |
|---|---|---|---|
| primary-pressed | `#0048b0` | `--color-primary-600` | `#ea5a0b` |
| primary | `#0056d2` | `--color-primary-500` | `#f97316` |
| callout-blue-bright | `#3587fc` | `--color-primary-400` | `#fb923c` |
| *(derived)* | `#8fb4f0` | `--color-primary-300` | `#fdba74` |
| *(derived)* | `#c2d8fa` | `--color-primary-200` | `#fed7aa` |
| primary-soft | `#e3eeff` | `--color-primary-100` | `#ffeee5` |
| primary-xsoft | `#f0f6ff` | `--color-primary-50` (new) | none |
| ink | `#0f1114` | `--color-neutral-900` | `#1c1917` |
| ink-soft | `#1e2229` | `--color-neutral-700` | `#44403c` |
| body-muted | `#5b6780` | `--color-neutral-500` | `#78716c` |
| body-mid | `#8495b0` | `--color-neutral-300` | `#d6d3d1` |
| hairline | `#dae1ed` | `--color-neutral-200` | `#e7e5e4` |
| surface-tint | `#e8eef7` | `--color-neutral-100` | `#f5f5f4` |
| *(derived)* | `#f5f8fc` | `--color-neutral-50` | `#fafaf9` |
| canvas | `#ffffff` | `--color-background`, `--color-surface`, `--color-canvas` | cream values |
| hairline | `#dae1ed` | `--color-canvas-line` | `#efe6de` |
| callout-navy | `#002761` | `--color-callout-navy` (new) | none |
| callout-navy-mid | `#003b8f` | `--color-callout-navy-mid` (new) | none |
| surface-tint / callout-navy | `#e8eef7` / `#002761` | `--color-lesson-bg` / `--color-lesson-fg` | indigo pair |
| feedback success | `#276a1a` | `--color-success` | `#16a34a` |
| *(role)* | `#ffffff` | `--color-on-primary` (new) | literal `text-white` on primary fills |

### Colors, dark (`.dark`, all derived)

`primary-600 #6ea7ff`, `primary-500 #3587fc`, `primary-400 #0056d2`,
`primary-300 #3a5a8c`, `primary-200 #102c57`, `primary-100 #0b1f3f`, `primary-50 #08172f`;
`neutral-900 #f2f5fa`, `700 #d4dbe7`, `500 #a4b0c6`, `300 #5b6780`, `200 #2a3140`,
`100 #1e2229`, `50 #171a20`; `background #0f1114`, `surface #1e2229`, `canvas #0f1114`,
`canvas-line #2a3140`; `callout-navy #002761`, `callout-navy-mid #003b8f`;
`lesson-bg #1a2436`, `lesson-fg #b0e5fb` (spec accent-blue-info); `success #4ade80` (unchanged);
`on-primary #0f1114`.

### Typography

- `--font-sans: var(--font-source-sans), Arial, sans-serif`; `--font-display: var(--font-sans)`.
- Utilities (existing names redefined, new spec roles added):

| Utility | Spec role | Size / line / weight / tracking |
|---|---|---|
| `text-display-1` | extension (home `h1`) | 40 / 48 / 600 / -0.4px (28px if strict) |
| `text-display-2` | display-md | 28 / 32 / 600 / -0.28px |
| `text-heading-1` | display-md | 28 / 32 / 600 / -0.28px |
| `text-heading-2` | heading-md | 20 / 28 / 600 / -0.1px |
| `text-heading-3` | heading-sm | 16 / 20 / 600 / -0.048px |
| `text-subtitle` (new) | subtitle-md | 14 / 18 / 600 / -0.042px |
| `text-body-lg` | body-md | 16 / 24 / 400 |
| `text-body` | body-sm | 14 / 20 / 400 |
| `text-small` | body-xs | 12 / 18 / 400 |
| `text-action` (new) | action-primary | 14 / 20 / 600 / +0.14px |
| `text-nav` (new) | nav-link | 16 / 24 / 600 |
| `text-caption` (new) | caption | 12 / 12 / 400 |

### Radius, spacing, shadow

- `--radius-xs 2px`, `--radius-sm 4px`, `--radius-md 8px`, `--radius-lg 16px`,
  `--radius-xl 24px`. Pills keep `rounded-full` (it renders the same as the spec's 50px capsule).
- Spacing: Tailwind's 4px base already produces every spec step (8, 12, 16, 24, 32, 48, 64,
  80). No new tokens are needed.
- Shadows are re-tinted to ink: `shadow-sm`/`md` = spec level1
  (`0 0 4px 0 rgb(15 17 20/10%), 0 2px 12px 2px rgb(15 17 20/10%)`), `shadow-lg` = level2,
  `shadow-xl` = level3. Shadow classes come off cards, buttons, and the eyebrow pill. They stay
  only on floating things (the skip link and menus).

## Files to create or change

Step 0: baseline
- A git commit of the current tree on a new branch `restyle/coursera-design`, so every later
  step has a reviewable diff.

Step 1: tokens and globals
- `app/globals.css`: token values, dark values, type utilities, body font.
- `app/layout.tsx`: `Source_Sans_3` replaces Inter and Playfair; grain `div` removed (decision 7).

Step 2: primitives
- `components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `search-input.tsx`, `select.tsx`,
  `progress-bar.tsx`, `status-indicator.tsx`, `avatar.tsx`, `theme-toggle.tsx`.

Step 3: layout shell
- `components/layout/page-frame.tsx`, `components/layout/site-header.tsx`,
  `components/nav/navbar.tsx`, `components/nav/breadcrumbs.tsx`, `components/nav/pagination.tsx`,
  `components/brand/logo.tsx`.

Step 4: pages and features, one at a time
- Home: `components/home/hero.tsx`, `components/home/chart-decoration.tsx`, `app/page.tsx`.
- Catalog: `app/courses/page.tsx`, `components/catalog/category-filter.tsx`,
  `components/cards/course-card.tsx`, `components/cards/course-grid.tsx`.
- Course: `app/courses/[slug]/page.tsx`, `components/course/*`.
- Lesson: `app/lessons/[slug]/page.tsx`, `components/lesson/*`,
  `components/cards/lesson-card.tsx`, `lesson-video-card.tsx`, `resource-card.tsx`.
- Search: `app/search/page.tsx`, `components/search/*`.
- Auth wrappers: `app/sign-in/…`, `app/sign-up/…` (page chrome only).
- Token sheet: `app/design-system/page.tsx`.
- Docs: `AGENTS.md` section 3 (decision 16).

Not touched: `lib/`, `sanity/`, `studio/`, `agent/`, `proxy.ts`, API routes,
`instrumentation-client.ts`, `components/analytics/*`, `components/posthog/*`, `sanity.types.ts`.

## Requirements per component

- **Button:** 8px radius, `text-action`, `font-semibold`, no glow shadow.
  - `primary`: `bg-primary-500 text-on-primary`, hover `bg-primary-600`.
  - `secondary`: spec secondary (white fill, 1px ink border, ink label), hover `bg-neutral-50`.
  - `tertiary`: hairline border on surface.
  - `text`: primary text, underline on hover.
  - Disabled: `bg-neutral-100 text-neutral-300` / `border-neutral-200`.
- **Inputs (search, select):** 48px tall for `md`, 8px radius, 1px `neutral-900` border.
  Focus is a 2px primary edge drawn with `border-primary-500` plus a 1px ring, so the layout
  does not shift. The placeholder uses `neutral-500` (5.7:1).
- **Card:** hairline border, 16px radius, 16px padding, no shadow, no hover lift. A hover
  state, if any, is a border color change only.
- **Badge (`video`, `lesson`, `popular`):** skill-chip geometry (2px radius, `4px 8px`,
  `text-small`, `font-semibold`).
  - `video` / `popular`: `primary-100` fill with `primary-500` text.
  - `lesson`: `lesson-bg` fill with `lesson-fg` text.
- **Category filter chips:** `category-pill` (capsule, hairline border, `text-action`).
  The active chip is the tinted variant (`bg-neutral-100`, no border) with a primary text or
  outline cue, so the state never relies on color alone.
- **Header:** white, 76px tall, hairline bottom border, 48px desktop gutter.
  - Nav links are `text-nav` in ink, hover primary.
  - The active link is primary and keeps `aria-current`.
- **Page frame:** white canvas, a 1280px centered column, no stripes, no side rules.
- **Section headings:** `text-heading-2`, or `text-heading-1` for page titles.
  "View all" style links use `link-inline` (primary, underline on hover).
- **Progress bar:** `neutral-100` track, `primary-500` fill. Completion marks use `success`.
- **Lesson tabs:** ink labels. The active tab is primary with a 2px primary underline, and the
  hairline base rule is kept.
- **Lesson sidebar and resume states:** the "now playing" row gets a `primary-50` tint. All
  existing states are kept.
- **Search results page:** result cards are course-tile cards. Counts are `text-body`
  `neutral-500`. The sort control uses the `Select` primitive. The empty state is kept.
- **Navy surfaces:** the home hero (decision 6) is the only navy callout. Inside it:
  - Text is white; secondary copy is white at 80% opacity (checked at 4.5:1 or more on navy).
  - The CTA is the primary button.
  - Focus rings use `ring-offset-callout-navy`, so they stay visible.
- **Design-system page:** swatches, type specimens, and radii regenerate from the new tokens.
  Hardcoded hex values in that page become `var(--color-…)` references wherever it renders a live
  token.

## Rules that bind every step

- Only `className` strings, style files, theme tokens, the font import, and layout-only markup
  (wrappers, removed decorative elements) change.
- No prop, signature, handler, hook, state, query, route, or data-model change.
- If a visual change needs any of those, stop and ask.
- No feature, button, field, or screen is removed.
- Every `aria-*`, label, `sr-only`, `aria-current`, focus-visible ring, and the skip link is
  preserved.
- No new npm dependency.

## Security considerations

- No server, env, token, or auth-boundary change.
- The baseline commit must not include secrets. `.env.local` is gitignored (verified), and the
  staged file list is checked for anything `.env*` except `.env.example` before committing.
- The font is self-hosted by `next/font` at build time. No runtime third-party font request is
  added.

## Accessibility

- AA contrast verified for:
  - white on `#0056d2` (6.4:1)
  - `#0056d2` on `#e3eeff` (5.5:1)
  - `#5b6780` on white (5.7:1)
  - white on `#002761` (about 14:1)
  - dark: `#3587fc` on `#0f1114` (5.4:1) and ink on `#3587fc` (5.4:1)
- `#8495b0` (2.9:1) is used only for disabled states, which WCAG exempts.
- Focus-visible rings stay on every interactive element and use the primary color, with a
  surface-colored offset (a navy offset inside the navy card).
- Active and selected states pair color with a second cue (weight, underline, fill, or
  `aria-current`).
- `prefers-reduced-motion` handling in `globals.css` is kept.

## Acceptance criteria

- The app renders in Source Sans at weights 400, 600, and 700. No Inter, Playfair, or serif
  appears anywhere.
- No orange remains in either theme. Primary actions and links are `#0056d2` (light mode).
- The canvas is flat white: no grain, stripes, or backdrop image (unless the decision says
  keep).
- Buttons are 8px rectangles; filter chips are capsules; cards are 16px with a hairline and
  no shadow.
- No `text-[Npx]` font-size arbitrary values remain in `app/` or `components/`. Layout
  arbitrary values (widths, `mask-image`) may stay.
- Dark mode toggles cleanly on every page, with nothing unreadable.
- Every route behaves exactly as before:
  - catalog filtering and pagination
  - course resume and progress
  - lesson video, tabs, bookmark, and footer nav
  - search submit, sort, and empty state
  - sign in and out
  - PostHog events still fire
- `git diff` from the baseline shows only styling, token, font, and layout-markup changes.

## Checks to run

After each step (1 to 4), in the web workspace:
- `npm run typecheck`
- `npm run lint`
- `npm run build` (after steps 1 and 4 at least, since `globals.css` and `layout.tsx` are global).
- There is no test script in `package.json`, so no test suite runs. The report will say so.
- A diff review: `git diff --stat` plus a scan of changed lines for anything besides
  `className`, style, and token content.

At the end: `npm run dev`, then a visual pass of every route in light and dark mode at
1440, 1024, 768, and 375px widths.

## Manual test steps

1. Run `npm run dev` and open `/`. The page is white, the hero is a navy card with a blue
   "Explore Courses" button, and the text is Source Sans with no serif.
2. Tab through the header and hero. Every control shows a visible blue focus ring, including
   inside the navy card.
3. Type a query in the hero search and submit. `/search` loads with results, a count, and a
   working sort; cards have hairline borders and no shadow.
4. Open `/courses`. The category chips are capsules, the active chip is clearly marked, and
   filtering and pagination still work.
5. Open a course. The hero, outcomes, module list, and progress bar are blue and neutral, and
   the resume link works when signed in.
6. Open a lesson. The video plays, the tabs switch with a blue underline, the sidebar marks the
   current lesson, the bookmark toggles, and the footer nav moves between lessons.
7. Toggle the theme. Every page above is readable in dark mode, and primary buttons show ink
   text on the bright blue.
8. Sign in and out through the header. The Clerk modal opens and closes as before (it keeps
   Clerk's default look).
9. Resize to 375px. The header wraps, the hero card stacks, the grids go to one column, the
   lesson sidebar collapses, and there is no horizontal scroll.
10. Open `/design-system`. Swatches, type, and radii show the new tokens.
