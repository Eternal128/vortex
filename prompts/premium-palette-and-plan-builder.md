# Implementation prompt: Premium palette, and "Build your own plan"

## Goal

1. **A new premium palette** that no longer reads as Coursera. The tokens change, the layout
   stays. Where the chosen palette clashes with the AI artwork, the artwork is regenerated to
   match.
2. **Plan builder.** Anyone signed in types a goal ("I want to learn how to cook") and Vortex
   builds a personal course:
   - An LLM designs the syllabus (modules, then lessons, each with a learning objective).
   - For each lesson, Vortex finds the best YouTube video and assembles a playlist the learner
     works through on-site, with progress (and quizzes, per the decision below).

## Code and assets inspected

- **Palette previews** are rendered from the live app with the tokens overridden and no code
  changed, saved in `design/palette-options/`:
  - `compare-home.png` and `compare-lesson.png`: every option side by side
  - one pair per option
- **Artwork:**
  - `public/generated/*` is blue (the vortex swirl, the blue search banner, the navy path).
  - It clashes with gold and emerald, and suits violet and monochrome.
- **Search route** (`app/api/search/route.ts`) uses AI SDK 7: `generateText` with
  `Output.object({ schema })` through `@ai-sdk/openai`.
  - The planner reuses that pattern, pointed at Groq's OpenAI-compatible endpoint with
    `createOpenAI({ baseURL, apiKey }).chat(model)`.
  - No new dependency.
  - `GROQ_API_KEY` is already in `.env.local`. It becomes a server-side key for the web app as
    well as the offline tooling.
- **Existing pieces to reuse:**
  - `LessonVideo` (the provider embed and watch depth) and `LessonQuiz` (the quiz UI)
  - the progress patterns (`sanity/lib/write-client.ts`) and the Clerk-gated routes
    (`proxy.ts`)
  - the windmill `VortexLoader`
  - the quiz generator's prompt, schema, and validation (`studio/scripts/quiz/generate.mjs`),
    ported into a server module
- **There is no YouTube Data API key** in the project.

## Decisions and assumptions

### A. Palette

- The chosen option's light values come straight from its preview. Dark values are derived:
  - the same hues, lifted for contrast
  - the text-on-primary token rechecked for AA
- **Serif headings** (if chosen): Fraunces through `next/font/google`, a variable font with no
  npm dependency. It applies to display, heading-1, and heading-2 only; body, UI, and buttons
  stay in Source Sans 3.
- **Artwork:** when the palette is not blue or violet, the 3 images are regenerated in its
  colors with Higgsfield (`gpt_image_2_5`, medium quality, 0.5 credits each, **2 credits at
  most**), keeping the same compositions.
- `app/design-system` swatches, `DESIGN.md` references, and AGENTS.md §3 are updated to name
  the new palette.
- AA contrast is checked for every text-on-fill pair in both themes before shipping.

### B. Plan builder

