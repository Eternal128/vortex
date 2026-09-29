# Implementation prompt: Premium restyle (fanout-inspired), Field Notes blog, Community Ideas board

## Goal

Give Vortex the clean, premium look of the reference PDF (`fanout.sh_UI.pdf`, 20 desktop
screenshots) while keeping the **Vortex logo** and **every existing behavior**. Add two
features from the reference: a team-authored **blog ("Field notes")** and a **Community
Ideas board** where signed-in learners post feature ideas and upvote them.

Nothing about search, the lesson player, progress/analytics events, Clerk gating, or the
Sanity content model for courses/lessons changes behavior. This is a visual system swap plus
additive features.

## Skills and docs read

- `AGENTS.md` (loop, §3 UI rules, §5 boundaries, §7 decisions, §12 pitfalls, §13 checks).
- `sanity-best-practices` (schema, GROQ, TypeGen) and `content-modeling-best-practices` for
  the `post`, `idea`, `ideaVote` types; `clerk-nextjs-patterns` for route-handler auth and
  middleware protection; `node_modules/next/dist/docs/` for fonts, route handlers, caching and
  `revalidateTag` in Next 16.
- The reference PDF, page by page: home hero, "Pick your path" course cards, "Beyond the
  courses" numbered tiles, plans, study wall, FAQ, Explore graph, blog article + related
  notes, Ideas board, Study, Papers, paper page, Labs, Daily calendar, sign-in card.

## Code inspected

- `app/globals.css`: Tailwind v4 `@theme` tokens (orange `primary-*`, warm `neutral-*`,
  `canvas`, `surface`), `.dark` swaps, `@utility text-*` type scale, film grain.
- `app/layout.tsx` (Inter + Playfair, grain overlay, ClerkProvider, PostHog identifier).
- `components/ui/*` (button variant map with orange glow, card, badge, search-input…),
  `components/layout/*` (PageFrame with diagonal-stripe gutters, SiteHeader), `components/nav/*`
  (Navbar links to `/courses` and `/my-learning` — **`/my-learning` does not exist: dead link**).
- `components/home/hero.tsx` (paper backdrop PNGs + search form), `app/page.tsx`,
  `app/courses/page.tsx`, `app/courses/[slug]/page.tsx`, `components/cards/course-*`.
- `sanity/lib/{client,fetch,queries,token}.ts`: server-only token client; `INSTRUCTORS_*`
  queries exist but **no instructor pages exist**.
- `proxy.ts`: `clerkMiddleware()` with no protected routes.
- `studio/schemaTypes/*`, `studio/structure.ts`, `studio/scripts/context/vortex-search.ndjson`
  (Context filter is a type **whitelist** — new types stay invisible to the search agent).
- `next/font/google` in this Next version exports `Geist`, `Geist_Mono`, `Geist_Pixel`.

## Visual system (derived from the PDF)

| Role | Reference | Vortex token |
| --- | --- | --- |
| Canvas | `#f7f7f7` off-white, flat, no grain | `canvas`, `background` |
| Surface | white cards, 1px `#ececec` hairline, very soft shadow | `surface`, `canvas-line` |
| Ink | `#1f1f1f` headings, `#6b6b6b` body gray | `neutral-900/700/500` |
| Primary button | charcoal `#2b2b2b`, white text, arrow icon, subtle 3D bottom edge | `primary` variant |
| Secondary button | white, hairline border, soft bottom edge ("Sign in", "Get yourself on the list") | `tertiary` variant |
| Pill button | rounded-full outline ("New in September →") | new `pill` variant |
| Icon button | round white circle (search) | new `icon` size |
| Display type | tight grotesk, −0.04em tracking | **Geist** |
| Labels/meta | spaced uppercase mono (`PICK YOUR PATH`, `12 MODULES · 108 LESSONS`) | **Geist Mono** |
| Accent type | pixel face ("Mapped.", course card titles) | **Geist Pixel** |
| Brand accent | — | **Vortex orange stays** (logo, "live"/new pill dot, now-playing, focus accents) |

- `primary-*` ramp is remapped to the ink ramp so the 127 existing `primary-*` usages turn
  charcoal with no class churn; the orange moves to a new `brand-*` ramp used deliberately.
