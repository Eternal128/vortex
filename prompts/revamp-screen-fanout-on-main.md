# Implementation prompt: Revamp screen, the fanout look on current `main`

Branch: `Eternal128/revamp-screen`, cut from `origin/main` at `53746eb` (PR #1 merged). Replaces
the unmerged `claude/sweet-bell-1xjenl` work (PR #2), which targeted the pre-PR-#1 codebase and
now conflicts with it. Nothing from PR #2 is merged blindly: each piece is re-applied on top of
main's code.

## Goal

Give the current site (coral/zinc, Source Sans, plans, quizzes, real progress, creators) the
clean, premium look from the fanout reference PDF the user approved earlier, **keep the windmill
logo and recolor it** to the new palette, and bring over the two features the user asked for
(Field notes blog, Community Ideas board). No behavior of main changes: search, plans, quizzes,
progress, enroll, learner counts, Explore menu, About page and Clerk gating all stay as they are.

## Skills and docs read

- `AGENTS.md` on main (now codifies coral + Source Sans in §3; this revamp supersedes that
  paragraph at the user's request, and the paragraph is updated to describe the new system).
- `prompts/premium-restyle-blog-ideas.md` (the approved fanout plan and its security design).
- `sanity-best-practices`, `clerk-nextjs-patterns`, `node_modules/next/dist/docs/`.

## Code inspected on main

- `app/globals.css`: coral `primary-*`, zinc neutrals, `callout`, `promo-*`, Source Sans type
  scale, `lift` utility, `learner-tick`.
- `components/brand/logo.tsx`: the windmill, four sails colored `primary-600/500/400` + ink, hub
  in `surface`. Also `components/ui/vortex-loader.tsx` (same windmill, spinning).
- `components/layout/{page-frame,site-header,site-footer,explore-menu}.tsx`, `components/nav/navbar.tsx`.
- `app/page.tsx` + `components/home/*` (promo carousel, new-and-popular, plan teaser, promo
  banners, category browser/chips, stats band).
- `components/cards/{course-card,course-grid}.tsx`, `components/home/home-course.ts`, `lib/creators.ts`.
- `sanity/lib/{queries,write-client,progress,cas}.ts`, `proxy.ts` (`createRouteMatcher` gate for
  `/my-learning`, `/plans`, `/api/progress|enroll|plans`).
- `studio/schemaTypes`: **no `instructor` document any more**; creators come from `video` docs.

## Decisions

1. **Windmill colors** follow the user's pick (see question). Default: the four sails take the
   course-card palette (ink, ocean blue, mint, amber) so the mark, the path cards and the tiles
   read as one system; the hub stays white. `vortex-loader.tsx` uses the same colors.
2. **UI chrome goes monochrome** like the reference: `primary-*` becomes the charcoal action
   ramp (buttons, links, focus), with a pressed-key edge on primary buttons, pill and round icon
   buttons. The logo's accent (amber by default) becomes `brand-*`, used sparingly: "new" dots,
   the play button, live learner tick. Coral is retired.
3. **Type**: Geist (headings and body, tight display tracking), Geist Mono (spaced uppercase
   eyebrows and meta), Geist Pixel (one hero word, course card titles). Source Sans is removed.
   The existing `text-*` utilities keep their names and change their font and tracking.
4. **Shell**: off-white `#f7f7f7` canvas, white hairline cards, sticky blurred header. The header
   keeps main's Explore menu, search pill, Create plan and account controls, restyled. The footer
   keeps main's About band and adds link columns (Learn, Community, Account).
5. **Course cards**: main's catalog grid becomes the colored path cards with the CSS stack-art
   thumbnail (optional `accent` and `artLabel` course fields, deterministic fallback). They keep
   main's data: creators avatars label, live learner count, and the progress bar for signed-in
   learners.
6. **Home**: fanout hero (newest-course pill, big headline with a pixel word, Explore courses +
   Create a plan, the search field) → New and popular (main's, restyled) → Pick your path (path
   cards) → Plan teaser (main's, restyled) → Beyond the courses numbered tiles (Courses, Search,
   Plans, Field notes, Ideas, My Learning) → FAQ → footer. The promo carousel, promo banners,
   category browser/chips and stats band leave the home page (categories stay in the catalog and
   the Explore menu); their files are deleted if nothing else uses them.
7. **Course, lesson, search, plans, My Learning, About**: token-driven restyle only; eyebrows and
   headings adopt the new type. No logic changes.
8. **Field notes blog**: `post` schema with a plain `authorName` string (no instructor document
   exists), `topic` → category, optional `relatedCourse` → course, Portable Text body. `/blog`
   and `/blog/[slug]` with the "On this page" outline, related notes and Continue learning.
   Instructor pages from PR #2 are **not** ported (the content model no longer has instructors).
9. **Ideas board**: `idea` + `ideaVote` schemas, `/ideas`, `POST /api/ideas`,
   `POST /api/ideas/[id]/vote`, exactly the PR #2 design, but using main's `writeClient`.
10. Hand-drawn inline SVG line art (from PR #2) for the tiles and page headers.

## Security (unchanged from the approved plan, adapted to main)

- Write routes: Clerk `auth()` → 401; same-origin `Origin` check → 403; JSON-only → 415; 8 KB
  body cap → 413; Zod `strict()` schema, control characters stripped, ≤ 2 links → 400; server
  sets id, author, status, `origin=community`, `moderation=pending`; ≤ 3 ideas per user per 24 h
  from the dataset → 429; votes only on approved, published ideas; vote id =
  `ideaVote.<idea>.<sha256(userId)[0..24]>`, so one vote per learner.
- Plain-text rendering only; no Clerk ids reach the browser; `writeClient` stays server-only.
- `/api/ideas(.*)` is added to main's existing private matcher in `proxy.ts` (kept as main has it),
  and the handlers check the session themselves.
- Baseline headers in `next.config.ts`: `nosniff`, `Referrer-Policy`, `X-Frame-Options:
  SAMEORIGIN`, `Permissions-Policy`. No CSP.
- Context MCP filter is a type whitelist: `post`, `idea`, `ideaVote` stay out of search.

## Files expected to change

`app/globals.css`, `app/layout.tsx`, `AGENTS.md` (§3 visual paragraph), `components/brand/logo.tsx`,
`components/ui/{vortex-loader,button,badge,card,search-input,theme-toggle}.tsx`,
`components/layout/*`, `components/nav/navbar.tsx`, `components/cards/course-grid.tsx`,
`components/home/*`, `app/page.tsx`, `app/courses/**`, `sanity/lib/queries.ts`,
`sanity/lib/fetch.ts`, `sanity.types.ts`, `proxy.ts`, `next.config.ts`,
`studio/schemaTypes/**` (post, idea, ideaVote, course accent/artLabel), `studio/structure.ts`,
seed content; new `app/blog/**`, `app/ideas/**`, `app/api/ideas/**`, `components/{blog,ideas,illustrations}/*`,
`components/brand/course-stack-art.tsx`, `components/cards/path-card.tsx`, `lib/{palette,layout}.ts`,
`lib/ideas/*`.

## Acceptance criteria

- The windmill keeps its shape and uses the chosen palette in the header, footer, loader and auth.
- Every existing route renders in the new look, light and dark, 360px to desktop, no
  horizontal scroll; plans, quizzes, progress, enroll and search work as on main.
- `/blog`, `/blog/[slug]`, `/ideas` work; write routes return 401/403/415/400/429/404 as specified.

## Checks

`npm run typecheck`, `npm run lint`, `npm run build` (against a local GROQ mock of the seed data,
as before, since this sandbox has no Sanity or Clerk keys), Studio `typegen` and `sanity build`,
screenshots of home, catalog, course, lesson, blog, ideas, plans and My Learning in light, dark
and mobile.

## Manual test steps

1. `git checkout Eternal128/revamp-screen && npm install && npm run dev`.
2. `cd studio && npm run seed:build && npm run seed:import && npm run deploy` (posts, team ideas,
   card palettes, new schema).
3. Check `/`, `/courses`, a course, a lesson (quiz and progress), `/search?q=caching`,
   `/plans/new`, `/my-learning`, `/about`, `/blog`, a note, `/ideas` (post, approve in Studio,
   vote twice), and the dark-mode toggle.
