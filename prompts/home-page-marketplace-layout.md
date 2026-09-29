# Implementation prompt: Home page to the marketplace reference layout

## Goal

Make the Vortex home page match the layout of `design/vortex-home-page.png`, and give the site
header the Explore mega menu from `design/explore-section.png`:

- a header with an Explore menu, a pill search field, sign in, and an outlined sign-up button
- a horizontal carousel of promo cards
- a "New and popular" section with three tinted columns of compact course rows

The references are screenshots of Coursera's site. We take the **layout, spacing, and
component shapes** only. We do not take Coursera's logo, name, audience tabs, partner logos
(Google, Microsoft, AWS, and others), portraits, or promotional copy. Every card is filled
with real Vortex data from Sanity. Colors and type stay on the tokens in `app/globals.css`
(AGENTS.md §3: layout from the image, tokens from `design/coursera.design.md`).

## Skills and docs read

- `AGENTS.md` (§3 UI, §5 boundaries, §7 grounding, §13 checks).
- `design/coursera.design.md` (the tokens already in place).
- Both reference images, at display scale. The screenshots are 2× retina at a 1692px CSS
  viewport, so the content column is about 1344px wide.

## Code inspected

- `app/page.tsx`: renders `SiteHeader`, `Hero` (the navy card with search), and the "All Courses"
  grid of 3 courses. It also renders a "new courses every week" line and `ChartDecoration`.
  It fetches `COURSES_LIST_QUERY`.
- `components/layout/site-header.tsx`:
  - a synchronous server component, used by 5 pages (`/`, `/courses`, `/courses/[slug]`,
    `/lessons/[slug]`, `/search`)
  - takes `activeHref` and holds the Clerk `Show`, sign-in, sign-up, and `UserButton`
    controls, the notifications bell, and the theme toggle
- `components/nav/navbar.tsx`: the logo and the "Courses" and "My Learning" links.
- `components/search/search-form.tsx` and `components/ui/search-input.tsx`: submitting navigates
  to `/search?q=`, and ⌘K focuses the field. There is no visible submit button.
- `sanity/lib/queries.ts`:
  - `COURSE_CARD_FIELDS` has title, slug, summary, level, price, popular, studentCount,
    coverImage, instructor {name, slug, photo}, category {title, slug}, and counts.
  - `CATEGORIES_LIST_QUERY` returns 6 categories with a courseCount.
  - **There is no rating field and no created date in the card fields.**
- `lib/routes.ts`: `coursesHref`, `catalogHref(category)`, `courseHref(slug)`, `searchHref(q)`.
- `app/`: there are no instructor routes, so the menu cannot link to instructor pages.
- The live data has 10 courses in 6 categories.

## Decisions and assumptions

1. **The header changes on every page, not only home.** A different header on home would make
   the site inconsistent (see the open decisions).