- Path palette (course cards): blue `#2e6b9e`, mint `#86e39c`, sand `#efe6d3`, ink `#232323`,
  lilac `#ece8f6`, sky `#dfe7f5`, forest `#1f4a33`, navy `#243155` — each with an art color
  (card stack fill) and fg color. Tile palette (Beyond tiles): rose, tangerine, white, blue,
  green, lavender, sky, butter.
- Dark mode is kept: canvas `#121212`, surfaces `#1b1b1b`, ink inverted; path/tile cards keep
  their colors (they are artwork), buttons invert (light button on dark).
- Remove the film grain, diagonal-stripe gutters, paper backdrop PNGs and `ChartDecoration`
  (delete the now-unused files). Full-width layout with a 1200px content column like the PDF.

## The course thumbnail ("stack art")

A new `CourseStackArt` component, pure CSS/SVG, no images, so every course (current and
future) gets it in both themes: faint horizontal rules, 4–5 offset rounded cards with a
halftone dot shade, the front card in the course's art color with a 2px ink border and the
course's short label in Geist Pixel (e.g. `app router`). Driven by two **optional** new course
fields: `accent` (one of the 8 path palettes) and `artLabel` (≤ 28 chars). Fallbacks:
deterministic palette from the slug hash, label from the title. No required-field changes.

## Pages

1. **Header (all pages)**: Vortex logo + wordmark, links `Courses`, `Search`, `Blog`, `Ideas`,
   `My Learning`; right side: pill "New: {newest course} →" (real data, lg+ only), round search
   icon button, theme toggle, `Sign in` (secondary) / Clerk `UserButton` + bell. Mobile: links
   collapse into a disclosure menu.
