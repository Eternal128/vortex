# Implementation prompt: Coursera-style footer, and no scroll animation on home

## Goal

1. **Remove the "smoothing" animation on home:** the sections that ease in as you scroll (the
   `reveal` utility). The page renders instantly, with no scroll-driven animation work.
2. **Add a site footer like Coursera's** (your screenshots): a light grey band with 4 columns,
   each with a bold heading and a plain list of links, on every page.

## Code inspected

- `app/globals.css`: the `reveal` utility, a CSS scroll-driven animation, plus the
  `reveal-in` keyframes.
- It is used on 6 home sections: `new-and-popular`, `plan-teaser`, `promo-banners`,
  `category-browser`, `category-chips`, and `stats-band`.
- `html { scroll-behavior: smooth }` in `globals.css`.
- The hover `lift` on cards stays (you asked for it earlier). It is transform-only and runs only
  on hover.
- `components/layout/page-frame.tsx` renders every page (with a header slot). There is no footer
  today.
- Footer data comes from the same cached queries the header and home already use
  (`COURSES_LIST_QUERY`, `CATEGORIES_LIST_QUERY`), so no new fetch cost.

## Decisions

- **Performance:**
  - Delete the `reveal` utility and its keyframes, and remove the class from all 6 sections.
  - Drop `scroll-behavior: smooth`: anchor jumps become instant, which also avoids scroll jank on
    long pages.
  - Keep only the first hero image as `priority`. Everything else stays lazy (the `next/image`
    default).
- **Footer:**
  - Coursera's layout and typography: `bg-neutral-100`, 4 columns at desktop (2 on tablet, 1 on
    phone), 20px semibold headings, and 16px links in `neutral-700` that underline on hover.
  - **Real routes only.** Coursera's "About / Careers / Leadership / App Store" links have
    nothing behind them in Vortex, so they are not copied.
  - The columns:
    - **Categories:** all 6, each to its catalog filter.
    - **Popular courses:** the top 6 by learners.
    - **Go deeper:** the Advanced courses.
    - **Vortex:** All courses, Build your own plan, Search, and My Learning.
  - A bottom line: "© 2026 Vortex. Videos belong to their YouTube creators."
- Rendered through `PageFrame`, so it appears on every page. It is a server component, with no
  client JavaScript.

## Files

- `app/globals.css`
- The 6 home section components
- New `components/layout/site-footer.tsx`
- `components/layout/page-frame.tsx`

## Checks

- Typecheck, lint, and build.
- No `reveal` or `animation-timeline` left.
- A footer screenshot compared with your reference.
- The 60-case route matrix (footer responsive, no overflow).

## Manual test

1. Scroll home: sections appear immediately, with no fade or slide.
2. Scroll to the bottom of any page: a grey footer with 4 columns.
3. Every link opens a real page.
