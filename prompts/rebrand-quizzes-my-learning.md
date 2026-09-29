# Implementation prompt: YouTube rebrand, quizzes, progress and My Learning, header polish

## Goal

1. **Rebrand.** Vortex is a learning marketplace whose courses are YouTube videos, gathered
   and organized into playlists that become structured courses. The copy says so, and every
   lesson credits the real YouTube creator.
2. **Quizzes** at the end of each lesson video, with real right and wrong answers and
   feedback on every option.
3. **Progress plus a working My Learning page.** Progress is tracked per learner (AGENTS.md
   §7/§8), and `/my-learning` stops being a 404.
4. **Explore popup** matches Coursera's design: a full-width header and panel, and 4 columns.
5. **The logo aligns** with Explore.
6. **Remove the blurred bar graph** (`ChartDecoration`) from the catalog and course pages.

## Code inspected

- `studio/scripts/seed/resolve-videos.mjs`: finds one YouTube video per authored lesson by
  scraping the public search page (`ytInitialData`), then checks it against oEmbed. The cache,
  `videos.json` (120 entries), **records each video's real `channel`**, but no schema field
  stores it.
- `studio/scripts/ingest/*`: scrapes captions (innertube) and chapters into `video` documents
  (`videoId`, `url`, `provider`, `chapters`, `chunks`).
- Studio schema: `course`, `lesson`, `instructor`, `category`, `video`. There is **no quiz type
  and no progress type.**
- **Progress is not tracked anywhere.** `course-resume-link`, `course-progress-bar`, and
  `lesson-sidebar` all hardcode 0%, and "Continue" always opens lesson 1. There is **no Sanity
  write token** in `.env.local`.
- The Sanity CLI is logged in (a user token exists), so `sanity exec --with-user-token` and
  `sanity dataset import` work for content writes.
- The Context MCP filter is `_type in ["course","lesson","instructor","category","video"]`.
  **New `quiz` and `progress` types are invisible to search**, so learner data cannot leak into
  search results.
- `use-watch-depth.ts`: the YouTube iframe reports nothing, so watch depth is estimated from
  elapsed time, and "completed" fires at `COMPLETION_MILESTONE = 95`.
- `app/api/search/route.ts` uses OpenAI through `@ai-sdk/openai` (model `gpt-5`, or
  `OPENAI_SEARCH_MODEL`).
- Header: the header and Explore panel sit inside `PageFrame`'s 1440px column, so on wider
  windows the backdrop dims the strips beside the header and panel. That is why the popup looks
  like a floating box rather than Coursera's full-width sheet.
- `ChartDecoration` is used by `app/courses/page.tsx` and `app/courses/[slug]/page.tsx`.

## Decisions and assumptions

### A. Explore and header

- `PageFrame` gets a `header` slot rendered **outside** the 1440px column. The header and the
  Explore panel become full-bleed white, with their contents aligned to the page column. The
  backdrop then only dims the page below, as on Coursera.
- The 5 pages pass `<SiteHeader/>` through the slot. This is a layout-only change.
- **4 columns**, as on Coursera:
  - Explore categories
  - Popular courses
  - Go deeper (Advanced)
  - **Quick starts** (the shortest courses by total video length)
- The trigger's open state is a tint only, with no box. The focus ring still shows for
  keyboard focus, for accessibility.
- **Logo:** the logo link becomes `flex items-center` with `leading-none` on the wordmark, so
  it shares Explore's center line.

### B. Rebrand

- **Copy:**
  - The home pitch becomes "YouTube's best lessons, organized into real courses."
  - The sub-copy says every course is a curated YouTube playlist with transcripts, chapters,
    and quizzes.
  - The stats band counts "videos" instead of "lessons".
  - The search banner stays.
  - The site metadata description is updated.
- **Attribution:**
  - A new `channel` field on `video` documents, filled from `videos.json` by a one-off
    `sanity exec` patch. The patch only sets `channel` and never replaces transcripts.
  - The lesson page shows **"Video by {channel} · YouTube"** as a plain-text credit.
  - It is not a link, because AGENTS.md §7 says never to send learners out to the provider.
- **Instructors are reframed as curators** ("Curated by Priya Raman"), because they did not make
  the videos.
- Course meta shows "N videos" (the lesson count).
- See the open decision on a playlist importer.

### C. Quizzes

- **A new `quiz` document** (one per lesson):
  - `lesson`, a reference to the lesson.
  - `questions[]`: each has a `prompt` and `options[]`, and each option has `text`,
    `isCorrect`, and `feedback`.
  - Validation: 2 to 5 options, and **exactly one** is correct.