2. **Header row** (76px, hairline bottom border, 48px gutter), left to right:
   - Vortex logo.
   - **Explore ▾** replaces the "Courses" link. It is active when `activeHref` is `/courses`,
     as "Courses" is today.
   - **My Learning** (it stands where the reference has "Degrees").
   - A **pill search** that fills the middle, up to 560px: rounded-full, a hairline border,
     the placeholder "What do you want to learn?", and a round primary submit button.
   - On the right: the theme toggle and the signed-in bell and `UserButton` (both kept), or
     **Sign in** (a text link) and **Sign up** (an outlined primary button, matching "Join for
     Free").
   - The reference's sparkle icon is dropped because it has no Vortex feature behind it.
3. **Explore mega menu.** It is fed from Sanity, server side, with only public fields passed to
   the client. Columns:
   - **Explore categories**: all categories, each linking to `catalogHref(slug)`, then
     "View all".
   - **Popular courses**: the top 6 by `studentCount`, linking to `courseHref`.
   - **Start as a beginner**: the Beginner-level courses, linking to `courseHref`.
   - A footer line: "Not sure where to begin? Browse all courses" (a link to `/courses`), "or
     search above."
   - Behavior:
     - It opens on click and closes on Escape, on an outside click, and on navigation.
     - The trigger carries `aria-expanded` and `aria-controls`, and Escape returns focus to it.
     - A dimmed backdrop covers the page, as in the reference.
     - Below `lg` the columns stack in a scrollable panel.
4. **Hero becomes a carousel** of promo cards (16px radius, about 300px tall, two visible
   plus a peek of the next), with pagination dots under it and prev/next buttons at `sm`
   and up.
   - **Slide 1 (dark ink card):** today's pitch, unchanged: "Search your learning in plain
     English.", the same subtitle, and an outlined "Explore courses →" button to `/courses`.
     The reference's portrait is replaced by an original Higgsfield-generated vortex
     illustration (see "Generated art").
   - **Slides 2 to 4 (pastel cards):** the 3 most popular courses. Each shows the instructor's
     photo and name (where the reference shows the partner logo), the course title, the
     summary, and a "View course →" primary button. The course cover image sits on the right.
     The fills cycle through the spec's cream `#fff4e8`, blue `#f0f6ff`, and pink `#ffe0f9`,
     as new tokens with derived dark values.
   - Mechanics: native scroll-snap, and dots that track which slide is in view. The region is
     labelled as a carousel, each slide as "n of N", and the dots are buttons. **No
     autoplay**, for accessibility.
5. **Search moves from the hero into the header.** It stays reachable on every page, with ⌘K
   still focusing it. On `/search` the page keeps its own field too, and the header field
   uses a distinct id.
6. **"New and popular"** (a 28px heading) has three `primary-100` tinted columns (16px
   radius), each with a linked title with an arrow and 3 white rows:
   - Column 1, **Most popular**: by `studentCount`. It links to `/courses`.
   - Column 2, **Beginner friendly**: Beginner level. It links to `/courses`.
   - Column 3, **Top in {category}**: the category with the most courses. It links to
     `catalogHref(slug)`. The category comes from the data, not a hardcoded slug.
   - Courses are de-duplicated across columns in that order, and an empty column is not
     rendered.
   - Each row shows:
     - a 64px cover thumbnail (monogram fallback)
     - the instructor's photo and name
     - the course title (16px/600, one line, ellipsis)
     - a meta line with the level and learner count, for example "Intermediate · 26k learners"
   - **No star ratings.** Vortex has no rating data, and AGENTS.md §7 forbids inventing it.
7. **Removed from home:** the navy search hero (its copy moves into slide 1 and search moves to
   the header), the 3-course "All Courses" grid (replaced by "New and popular"), the "new
   courses every week" line, and `ChartDecoration`. `hero.tsx` and `chart-decoration.tsx`
   become unused and are deleted.
8. **Not built:**
   - the black audience bar ("For Individuals / Businesses / …"): see the open decisions
   - the two promo banners cut off at the bottom of the reference, because their content isn't
     visible
   - the sparkle assistant icon
9. **Page width** goes from 1280px to the reference's 1344px content column (`max-w-360` with
   48px gutters).
10. **New props, all optional with the current behavior as default:**
    - `SearchInput` and `SearchForm` get `variant: "field" | "pill"`.
    - `Button` gets an `outline` variant (a primary border and text, with a `primary-50` hover).

## Windmill loader

- New `components/ui/vortex-loader.tsx`: a pinwheel made from **four copies of the Vortex
  logo triangle**, rotated 0°, 90°, 180°, and 270° around a center hub. The blades are
  `primary-600`, `primary-500`, `primary-400`, and `callout-navy-mid`. It spins continuously at
  about 1.2s per turn, so it reads as a vortex.
- It has `role="status"` and a visually hidden "Loading" label. An optional visible caption is
  passed as a prop.
- Reduced motion: the existing global rule in `globals.css` stops the spin after one frame, so
  the windmill shows static.
- Used in two places:
  1. New `app/loading.tsx`, the root route fallback. Every page is dynamic, so it shows
     during navigation: a centered windmill with "Loading…".
  2. `components/search/search-results.tsx`: while results stream, the windmill with
     "Searching your courses…" replaces the pulse skeleton cards.

## Generated art (Higgsfield)

