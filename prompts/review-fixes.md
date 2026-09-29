# Implementation prompt: Fixes for the PR #1 review (merge risk and security)

## Goal

Close the review's findings on PR #1 (up to `fc3e2`) before merge, or explicitly accept the ones
that cannot be fixed on the current plan.

## Triage (each finding checked against the code)

| # | Finding | Verdict | Evidence |
|---|---|---|---|
| 1 | Quiz scores can be forged | **Confirmed** | `POST /api/progress` `{type:"quiz", score, total}` and `POST /api/plans/[key]/progress` store the score the browser sends. The server never sees the answers. |
| 2 | Concurrent progress saves can corrupt or lose entries, and retries inflate attempts | **Confirmed** | `recordProgress` (`sanity/lib/progress.ts`) reads the lesson entry, merges in memory, then `set`s it with no revision check. `quizAttempts` is `current + 1` per request, so a retried request counts twice. The plan grade update is the same read-then-write. |
| 3 | The plan daily limit can be exceeded | **Confirmed** | `app/api/plans/route.ts` checks `countPlansSince(...) >= 5`, which counts *saved* plans. Refused or failed builds never count, and five parallel requests all pass the same check before any saves, while each spends Groq and YouTube quota. |
| 4 | Groq search can return empty results | **Confirmed** | Groq gets one tool step. When its single query misses, nothing re-queries: "typescript strict mode" returned 0 results in testing. The same limit is why "Watch from" video moments never appear. |
| 5 | The learner-state writes use a broad Editor token | **Confirmed, with a constraint** | `SANITY_API_WRITE_TOKEN` is an Editor robot token. Sanity tokens are project-wide. Roles limited to certain document types or datasets need the **Enterprise** plan, so there is no narrower token on this plan. |
| 6 | Docstring coverage is 51% (threshold 80%) | Inconclusive check | This is a heuristic over the 76 functions the diff touches. It is not a defect. |

## Decisions

### 1. Grade quizzes on the server

- The browser sends **answers**, not a score: `{type:"quiz", lessonId, answers: {questionKey: optionKey}, attemptId}`.
- The route loads that lesson's `quiz` document, grades each question itself, and stores the
  result. The response returns `{score, total}`. The UI shows the grade it computes locally, and
  it now matches what is stored by construction.
- **Plan quizzes:** the same. The plan route grades against the quiz cached on the plan document.
- **Not changed:** the browser still receives `isCorrect`, because the results screen reveals
  the right answers after submitting. A learner can still read them before answering, but they
  can no longer store a grade that does not match their submitted answers.

### 2. Race-safe, idempotent progress writes

- Every progress, enrollment, and plan-grade write becomes **compare-and-set**:
  1. read the entry with its `_rev`
  2. compute the next state
  3. commit with `ifRevisionID`
  4. on a 409 conflict, re-read and retry, up to 4 times with jitter
- **Merges are monotonic**, so a stale write cannot undo progress:
  - `completedAt` is kept once set
  - `positionSeconds` is last-write-wins (it is a resume point)
  - `quizScore` is the maximum of the stored and new scores
- **Attempts are idempotent.** Each quiz submission carries a client `attemptId` (UUID). The
  entry keeps the last 20 ids, and a repeated id changes nothing, so a retry never counts twice.
- **`/api/progress` answers `{saved: true}`**, so the client can tell a save persisted. The
  beacon on page exit stays fire-and-forget by design.

### 3. Reserve plan quota before any upstream call

- A per-learner `planQuota.<userId>` document holds `{day, used}` (UTC day). It is written only
  by the server.
- **Admission is atomic:** compare-and-set to increment `used`, which must stay ≤ 5, **before**
  calling Groq or YouTube. Refused and failed builds count too.
  - Five parallel requests take five slots, and the sixth gets 429 without calling anything.
  - "Why it failed" wording is unchanged.
- It is added to the Studio schema as a read-only type, so it is visible in the Studio.

### 4. Search never comes back empty when the data has matches

- The route adds a **deterministic server-side pass**, with no LLM, next to the model's hits:
  - wildcarded, OR'd keyword matching over lesson `title`, `keyPoints`, and `pt::text(notes)`
  - matching over video `chapters[].label`, with a few chapter hits per video, never whole
    arrays
- **How it merges:**
  - The model's ranked hits come first.
  - Deterministic hits fill in anything missing, ranked by specificity (a title hit beats a
    notes hit).
  - A chapter hit becomes a **video result at that chapter's real second**.
- **Everything is grounded** through the existing `LESSONS_BY_IDS_QUERY`, so nothing invented
  reaches the UI.
- **Side effect:** "Watch from 5:46" video moments start appearing, which makes the home banner's
  "exact second" claim true.

### 5. The write token (the decision below)

- **Accept and document (recommended for now):**
  - The token is server-only, and every write route authenticates with Clerk and derives the
    document id from the user id.
  - Record the residual risk in a new `SECURITY.md`, and set a rotation reminder.
  - Before a real launch, move learner state to a **separate Sanity project**. Its Editor token
    then cannot touch course content. It needs a second project id and token.
- **Split now:** create the second project and move progress, plans, and quota there.
  - This is more setup: a new project, CORS, and tokens.
  - The Studio shows learner state only if a second workspace is added.

### 6. Docstrings (the decision below)

- **Recommended:** a one-line docstring on every exported function this PR touched that lacks
  one. Roughly 35 functions, comments only.