2. **Home**: LIVE-style pill for the newest course → huge tight headline with a pixel accent
   ("Search every lesson. *Found.*" style, final copy keeps Vortex's search promise) → subtitle
   → `Explore courses →` (primary) + `Browse field notes` (text link) → the existing search
   form (unchanged behavior) → decorative floating tilted cards on xl only (real course stack
   art + a real lesson key-point "note" card; `aria-hidden`) → **Pick your path** (colored
   course cards) → **Beyond the courses** numbered tiles (01 Courses, 02 Search, 03 Field
   notes, 04 Ideas, 05 Instructors, 06 My Learning) with line-art illustrations → **FAQ**
   accordion (native `<details>`, answers describe only what Vortex really does) → footer.
3. **Catalog `/courses`**: eyebrow + title, mono category filter chips, grid of path cards.
   Path card: mono uppercase category, title in pixel/mono, up to 3 learning outcomes as
   `+ title`, `N MODULES · N LESSONS · N FREE` (all derived by GROQ), `Open course →`.
4. **Course page**: colored hero panel with stack art; outcomes/curriculum/progress restyled
   via tokens; instructor links to the new instructor page.
5. **Lesson + Search pages**: token/typography restyle only. No logic changes.
6. **Instructors**: `/instructors` and `/instructors/[slug]` (queries already exist).
7. **My Learning** `/my-learning` (fixes the dead nav link): Clerk-protected in `proxy.ts`,
   presentational per §7 — greeting, "Continue where you left off" empty state (progress
   records are not built yet), and the path-card grid.
8. **Sign in / Sign up**: centered white card on canvas with the Vortex mark, "Welcome back",
   Clerk `appearance` variables (ink primary, Geist, 10px radius) — still Clerk's components.
9. **Footer**: logo, columns `Learn` (Courses, Search, Instructors), `Community` (Field
   notes, Ideas), `Account` (My Learning, Sign in), small print.
10. **Design system page**: swatches and samples updated to the new tokens.

## Feature: Field notes (blog) — read-only content

- Sanity `post` document: `title`, `slug`, `excerpt` (≤ 220), `publishedAt`, `author` →
  instructor, `topic` → category, `relatedCourse` → course (optional), `body` (existing
  `blockContent`), preview. Studio structure gets a "Field notes" item.
- `/blog`: eyebrow `FIELD NOTES`, title, topic filter chips (URL param), cards with mono topic,
  title, excerpt, `Read article →`.
- `/blog/[slug]`: `← All field notes`, mono `date · topic`, big title, excerpt,
  `By {author} · N min read` (word count via GROQ `pt::text`), Portable Text body with h2
  anchors, sticky **On this page** TOC with scroll-spy (client component, IntersectionObserver),
  **Related notes** (same topic, 3), **Continue learning** card to the related course, and
  `blog_post_viewed` PostHog event. `generateMetadata`, `generateStaticParams`, cache tag `post`.
- Seed: 3 short, accurate posts tied to seeded courses added to `studio/scripts/seed` so
  `npm run seed:build && seed:import` creates them.

## Feature: Community Ideas board — the only new write path

- Sanity `idea` document: `title`, `description` (plain text), `kind`
  (feature | content | improvement), `status` (open | planned | shipped | declined), `origin`
  (team | community), `moderation` (pending | approved | rejected), `authorId` (Clerk id,
  read-only, hidden), `authorName`, `createdAt`.
  Sanity `ideaVote`: `idea` (weak reference), `voterId`. Studio: "Community" section with
  "Ideas awaiting review" (moderation == pending), "All ideas", and hidden votes.
- `/ideas` (server-rendered, `dynamic`): eyebrow `FEATURE REQUESTS`, "Ideas", illustration,
  sort tabs **Top / New** and status tabs **All / Open / Planned / Shipped** with counts (URL
  params), idea cards (upvote button + count, `TEAM`/`COMMUNITY`, status, kind, relative time,
  author), `+ Post an idea` (ink button). Signed-out users see Clerk's sign-in modal on post or
  vote. The viewer's own pending ideas show at the top tagged `IN REVIEW`.
- `POST /api/ideas` → create; `POST /api/ideas/[id]/vote` → toggle vote. Client components
  call these; optimistic vote count with rollback on error.
- PostHog: `idea_submitted`, `idea_voted` (id and kind only, never the text).

## Security considerations

- **AuthN**: both write routes call Clerk `auth()` and return 401 without a `userId`; `/my-learning`
  checks the session in the page and redirects to sign-in. (Implementation note: the plan named
  `createRouteMatcher` in `proxy.ts`, but this Clerk version deprecates it in favour of checks where
  the data is read, so the checks live in the page and route handlers; `proxy.ts` stays
  `clerkMiddleware()`.)
- **CSRF**: writes accept only `POST` with `Content-Type: application/json` and an `Origin`
  header equal to the request's host; Clerk session cookies are `SameSite=Lax` on top of that.
- **Validation**: Zod schemas with trim, length bounds (title 8–90, description 20–600), enum
  `kind`, control characters stripped, at most 2 URLs per idea (spam brake). Unknown fields are
  rejected. The server — never the client — sets `status=open`, `origin=community`,
  `moderation=pending`, `authorId`, `authorName`, `createdAt`, and the `_id` (`idea.<uuid>`).
- **Moderation**: community ideas are invisible to others until a team member approves them in
  the Studio. Only approved ideas can be voted on (the route verifies `_type == "idea"` and
  `moderation == "approved"`, and the id matches `^[A-Za-z0-9._-]{1,128}$`).
- **Rate limiting**: max 3 ideas per user per 24h, counted from the dataset (works on
  serverless, no in-memory state). Votes are idempotent: the vote `_id` is
  `ideaVote.<ideaId>.<sha256(userId)[0..24]>`, so repeated requests cannot inflate counts.
- **XSS**: idea text renders as plain React text (auto-escaped); no markdown, no
  `dangerouslySetInnerHTML`. Blog Portable Text links get `rel="noopener noreferrer"` on
  external hosts, and only `http(s)` hrefs are allowed by the schema.
- **Secrets**: new `SANITY_API_WRITE_TOKEN` (Editor), server-only, used only by
  `sanity/lib/write-client.ts` (imports `server-only`), added to `.env.example`. `authorId`
  and voter ids never reach the browser: queries compute `isMine`/`hasVoted` server-side.
- **Privacy**: display name stored as first name + last initial (or "Learner"); never email.
- **Search isolation**: the Context MCP filter is a type whitelist, so `post`, `idea` and
  `ideaVote` stay out of the search agent. No change to the search route.
- **Headers**: `next.config.ts` adds `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`,
  `Permissions-Policy` (camera/mic/geolocation off). No CSP, so Clerk, PostHog and the video
  embeds keep working.

## Illustrations

Line-art illustrations for the six Beyond tiles and the Ideas header are generated with the
Higgsfield MCP (black ink line drawing, transparent or white background, rendered with
`mix-blend-multiply` on the colored tiles) and saved to `public/illustrations/`. If generation
fails or is unavailable, hand-authored inline SVG line drawings are used instead.

Implementation note: generation succeeded, but the environment's network policy blocked the
Higgsfield CDN host, so the fallback was used: `components/illustrations/line-art.tsx` holds six
hand-drawn inline SVGs that stroke `currentColor` (no binary assets, correct in both themes).

## Files expected to change

- `app/globals.css`, `app/layout.tsx`, `next.config.ts`, `proxy.ts`, `.env.example`
- `components/ui/{button,badge,card,search-input,select}.tsx`, `components/layout/*`,
  `components/nav/navbar.tsx`, `components/brand/logo.tsx` (colors only; shape unchanged)
- `components/home/*` (new hero, path cards section, beyond tiles, FAQ), new
  `components/brand/course-stack-art.tsx`, `components/cards/path-card.tsx`,
  `components/layout/site-footer.tsx`
- `app/page.tsx`, `app/courses/**`, `app/lessons/[slug]/page.tsx` (classes only),
  `app/search/page.tsx` (classes only), `app/sign-in/**`, `app/sign-up/**`,
  `app/design-system/page.tsx`
- New: `app/blog/**`, `app/ideas/page.tsx`, `app/api/ideas/route.ts`,
  `app/api/ideas/[id]/vote/route.ts`, `app/instructors/**`, `app/my-learning/page.tsx`,
  `components/blog/*`, `components/ideas/*`, `lib/ideas/*`, `sanity/lib/write-client.ts`
- `sanity/lib/queries.ts`, `sanity/lib/fetch.ts` (tags), `sanity.types.ts` (TypeGen)
- `studio/schemaTypes/**` (`post`, `idea`, `ideaVote`, course `accent`/`artLabel`),
  `studio/structure.ts`, `studio/scripts/seed/*` (posts)
- Deleted: `public/hero-light.png`, `public/hero-dark.png`, `components/home/chart-decoration.tsx`

## Acceptance criteria

- Every existing route renders with the new system in light and dark, from 360px to desktop,
  with no horizontal scroll; the Vortex logo is unchanged in shape.
- Search, lesson playback with `?t=`, analytics events and Clerk sign-in work exactly as before.
- Path cards show only real data (outcomes, counts, category); no invented numbers anywhere
  (no fake "online" counters, prices, or social proof).
- `/blog` and `/blog/[slug]` render seeded posts with a working TOC and related notes.
- `/ideas`: signed-out users can read and are prompted to sign in to post/vote; signed-in
  users can post (goes to review), see their pending idea, and toggle one vote per idea.
- Write routes reject: no session (401), cross-origin (403), bad JSON/fields (400), more than
  3 ideas a day (429), votes on unapproved or non-idea ids (404).
- `/my-learning` redirects signed-out users to sign in.

## Checks to run

- Web: `npm run typecheck`, `npm run lint`, `npm run build` (routes, config and server code
  change). Build needs the Sanity env vars; if they are absent in this environment, report that
  honestly rather than claiming a pass.
- Studio: `npm run typegen` (schema extract + TypeGen) and `sanity build`. Studio deploy,
  schema deploy and `seed:import` need the owner's Sanity credentials: listed for the user.

## Manual test steps

1. Add `SANITY_API_WRITE_TOKEN` (Editor token) to `.env.local`.
2. `cd studio && npm run seed:build && npm run seed:import && npm run deploy` (adds posts and schema).
3. `npm run dev`, open `/`: check hero, path cards, Beyond tiles, FAQ, footer; toggle dark mode.
4. `/courses` → a path card → course page → a lesson → play; `/search?q=caching` → open a video result.
5. `/blog` → an article: scroll and watch "On this page" highlight; related notes link.
6. `/ideas` signed out → click upvote → Clerk modal. Sign in → post an idea → it shows `IN REVIEW`.
7. In the Studio, "Ideas awaiting review" → approve it → refresh `/ideas` → vote, refresh, vote again (toggles).
8. `/my-learning` in a private window → redirected to sign in.