- Images only, model `gpt_image_2_5`, at 0.25 credits each, against a balance of 128.4
  credits. Expect about 4 to 8 generations, including a retry or two, for **2 credits at
  most**.
- Every image is abstract and original. There are no people, logos, text, or imitation of
  Coursera's artwork.
- They are saved under `public/generated/`, served through `next/image`, and marked decorative
  with `alt=""`.
- The set:
  - `hero-vortex`: blue light ribbons spiralling into a bright center on ink, for slide 1.
  - If the promo banners are chosen: `banner-search` (floating video frames and a magnifying
    lens, in blue and pink) and `banner-pace` (layered paper shapes as a path, on navy).
- **No video.** A looping clip would add megabytes to every home load and motion that
  reduced-motion users would need suppressed, for little gain on a 300px card.

## Optional extras from the live page

The live site has about 15 more sections. Only the ones that real Vortex data can support are
offered. Each is built only if chosen:

- **Promo banners (2):** a blue "Search every lesson in plain English" banner with a CTA that
  focuses the header search, and a navy "Learn at your own pace" banner linking to
  `/courses`. Both use generated art.
- **Category browser:** a tinted panel with category chips as tabs, showing that category's
  course cards. Also an "Explore categories" chip row linking to the catalog filters.
- **Stats band:** the spec's navy stat panel with **real counts from Sanity**: courses,
  lessons, and hours of video.
- **Site footer:** link columns for Courses, Categories, Search, and My Learning, all real
  routes.

Not offered, because it would need invented content: testimonials, career salaries, degree
tiles, the "91% of learners" statistic, FAQs, and partner or university logos.

## Open decisions (asked in the approval panel)

- Which optional extras to build.
- The black audience bar: omit it (default) or keep it with Vortex links.
- Not asked, kept as defaults: the header changes on every page, and the carousel is the pitch
  plus featured courses.

## Files to create or change

- New `components/layout/explore-menu.tsx` (a client component: the trigger, the panel, and
  the backdrop).
- New `components/home/promo-carousel.tsx` (a client component).
- New `components/home/new-and-popular.tsx` (a server component: the columns and rows).
- `components/layout/site-header.tsx` (becomes async and fetches the menu data),
  `components/nav/navbar.tsx`, `components/search/search-form.tsx`,
  `components/ui/search-input.tsx`, `components/ui/button.tsx`,
  `components/layout/page-frame.tsx`, `app/page.tsx`, and `app/globals.css` (the 3 pastel
  tokens).
- New `components/ui/vortex-loader.tsx`, `app/loading.tsx`; edit
  `components/search/search-results.tsx` (loading state only).
- New `public/generated/*.jpg` (generated art).
- If chosen: new `components/home/promo-banners.tsx`, `components/home/category-browser.tsx`
  (client tabs), `components/home/stats-band.tsx`, `components/layout/site-footer.tsx`. The
  stats band needs one new GROQ query for the totals.
- Delete `components/home/hero.tsx` and `components/home/chart-decoration.tsx`.
- Not touched: `sanity/`, `studio/`, `lib/`, `app/api`, the search logic, PostHog, the
  progress code, and the other pages' bodies.

## Security considerations

- The menu and home data are fetched server side through `sanityFetch` with `CACHE_TAGS`. Only
  titles, slugs, levels, counts, and image URLs built on the server reach client components.
  No token reaches the browser.
- No new env values, routes, or writes.

## Accessibility

- The menu trigger is a `<button>` with `aria-expanded` and `aria-controls`. The panel is a
  labelled `nav`. Escape closes it and returns focus to the trigger.
- The carousel is a `section` with `aria-roledescription="carousel"`. Each slide is
  `role="group"` with `aria-label="n of N"`. The dots are buttons with `aria-label` and
  `aria-current`, and the prev/next buttons are labelled. There is no autoplay.
- The pill search keeps its label, and the submit button is labelled "Search".
- Contrast is checked for every text color on the ink, cream, blue, and pink cards. Focus rings
  on the dark card use an ink ring offset.

## Acceptance criteria

- At 1692px, home matches the reference's layout: header row, carousel, dots, "New and
  popular" with three tinted columns of three rows.
