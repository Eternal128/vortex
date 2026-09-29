# Implementation prompt: Live learner counts, and real images in place of placeholders

## Goal

1. **Learner counts are real and live.** Every "26k learners" and "12k students" is replaced by
   the number of people actually learning on Vortex. It updates on screen while the page is open
   when someone enrolls or starts a lesson.
2. **No placeholder images.** Every image shows what it is actually for.

## Skills and docs read

- AGENTS.md:
  - §5: the browser never holds a token, and reads go through server routes.
  - §7: progress is app state, written only by server routes.
  - §8: the data model.
  - §12: the private dataset.
- sanity-best-practices, for the schema change, TypeGen, and asset import.
- Next 16 docs, for route handlers and fetch caching.

## What is fake today (inspected)

- **Learner counts.** `course.studentCount` and `lesson.studentCount` are hand-typed seed
  numbers ("26k", "12k", "8.6k"). They are shown on:
  - catalog cards (`course-grid` / `course-card`)
  - home cards (`home-course.ts` meta)
  - the course hero (`course-hero.tsx`)
  - the lesson header (`lesson-header.tsx`)

  "New and popular" is also sorted by them.

  The real signal already exists: every learner's `progress.<clerkUserId>` document holds their
  `enrollments[]` and per-lesson `lessons[]`. There are currently **0** progress documents, so
  real counts start at zero.
- **Course covers:** `picsum.photos` random stock photos (a forest, a galaxy, a laptop, a blank
  grey card). Nothing matches its course.
- **Instructor photos:** `randomuser.me` synthetic faces, for five **fictional** instructors
  (`studio/scripts/seed/content.mjs` says so). The videos are actually by real YouTube creators:
  - there are 120 videos, and the channel is recorded on every `video` document
  - a course draws on 7–12 different channels (for example, IBM Technology, TechWorld with
    Nana, ByteByteGo, Web Dev Simplified)