- **Entry points:**
  - a "Build your own plan" section on home: a goal field with example chips ("Cook
    weeknight dinners", "Learn Spanish basics", "Start running")
  - the Explore menu footer
  - a "Your plans" section on My Learning
- **`/plans/new`** asks for:
  - the goal (free text, 120 characters at most)
  - the level (new to it, some experience, or advanced)
  - the pace (about 15 minutes, 30 minutes, or 1 hour a day)

  Submitting shows the windmill with live steps: designing your plan, finding videos on
  YouTube, building your playlist.
- **`POST /api/plans`** (Clerk-protected in `proxy.ts`). Four steps, in order:
  1. **Guardrails:**
     - signed in only, with at most **5 plans per learner per day**
     - Zod-validated input
     - the model returns `allowed: false` with a reason for harmful, illegal, sexual, or
       dangerous goals, which gives a friendly refusal and saves nothing
  2. **Syllabus:** Groq `openai/gpt-oss-120b` produces a strictly schema-checked outline
     (3–5 modules, 2–4 lessons each). Every lesson has a title, an objective, and one YouTube
     search query.
  3. **Videos**, one per lesson, from the source chosen below:
     - embeddable, 3 to 40 minutes long, no Shorts, no live streams
     - never the same video twice in a plan
     - a lesson with no acceptable result is dropped
     - the plan needs at least 6 lessons to be saved
  4. **Save:** a private `plan` document, `plan.<userId>.<nanoid>`, holding:
     - the title, summary, goal, level, and pace
     - modules, then lessons: each has an objective and a video (id, url, title, channel,
       duration, thumbnail)
     - `createdAt`, and per-lesson `completedAt`, `quizScore`, and `quiz`
- **`/plans/[id]`**, owner only (others get a 404):
  - an overview with modules, lessons, total time, and progress, and a Continue button
- **`/plans/[id]/[lesson]`**, the lesson player:
  - `LessonVideo` with the "Video by {channel} · YouTube" credit
  - the objective, a sidebar of the plan, next and previous, and the quiz
- **Progress:** `POST /api/plans/[id]/progress` saves completion and quiz scores into the plan
  document, with ownership checked on the server.
- **My Learning** gets **Your plans**: cards with progress, plus "Build a plan". Plans can be
  deleted (with a confirmation).
- **Privacy and search:**
  - Plan documents are private (dot IDs), per user, and fetched `no-store`.
  - They are outside the Context MCP filter, so plans never show up in site search.
- **Latency:** about 10–25s per plan (one LLM call plus about 12 lookups), shown with the
  windmill and its steps.
- **AGENTS.md:**
  - §1 adds personal plans to the scope.
  - §9 notes that plan building looks up YouTube in the request path, which the offline
    ingestion rule did not anticipate.

## Open decisions (asked in the approval panel)

- **Palette:**
  - Onyx & Gold with serif headings (recommended, the most premium)
  - Midnight Violet
  - Emerald & Brass
  - Monochrome Onyx
- **Where plan videos come from:**
  - **The official YouTube Data API (recommended).** A free key from Google Cloud. It supports
    safe search and an embeddable filter, and complies with YouTube's terms. The free quota is
    about 8 plans a day, and more can be requested for free.
  - **Scraping YouTube's search page**, like the seed scripts. No key and no quota. But it
    breaks YouTube's Terms of Service, it will get a deployed server blocked, and it has no
    safe-search guarantee.
- **Quizzes for plan lessons:**
  - Generated on the first visit to a lesson from its transcript (recommended). This takes about
    5–10s once and is then cached, and it gives the same quality as course quizzes. Captions are
    scraped, like the ingest.
  - Generated from the lesson objective and video description. Compliant, but weaker.
  - No quizzes on plans for now.

## Security considerations

- The Groq and YouTube keys are server-only and never sent to the browser.
- The plan and progress routes derive the user from Clerk. The body never names a user, and
  ownership is checked on every read and write.
- The rate limit and input caps bound cost and abuse. The model's refusal, together with
  YouTube safe search, keeps unsafe topics out.
- Plans are private per learner and excluded from search and from public reads.

## Checks to run

- Web: typecheck, lint, and build.
- Studio: TypeGen and the Studio deploy (the new `plan` type).
- Playwright:
  - the palette across the 60-case matrix, plus AA contrast spot checks
  - the plan route refusing signed-out requests
  - the plan pages rendering from a seeded test plan, which is deleted afterwards
- Live check: generate one real plan ("Learn to cook weeknight dinners") through the server
  module, confirm the videos embed and every lesson has a working video, then delete it.

## Manual test steps

1. Sign in and open Build a plan. Type "I want to learn how to cook", pick a level and pace, and
   submit. The windmill shows its steps, and then your plan opens.
2. Open a lesson. The video plays on-site, the creator is credited, and the quiz appears (as
   decided). Finish it; the plan's progress updates.
3. Open My Learning. The plan is under Your plans with its progress, and deleting it asks for
   confirmation.
4. Try a harmful goal. You get a polite refusal, and no plan is saved.
5. Check the new palette on the home, catalog, course, lesson, search, and My Learning pages,
   in light and dark mode.

## Decisions recorded at approval, and changes after

- Approved:
  - Onyx & Gold with serif headings
  - the official YouTube Data API
  - transcript-grounded plan quizzes
- **Changed by the user during implementation:** the primary is coral `#f35252`, and the font
  is back to Source Sans 3 only (Fraunces removed).
  - The warm onyx and ivory neutrals and surfaces are kept.
  - The gold artwork (regenerated for Onyx & Gold, 1.5 credits) is kept for now. It is warm
    enough to sit next to coral, and it could be regenerated in coral for about 1.5 credits.

## Deviations during implementation

- **Coral and accessibility.**
  - White on `#f35252` is 3.42:1 and fails AA for 14px labels. So coral fills carry onyx labels
    (`on-primary` `#15120e`, 5.46:1).
  - Every text use of the primary (30 places) moved from `text-primary-500` to
    `text-primary-600` (`#bd3636`, 5.38:1 on ivory). Fills and borders keep the exact
    `#f35252`.
  - Contrast audit: 26/26 pairs pass in both themes.
- **Token renames:** `callout-navy` became `callout`, `callout-navy-mid` became `callout-mid`,
  and `promo-blue` became `promo-deep`. The old names described colors that no longer apply.
- **Artwork files were renamed** to `*-gold.jpg`. Overwriting them under the same names left the
  Next image optimizer (and any CDN) serving cached copies of the old art.
- **Video relevance.** The first live test matched "Sautéing basics" to a French motocross video.
  Two fixes:
  - A hard filter drops any declared non-English audio track.
  - `lib/plans/pick.ts`: the LLM chooses one candidate per lesson from the titles, and can
    return "none fits". If the call fails, it falls back to search order.
- **Lesson updates.** A wildcard patch path (`modules[].lessons[...]`) is silently ignored by
  the Sanity API, which would have lost every quiz, completion, and score. Lessons are now
  addressed by `modules[_key==…].lessons[_key==…]`, with both keys from `findLesson`.
- Route types for new routes needed `next typegen` before typecheck (`RouteContext` and
  `PageProps` come from generated types).

## Verification results

- **Live plan build**, using the real server modules with a throwaway user, for the goal
  "I want to learn how to cook". The test plan was deleted afterwards.
  - The syllabus took 1.5s: 3 modules, 9 lessons.
  - Videos took 1.7s: 8 of 9 lessons filled, all relevant, no repeats, all 3 to 40 minutes. For
    example Babish, Epicurious, Natasha's Kitchen, and Tasty.
  - Saved, and readable only by its owner (another user id returns null).
  - A transcript was fetched (8,750 characters), and a quiz generated in 2.3s: 3 questions,
    each with exactly one correct answer.
  - The quiz, completion, and score are stored on the lesson. The daily-limit counter works.
  - A harmful goal was refused, and nothing was saved.
- Signed-out `/plans/*` and `/api/plans/*` return 307 (redirect to sign-in).
- Quiz browser test 11/11. Route matrix 60/60. Typecheck, lint, and build are clean. The Studio
  was redeployed with the `plan` type.
- **Not browser-tested:** the signed-in plan pages. Clerk will not let the agent sign in. The
  data paths they use are covered by the live test above, and the pages are typechecked and
  built.