- **Generation** (offline tooling, never in the request path): `studio/scripts/quiz/generate.mjs`.
  - Per lesson, it sends the lesson title, key points, the notes as plain text, and the
    transcript chunks (capped at about 6k tokens) to OpenAI with a JSON schema, asking for
    **3 questions × 4 options**.
  - Every option carries feedback that explains why it is right or wrong. The questions must be
    answerable from the transcript and notes, which keeps them grounded.
  - Zod validates the output, and the result is cached to `quizzes.json` (committed, like
    `videos.json`). Re-runs only fill what is missing.
  - Model: `QUIZ_MODEL`, defaulting to `gpt-5-mini`. The estimate for 120 lessons is **under
    US$1** of OpenAI usage on your key.
- **Import:** `sanity exec --with-user-token` runs `createOrReplace` on `quiz-<lessonId>`
  documents. Lesson documents are never touched.
- **Query:** the lesson query projects
  `"quiz": *[_type=="quiz" && lesson._ref==^._id][0]{questions[]{…}}`, followed by a TypeGen
  run.
- **UI:**
  - `LessonQuiz`, a client component, sits in a "Check your understanding" card **directly
    under the video**.
  - When the watch-depth completion milestone fires, the card highlights and a "Quiz ready"
    prompt scrolls to it.
  - It is never locked: depth is only an estimate, so learners can take the quiz any time.
  - One question at a time, as a radio group. The learner picks an option and presses **Check**:
    - A correct pick shows a success state and its feedback.
    - A wrong pick shows an error state, the chosen option's feedback, and the correct answer
      with its feedback.
  - Then **Next**, and finally the score ("2 of 3") with **Retry**.