## Files

- `app/api/progress/route.ts`
- `app/api/plans/route.ts`
- `app/api/plans/[key]/progress/route.ts`
- `sanity/lib/progress.ts`, with a new `sanity/lib/cas.ts` (the compare-and-set helper)
- `lib/plans/store.ts`, with a new `lib/plans/quota.ts`
- `components/lesson/lesson-quiz.tsx` and `components/plans/plan-lesson-client.tsx` (sending
  answers and an `attemptId`)
- `lib/progress/client.ts`
- `app/api/search/route.ts`, with a new `lib/search/keyword.ts`
- The Studio schema, `planQuota`
- `SECURITY.md` (if 5 is accepted)

## Security considerations

- Grades are now computed only on the server. The browser cannot store a score.
- Quota is reserved before any paid or quota-bound call, and it bounds concurrency.
- All learner-state writes are conditional (`ifRevisionID`), so they cannot silently clobber
  each other.
- No new public surface. The keyword pass reads only content types, through the same
  server-only client.

## Acceptance criteria

- `POST /api/progress {type:"quiz", score: 3}` (the old shape) → 400. Wrong answers are stored
  as their real grade.
- **20 parallel position and quiz saves for one learner:** no lost entries, `completedAt` is
  kept, the best score is kept, and attempts equal the number of *distinct* `attemptId`s.
- **Seven parallel plan builds:** exactly 5 are admitted and 2 get 429. Refused and failed builds
  count toward the limit.
- "typescript strict mode" returns results, and at least one query returns a "Watch from"
  video result at a real chapter second.

## Checks

- Typecheck, lint, and build. Studio TypeGen and deploy.
- A live concurrency harness against the dev server, with a temporary Clerk user (deleted
  afterwards, with its data):
  - forged quiz
  - 20 parallel saves
  - a duplicate `attemptId`
  - 7 parallel plans, with plan generation stubbed by a test flag so no real Groq or YouTube
    quota is spent. The flag is only honoured outside production.
- Search: 6 queries, including the earlier empty one and one that should produce video moments.
- The existing quiz Playwright test and the route matrix.

## Manual test

1. Take a quiz, answer wrong on purpose, and reload. The stored grade matches your answers.
2. Build plans quickly in two tabs. The 6th of the day is refused.
3. Search "typescript strict mode". Results appear, some with "Watch from".

## Decisions recorded at approval

- The write token: accept and document in `SECURITY.md`. Split learner state into its own
  Sanity project before a real launch.
- Docstrings: yes, on the exported functions this PR touched.

## Deviations during implementation

- **Position and completion saves on an existing entry are single atomic patches, with no
  compare-and-set.** A position is a keyed `set`; a completion is a keyed `setIfMissing`, so it
  stays monotonic. Compare-and-set is reserved for first entries and quiz grades.
  - This follows the first concurrency run: 20 writers on one document all used compare-and-set
    and one ran out of retries (a 500).
  - The retry budget is 25 attempts with 20–150ms jitter.
- **Plan quota is a rolling 24 hours** (timestamps of admitted builds), matching the old "5 a
  day" behaviour, not a UTC calendar day.
- **The search merge ranks agreement first:**
  1. lessons both passes found, ordered by keyword specificity
  2. strong keyword hits (a chapter moment, every term matched, or a title match)
  3. the model's other hits
  4. the other keyword hits

  In testing, the model alone put "Building an agent loop" first for "typescript strict mode",
  and "Caching and rate limits" above "Load balancing".
- **Search gives the model a 12-second budget.** Past it, the keyword results ship on their own.
  Going over budget is not an outage: no matches then shows the empty state (200), not 502.
  Measured model latency on the Groq free tier was 19–37s.
- **Plan quiz generation is also compare-and-set.** If two first opens race, the first stored
  quiz wins, so the quiz answered is the quiz graded.
- **The `PLAN_BUILD_STUB=1` test hook in `/api/plans`** returns right after admission. It is
  ignored when `NODE_ENV` is production.

## Verification results

- **Live harness (temporary Clerk user; its progress, quota, and plan deleted afterwards),
  13 of 13 pass:**
  - forged quiz (old `score` shape) → 400, for both course and plan quizzes
  - all-wrong answers stored as 0/3, and all-right as 3/3, graded by the server
  - a duplicate `attemptId` counted once
  - **20 parallel saves:** all 200, no lost entries (11 present), attempts equal to distinct
    submissions (7), and the best grade and first completion kept
  - parallel plan quiz grading: 2/3 stored correctly
  - **7 parallel plan builds: exactly 5 admitted (202) and 2 refused (429)**, and the 8th is
    refused
- **Search, 6 queries, all 200:**
  - "typescript strict mode": top result is the tsconfig lesson, with a **video moment at 4:55,
    "strict mode — the big one"**. It returned 0 results before.
  - "load balancing" → Load balancing
  - "sql joins" → SELECT and joins
  - "what is a context window" → Tokens and context windows
  - nonsense → an empty state
  - All answered in 12.3s or less.
- **Docstrings:** 40 exported functions across the touched files now have one. Two were
  corrected after checking their usage.
- Typecheck, lint, and build pass (0 warnings). Route matrix 28 of 28. The Studio is deployed
  (`attemptIds`, `planQuota`).
- **Not re-run:** the quiz UI Playwright test from the earlier session (its harness is gone). The
  UI change is limited to sending answers instead of a score, and the API it calls is covered
  above.