- The Explore menu matches `explore-section.png`: columns, "View all" links, the footer line,
  and the dimmed page.
- There is no Coursera branding, partner logo, or invented rating anywhere.
- Every link resolves to an existing route. Search from the header lands on `/search?q=`.
- At 375px: the search pill drops to its own row, the carousel shows one card plus a peek,
  the columns stack, and there is no horizontal scroll.
- Dark mode is readable on every new surface.
- Sign in, sign up, the bell, `UserButton`, and the theme toggle behave as before.

## Checks to run

- `npm run typecheck`, `npm run lint`, and `npm run build` (the header becomes async and routes
  change).
- The Playwright pass on all routes at 1692, 1440, 1024, 768, and 375px in both themes:
  overflow, fonts, and theme.
- Screenshots of home at 1692px, closed and with the menu open, viewed next to the two
  references.

## Manual test steps

1. Open `/`. The header shows the logo, Explore ▾, My Learning, the pill search, the theme
   toggle, Sign in, and Sign up.
2. Click Explore. The menu drops down over a dimmed page. Press Escape: it closes and focus
   returns to Explore. Open it again and click a category: the catalog opens filtered to it.
3. Type in the header search and press Enter or the blue button: `/search?q=…` shows results.
4. Scroll the carousel with a trackpad, the dots, and the arrows. Each course slide's
   "View course" opens that course.
5. In "New and popular", every row opens its course, and each column title opens its listing.
6. Toggle dark mode. The cards, columns, and menu stay readable.
7. At 375px, the header wraps with search on its own row, and everything stacks with no
   sideways scroll.

## Decisions recorded at approval

- Extras built: the promo banners, the category browser with its chip row, and the stats band.
  No site footer.
- The black audience bar is omitted.

## Deviations during implementation

- **`ChartDecoration` is kept.** The plan assumed it was only used on home, but the catalog and
  course pages use it too. It is removed from home only, and the file stays. Only `hero.tsx`
  was deleted.
- **The level column is "Go deeper" (Advanced), not "Beginner friendly".** The live data has
  1 Beginner course (already under "Most popular"), 6 Intermediate, and 3 Advanced, so a
  Beginner column came out empty. The column now picks Advanced first and falls back to
  Beginner, from data. The Explore menu's third column matches it ("Go deeper").
- **The "New and popular" grid adapts its column count**, so a missing column never leaves an
  empty slot.
- **The stats band needed no new query.** The totals are summed from `COURSES_LIST_QUERY`
  (`lessonCount`, `durationSeconds`), so `sanity/` is untouched.
- **Carousel slide titles use `text-display-2` (28px)**, which matches the reference card
  titles. `text-display-1` (40px) is no longer used on home.
- **Generated art was made at `quality: medium`** (0.5 credits each). High quality was 1.5
  credits each, which is over the approved 2-credit cap. Total spend: **1.5 credits** for 3
  images, with no retries. The balance was 128.4 credits and is now about 126.9.
- **Bugs caught by testing and fixed:**
  - The carousel's prev/next arrows sat under the slide text layer and could not be clicked.
    They now have `z-20`.
  - "New and popular" overflowed by 100px at 375px, because the one-line titles set the
    implicit grid track width. It now has `grid-cols-1` (`minmax(0,1fr)`).

## Verification results

- `npm run typecheck` and `npm run lint` pass. `npm run build` passes with zero error or
  warning lines.
- Interactions were tested in Playwright against the dev server:
  - The Explore menu opens with `aria-expanded=true`, Escape closes it, and focus returns to
    the trigger.
  - Carousel "Next" scrolls one slide, and the dots' `aria-current` follows.
  - An arrow key on the category tabs moves focus and selection together.
  - The header search submits to `/search?q=context+windows`.
- The route matrix covers 6 routes × 5 widths (1692/1440/1024/768/375) × 2 themes = **60/60
  pass**: no horizontal overflow, only Source Sans 3, no weight-500 text, and correct theme
  application.
- Home at 1692px was compared by eye with `vortex-home-page.png`, and the open menu with
  `explore-section.png`.