- A new token, `--color-error: #d30a28` (the spec's feedback error), with a derived dark value.
- The answers ship in the page for instant feedback. That is fine for self-check quizzes, but it
  is not exam-grade.

### D. Progress and My Learning

- **A new `progress` document**, one per learner, with ID `progress.<clerkUserId>`. The dot
  makes it non-public even with a token-less client. It holds:
  - `userId`
  - `lessons[]`: `lesson` (a weak reference), `positionSeconds`, `completedAt`,
    `quizScore`, `quizTotal`, and `updatedAt`
  - `lastLesson`
- **Writes go only through `POST /api/progress`:**
  - Clerk `auth()` supplies the user id. The browser never supplies it.
  - Zod validates the body: `{ lessonId, type: "position" | "complete" | "quiz", … }`.
  - A **server-only write token** client does the write.
  - Positions are throttled to one save every 30s (plus `sendBeacon` on page hide).
  - Completion is sent at the 95% milestone and on quiz finish.
- **Reads:** a per-user `no-store` fetch on the server. It never goes through the shared cache
  tags, so one learner's data can never be cached for another.
- **Write token:** created by me with `sanity tokens add "vortex-progress" --role=editor`. It is
  written only to `.env.local` (gitignored) as `SANITY_API_WRITE_TOKEN`, and never printed. The
  name is added to `.env.example`.
- **Surfaces:**
  - Course page: a real % and **Continue → the resume lesson**.
  - Lesson sidebar: completion checks and the %.
  - Catalog cards: a small progress bar when a course has been started.
- **`/my-learning`:**
  - `proxy.ts` protects it, together with `/api/progress`, so signed-out visitors are sent
    to sign in.
  - Sections: **In progress** (%, last lesson, Continue), **Completed**, and quiz scores.
  - An empty state points to the catalog.
- **Schema deploy:** `npm run deploy` in `studio/` redeploys the Studio, so the Context MCP and
  Studio know the new types (AGENTS.md §12).

### E. Remove the blurred graph

- Delete `ChartDecoration` and its two usages.

## Open decisions (asked in the approval panel)

- Rebrand depth: copy and credits only (default), or also a **playlist importer**
  (`npm run import:playlist -- <YouTube playlist URL>`). The importer would scrape the playlist
  page like the existing scripts, create the course, lessons, and video documents, run the
  transcript ingest, and generate quizzes.
  - Note: scraping YouTube pages is against YouTube's Terms of Service. The existing seed scripts
    already do it. A YouTube Data API key is the compliant route for an importer.
- Quizzes: all 120 lessons now (default), or one course first so you can review the quality.
- Progress storage: Sanity with a write token I create (default), or Clerk user metadata. The
  Clerk option needs no new token, but it is capped at 8KB per user.

## Security considerations

- The write token is server-only: it is used only in `/api/progress` and imported through a
  `server-only` module.
- The user id always comes from Clerk on the server.
- Progress documents are keyed by the Clerk id, private (dot IDs), excluded from the Context
  filter, and fetched `no-store`.
- Quiz generation and imports run offline on your machine, using your OpenAI key and your CLI
  login.

## Checks to run

- Web: typecheck, lint, and build.
- Studio: `npm run typegen`, then `npm run deploy`.
- Import verification: count the `quiz` documents and check a sample for exactly one correct
  option per question.
- Playwright:
  - The Explore panel is full-width at 2000px, with no dimmed strips beside the header.
  - The logo and Explore share a vertical center (within 1px).
  - A quiz shows correct and wrong feedback.
  - `/my-learning` redirects when signed out.
  - The 60-case route matrix, plus `/my-learning`.
- A progress round-trip. This needs you to sign in once, because Clerk will not let me sign in
  as you.

## Manual test steps

1. At a wide window, open Explore. The white panel spans the full width, the header stays white,
   and the page below is dimmed.
2. Open a lesson. You see "Video by {channel} · YouTube" and a quiz card under the video. Answer
   one question wrong and one right: each shows its feedback. Finish, see the score, and retry.
3. Sign in, watch or take a quiz, go back to the course, and "Continue" resumes there. The course
   and sidebar show real progress.
4. Open My Learning: the course is listed under In progress with its %. Sign out and it asks
   you to sign in.
5. The catalog and course pages have no blurred bars.

## Decisions recorded at approval

- Rebrand: copy and creator credits only, with no playlist importer.
- Quizzes: all 120 lessons.
- Progress: stored in Sanity, with a write token created through the CLI.

## Deviations during implementation

- **The dataset had 0 `video` documents.** The ingest pipeline had never been run, so there
  were no transcripts, nothing to put credits on, and no video moments for search. After
  asking, the ingest was run (`ingest:videos` → `ingest:build` → `ingest:import`).
  - The ingest build now adds `channel` from `seed/videos.json`, so credits arrive with the
    import.
  - The interim patch script (`scripts/credits/`) was dropped.
- **The route guard answers signed-out `/api/progress` requests with a 307 redirect**
  (Clerk's `auth.protect()`), not a 401. The route also returns 401 itself if it is ever reached
  unauthenticated. Either way the request is refused before any write.
- **`resumeFor` (`lib/progress/resume.ts`)** is shared by the course page, the catalog, and My
  Learning. "Continue" carries the saved second as the existing `?t=` parameter, so the lesson
  page needed no resume logic of its own.
- **Quiz document IDs** are `quiz.<lesson-slug-part>`, not `quiz-<lessonId>`, because lesson IDs
  already contain a dot. The dot prefix keeps them out of public reads, like progress.
- **The progress write path was verified without a browser sign-in.** The real `recordProgress`
  ran against a throwaway `progress.e2e-selftest` document, and 7 of 7 checks passed:
  - positions update in place
  - completion is recorded
  - the best quiz score is kept
  - finishing a quiz completes the lesson
  - `lastLesson` and `userId` are stored

  The test document was deleted.
- **Quiz generation ran on Groq's free tier, not OpenAI.** The OpenAI account had no credits
  (`credit_balance_exhausted`), and the user chose Groq.
  - The generator is now provider-agnostic: Groq, then OpenAI, then any OpenAI-compatible
    `QUIZ_BASE_URL`.
  - On Groq it runs one worker per model: `gpt-oss-120b`, `qwen3.8-27b`, and `gpt-oss-20b`.
    `llama-3.3-70b-versatile` was not available to this account.
  - A model that is capped or unavailable retires its worker, and schema misses are retried.
  - Cost: US$0, about 247k tokens.
- **Options are shuffled at import, using SHA-256 seeding.** The first shuffle in the generator
  was too weakly seeded (the right answers clustered in A/B). Final spread over 360 questions:
  A 89, B 90, C 100, D 81.
- **One quiz broke the rules** by using "All of the above", and was regenerated. The audit then
  came back clean.
- **The quiz UI strips a leading verdict** ("Correct –") from generated feedback, because the
  card already states it. The stored text is unchanged.
- **Stale content fix for this session:** the dev server was restarted and its fetch cache
  cleared. The app has no revalidation webhook, so pages cached before an edit keep serving old
  content (see "Needs attention").

## Final verification

- Sanity:
  - 120 `video` documents, all with a `channel`.
  - 120 `quiz` documents. Every lesson has one, and 0 questions lack exactly one correct option.
- Lesson pages sampled across 6 courses: all show "Video by {channel} · YouTube" and the quiz.
- Quiz browser test (11/11):
  - it renders, and Check stays disabled until an option is chosen
  - a wrong answer shows "Not quite" and reveals the right answer
  - options lock after checking
  - the score shows, retry resets, and the right answer shows "Correct"
- Progress logic: 7/7 against the live dataset (the test document was deleted). Signed-out
  `/my-learning` and `/api/progress` are both refused.
- Route matrix 60/60. Typecheck, lint, and build are clean (0 error or warning lines). Studio
  redeployed.
- **Not tested end-to-end:** a signed-in browser session saving progress. Clerk will not let the
  agent sign in as the user.