- **Lesson thumbnails are real** (each video's YouTube thumbnail), but they are `hqdefault`:
  480×360 with black letterbox bars, upscaled to 1280×720 on the lesson page.
- **The generated art stays.** The hero play-button art, the two banners, and the About video
  are illustrations, not placeholders.

## Decisions

### A. Live learner counts

- **Definition:**
  - a course's learners are the distinct signed-in people who enrolled in it **or** have
    progress on any of its lessons
  - a lesson's learners are the distinct people with progress on it
  - site-wide learners are the number of progress records
- **Server:** a new `lib/learners.ts` (server-only).
  - `getLearnerCounts()` reads `*[_type == "progress"]{ "courses": enrollments[].course._ref,
    "lessons": lessons[].lesson._ref }` plus the catalog's lesson-to-course map, and counts in
    one pass.
  - It reads through the server-only client and caches for **5 seconds**, so a burst of
    visitors costs one query.
- **Public route `GET /api/learners`:** returns `{ courses: {id: n}, lessons: {id: n}, total }`.
  - **Aggregates only.** No user ids ever leave the server.
  - It must not be protected in `proxy.ts`, because signed-out visitors see the counts too.
- **Live on screen:** one small client provider, `LearnerCountsProvider`.
  - Pages render with the server's counts, so the first paint is correct with no flash.
  - It **polls `/api/learners` every 15s while the tab is visible**, and refetches at once after
    this learner enrolls or completes a lesson (the events already exist).
  - `<LiveLearners id=… />` renders the number wherever a count shows today. A changed number
    ticks with a brief highlight, and there is no motion under reduced motion.
  - Why polling: Sanity's Live API needs a browser token on a private dataset, which §5 forbids.
    One 15s poll of a tiny JSON response is cheap and keeps every boundary.
- **Zero is shown honestly:**
  - Cards and headers **hide** the count at 0.
  - The course hero says "**Be the first to enroll**".
  - Home "New and popular" sorts by live learners, then the editorial "popular" flag, then
    title.
- **Retire `studentCount`.** Remove it from the schema, queries, and UI, and unset it on all
  course and lesson documents with a one-off script. Then TypeGen and a Studio deploy.

### B. Course covers (the decision below)

- **Recommended: a filmstrip of the course's own videos.** An offline script composes each
  cover from the course's first three real YouTube thumbnails (maxres, 1280×720):
  - stacked in a portrait frame on the course's category hue
  - so every crop the site uses (the 560×656 hero, square card icons, 16:9 home cards) shows
    real frames from that course
  - uploaded as a Sanity asset, with alt text naming the three lessons
- **Alternative: one real topic photo per course,** from Unsplash (free license, no
  attribution required, credited anyway in the alt text). For example, server racks for DevOps
  or a terminal for Python. It is chosen by hand, one each.

### C. Instructors (the decision below)

- **Recommended: show the real creators.** The fictional instructor byline becomes the real
  YouTube channels behind the course. An offline script:
  - calls YouTube Data API `channels.list`: 1 quota unit per 50 channels, about 110 channels
  - stores each channel's id, name, and avatar (as a Sanity asset) on its `video` documents
- **The course page, lesson page, and cards then show** an avatar stack and "Videos by IBM
  Technology, DataMListic and 8 more". The lesson page names that lesson's channel.
  - The fictional `instructor` documents and references are removed.
  - §8's "instructor" becomes the lesson's real creator. This is honest, and matches "Videos
    belong to their YouTube creators" in the footer.
- **Alternative:** keep the fictional instructors, but replace the fake faces with plain
  initials avatars (no invented photos).

### D. Lesson thumbnails

- Re-import every lesson thumbnail at `maxresdefault` (1280×720, no letterbox bars), falling
  back to `sddefault` or `hqdefault` when YouTube has no maxres.
- An offline script, with the same asset import path as the seed.

## Files

- **New:**
  - `lib/learners.ts`
  - `app/api/learners/route.ts`
  - `components/learners/learner-counts.tsx` (the provider and `LiveLearners`)
- **Edited:**
  - `course-card.tsx`, `course-grid.tsx`, `home-course.ts`, `new-and-popular.tsx`,
    `course-hero.tsx`, `lesson-header.tsx`, and the pages that wrap them
  - the queries in `sanity/lib/queries.ts`, and `sanity.types.ts` (TypeGen)
  - `course-enroll` to fire a refetch event
- **Studio:**
  - the schema: drop `studentCount`; C adds `channel{id, name, avatar}` to `video` and drops
    `instructor`
  - new `studio/scripts/media/` scripts, for covers, thumbnails, and channels
  - a Studio deploy
- **Images:** new Sanity assets only. No new hosts in `next.config`.

## Security considerations

- `/api/learners` exposes counts only. It never returns progress documents, user ids, or
  anything per person.
- Counting runs on the server with the server-only client. The browser gets JSON, never a token.
- YouTube API calls and image uploads are offline scripts on your machine, never in the request
  path.
- New images are imported into Sanity, never hotlinked (except YouTube thumbnails on plans,
  already allowed).

## Acceptance criteria

- No `studentCount` anywhere. Every learner number on screen equals the real count, and 0 is
  hidden, or shows "Be the first to enroll" in the course hero.
- Two browsers: when B enrolls in a course, A's open catalog and course page show the new count
  within about 15s, with no reload.
- Every course cover shows that course's content, per the choice in B. No picsum or randomuser
  URLs remain in the dataset or the seed.
- Lesson posters are sharp at 1280 wide, with no letterbox bars.
- Creators (C) are real channel names and avatars, and match the video that plays.

## Checks

- Typecheck, lint, and build. Studio TypeGen and deploy.
- A GROQ audit: `count(*[defined(studentCount)]) == 0`, and no asset source URL from picsum or
  randomuser.
- **Playwright:**
  - The route matrix.
  - A live-count test: a temporary Clerk user enrolls through `/api/enroll` while a second page
    watches the counter change. The user and their progress are then deleted.
  - A visual review of the home, catalog, course, and lesson screenshots.
- `/api/learners` returns no user ids (a schema check on the response).

## Manual test

1. Open a course in two windows. Enroll in one. The other's count rises within about 15s.
2. Browse home and the catalog. Every cover shows that course's own videos, and every face or
   avatar is the real creator.
3. Open a lesson. The poster is crisp, and the byline names the channel whose video plays.

## Decisions recorded at approval

- Covers: a filmstrip of each course's own videos.
- Instructors: replaced by the real creators.

## Deviations during implementation

- **Counts are cached under a `learners` tag.** Every enroll or progress write expires it
  immediately (`revalidateTag(tag, { expire: 0 })`), and a 60s time revalidation is the
  backstop for changes made outside the app. This follows the live test: a progress record
  deleted directly in Sanity otherwise kept its count until the next write.
- **The provider lives in the root layout,** so every page shares one poll. Pages render the
  server's counts first.
- **`sanityFetch` accepts an explicit `revalidate` alongside tags.** Before, tags always
  disabled time revalidation.
- **The seed no longer contains fake data.** It has no instructors, no `studentCount`, and no
  picsum or randomuser images. Its covers start as each course's first video frame, and the
  media scripts (`studio/scripts/media/`) finish the job. `README.md` documents the order.
- **The search agent's Context scope drops `instructor`,** in both the dataset and the committed
  ndjson.
- **The Studio tsconfig already excluded the motion project.** No other Studio change was needed.

## Verification results

- **Data:**
  - 120 of 120 videos credited to real channels (82 channels, with avatars from the YouTube Data
    API).
  - 118 of 120 thumbnails at maxres. The other 2 use `sddefault`, with the letterbox bars cropped.
  - 10 of 10 filmstrip covers.
  - 0 `studentCount` values, 0 instructor documents or references, and 0 orphaned image assets.
    The replaced picsum, randomuser, and hqdefault assets were deleted.
- **Live test (Playwright, 2 browsers), 9 of 9 pass:**
  - Signed out: "Be the first to enroll", and "Videos by IBM Technology, Adam Lucek and 8 more".
  - The enroller sees "1 learner" at once (about 4s, with the refresh).
  - The **signed-out watcher updates to "1 learner" in 6.3s with no reload**, with the highlight
    tick.
  - `/api/learners` is aggregate only (`courses`, `lessons`, `total`) and has no user ids.
  - After a progress save, the lesson shows 1 learner and "Video by IBM Technology". The catalog
    card shows 1 learner.
  - The test user and its progress were deleted.
- **Route matrix:** 28 of 28 (7 routes × 375, 768, 1024, 1440). No overflow, no "students" or
  "Curated by" text, no em-dashes, and no page errors.
- **Typecheck, lint, and build pass** (0 warnings). Studio typecheck passes, and the Studio is
  deployed with the new schema. TypeGen was regenerated.
