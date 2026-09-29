# Implementation prompt: Premium redesign, real progress, enroll, and quizzes after the video

## Goal

A clean, premium, intuitive Vortex, **light mode by default**, still set in Source Sans 3 (from
`design/coursera.design.md`), with coral `#f35252` as the one accent. On top of that:

- progress that is real
- an Enroll button that enrolls
- the quiz after the video ends, Coursera-style with retakes
- a "Create plan" button in the header
- the windmill as the logo
- a YouTube hero image
- smooth, motivated motion, with cards and panels lifting on hover

## Design read (taste skill)

**Reading this as:** a redesign of a learning marketplace for self-learners, in a clean,
premium consumer-app language, built on Tailwind v4 tokens with Source Sans 3 and restrained CSS
motion.

**Dials:**

- **Variance 6:** product UI, with some asymmetry in the hero.
- **Motion 5:** fluid CSS transitions, one entrance reveal, and hover physics.
- **Density 4:** app-standard spacing.

**Audit of the current build against the skill:**

- **Palette.** The ivory `#fcfaf6` with `#1a1714` text is the skill's banned "premium beige +
  espresso" default. The skill's recommendation for coral fits it: **off-white and off-black
  neutrals (cool zinc) plus one saturated coral pop**.
- **Copy tells.** Em-dashes appear in visible copy (hero, plan builder, My Learning, quizzes).
  The skill bans them completely. There are also more eyebrows than one per three sections.
- **Motion.** There are no hover physics or entrance motion today. Motion is CSS-only for now:
  no animation library is installed, and CSS covers motion at level 5.
- **Kept:**
  - Source Sans 3, as you asked
  - the radius rule: buttons and inputs 8px, cards 16px, chips pill
  - lucide icons (already a project dependency)
  - dark mode as an option

## Figma feedback loop

- Your Figma is on the **Starter** plan, which caps MCP calls at a handful per month, so the
  loop is budgeted at **about 5 calls**:
  1. Create a file, "Vortex redesign", in your team drafts.
  2. Build three frames in one batched script, from the new tokens.
  3. Screenshot the frames and critique them against the taste pre-flight.
  4. Make one revision pass.
  5. Take a final screenshot.
- The three frames:
  - **Home, above the fold:** the header with the windmill and Create plan, the hero, and a
    course row with one card in its hover state.
  - **The course header:** the Enroll, Enrolled, and Continue states, with real progress.
  - **The lesson:** the video-ended prompt, then the quiz results screen.
- The implementation is then compared against those Figma renders with Playwright screenshots
  (no Figma calls), and iterated until they match.

## Decisions and assumptions

### A. Visual system

- **Tokens** (in `globals.css`, light by default):
  - Canvas `#fafafa`, surfaces white.
  - Text: zinc `#18181b`, `#3f3f46`, and `#52525b` (muted).
  - Hairlines `#e4e4e7`.
  - Callout cards are zinc `#18181b`, not pure black.
  - Coral `#f35252` for fills (with onyx labels, per AA). Coral text uses the deeper `#bd3636`.
  - Dark mode is derived from the same values.
  - The contrast audit is re-run, and every pair must pass AA.
- **Light mode is the default.** First visits get light, not the system setting. The toggle
  still offers system and dark.
- **Motion.** 300ms `cubic-bezier(0.16, 1, 0.3, 1)`, on transform and opacity only:
  - Hover: cards, rows, banners, category tiles, and plan cards rise 2–4px and gain a soft
    zinc-tinted shadow.
  - Press: buttons scale to 0.98.
  - One scroll-reveal for home sections, as progressive enhancement (CSS `animation-timeline:
    view()`).
  - Everything is off under `prefers-reduced-motion`.
- **Copy.** Zero em-dashes in visible copy. Eyebrows capped at one per three sections. Hero
  subtext of 20 words at most.
- **Logo.** The windmill (four coral sails around a hub, the same shape as the loader) replaces
  the triangle mark in the header. It is a simple geometric mark, which the skill allows.
- **Header.** A primary **Create plan** button with the sparkle icon. Then Sign in (text) and
  Sign up (outline), or, when signed in, the bell and avatar. It stays one line on desktop.
- **Artwork.**
  - The hero image becomes YouTube-themed (see the decision below).
  - The two banners are regenerated in the new palette with Higgsfield: 2 images, **1 credit**.

### B. Real progress

- **What is real:** YouTube's own embedded player reports what it is doing, through its
  documented IFrame API messages (`enablejsapi=1`): playback position, duration, and play,
  pause, and end. This is still the provider's player, not a custom one (AGENTS.md §7).
- **Resume and completion:**
  - The resume position saves every 15s, on pause, and on page exit.
  - A lesson completes **when the video ends**, or at 90% actually watched.
- **Partial credit.** Each lesson counts watched seconds over duration. Course progress is
  finished lessons plus partial lessons, so it moves as soon as you watch. It updates live in
  the lesson sidebar and on My Learning.
- The wall-clock estimate stays only for Vimeo and Bunny, which have no events wired. PostHog
  watch-depth events switch to real positions.

### C. Enroll

- **Data:** `progress` gains `enrollments[]`, each with a course and `enrolledAt`, written by
  `POST /api/enroll` (Clerk-gated, the course is validated).
- **The course page button:**
  - Signed out: **Enroll for free** opens Clerk sign-in, then enrolls.
  - Signed in: **Enroll**.
  - Enrolled: **Continue** (resume), with an "Enrolled" state.
- **Elsewhere:** My Learning lists enrolled courses (0% shows as "Not started"), and catalog
  cards show "Enrolled".

### D. Quiz after the video ends (Coursera-like)

- While the video plays, the quiz is **not** shown under it.
- When the video ends, an end-of-video prompt covers the player: "Nice work. Ready for a quick
  check?", with **Take the quiz** and **Replay**.
- The sidebar lists a "Quiz" item after each lesson, so a learner can return to it later.
- **Format** (the decision below). A Coursera-style graded quiz:
  - all questions at once, then **Submit**, then a grade (for example "67%, 2 of 3")
  - a pass mark of 2 of 3, shown as Passed or "Try again"
  - each question shows right or wrong with its feedback
  - **Retake quiz**, with the attempt count and the **highest grade kept**
- **Plan lessons.** Their quiz is generated **when the video ends**, not on page load. Same
  format.

## Open decisions (asked in the approval panel)

1. **The YouTube hero image.**
   - **Generated art** of a video-learning scene built around a red play-button motif (1
     Higgsfield credit). It evokes YouTube without its trademark (recommended).
   - **The official YouTube logo**, unmodified from YouTube's brand kit, shown prominently.
     YouTube's brand guidelines restrict the logo to referencing YouTube content: it must not
     dominate a third party's design or imply a partnership, so a hero-sized logo is a
     guideline risk.
2. **Quiz format:** Coursera-style submit-all with a grade and retakes (recommended), or keep
   one question at a time with instant feedback.
3. **Figma:** use about 5 of your Starter plan's limited monthly MCP calls on the loop
   (recommended, since you asked for it), or skip Figma and rely on the browser-screenshot loop.

## Files (main)

- `app/globals.css` (tokens, motion utilities) and `lib/theme.ts` (light by default).
- Header, logo, and a Create plan button.
- `components/lesson/lesson-video.tsx` with a new `use-youtube-player.ts`; `use-watch-depth.ts`.
- The quiz rebuilt: `lesson-quiz.tsx` and `plan-lesson-client.tsx`, plus a lesson-page
  end-of-video flow.
- `sanity/lib/progress.ts`, a new `app/api/enroll/route.ts`, course hero actions, My Learning,
  and the catalog.
- `studio/schemaTypes/documents/progress.ts` (enrollments, quiz attempts), a Studio deploy, and
  TypeGen.
- Home art, banners, copy (the em-dash sweep), and hover and reveal motion across cards.

## Security considerations

- Enroll and progress writes stay behind Clerk, with the user id derived on the server.
- The iframe messages are validated: origin `https://www.youtube.com`, and the source is our own
  iframe window.
- No new keys.

## Checks to run

- Typecheck, lint, and build. Studio TypeGen and deploy.
- The contrast audit (26+ pairs, both themes).
- Playwright:
  - light as the default on a first visit
  - hover lift (a transform on hover)
  - the route matrix, 60 cases
  - the quiz: submit, grade, and retake
  - the end-of-video prompt (simulated through the player event)
  - no em-dash in any rendered page
- Figma frames compared with the implementation screenshots.
- Live: a real YouTube player sends position and ended events, verified in a browser, and an
  enroll round-trip through the server module.

## Manual test steps

1. First visit: light mode. The windmill logo and Create plan appear in the header.
2. Hover over course cards and banners. They lift smoothly.
3. Sign in and enroll in a course. The button becomes Continue, and the course shows in My
   Learning.
4. Watch a lesson for a minute, then leave. The course bar moves, and Continue resumes at that
   second.
5. Let a video end. The prompt appears. Take the quiz, submit, see your grade, retake it, and
   the best grade is kept.

## Decisions recorded at approval

- Hero: generated red play-button art (not the official YouTube logo).
- Quiz: Coursera-style graded submit-all with retakes.
- Figma: use the loop, about 5 calls.

## Deviations during implementation

- **Figma used 3 calls, not 5.** `node.screenshot()` inside `use_figma` returns renders, so the
  loop was: create the file, build all three frames with screenshots, then one revision with
  screenshots.
  - File: https://www.figma.com/design/SFp3WpSUCdAbF7eyv7fGwm
  - The revision fixed accent overload in the header: Create plan became the only coral action,
    search went charcoal, Sign in went zinc, and Sign up became a neutral outline.
- **The generated hero play button closely resembles YouTube's own icon** (a red rounded
  rectangle with a white triangle). It is kept because it delivers the YouTube feel that was
  asked for. A circular coral variant is 0.5 credits if the resemblance is a concern.
- **Header at small widths.** Create plan is icon-only below 640px (its accessible name is kept),
  and the search field may shrink at desktop widths. This fixed 20 overflow failures the route
  matrix caught after the button was added.
- **Hero text column** narrowed to 54%, after the screenshot comparison showed the subtext
  running into the artwork.
- **Watching counts as enrolling for UI purposes.** A learner with progress in a course sees
  Enrolled and Continue even without pressing Enroll.
- **Plan quizzes do not record attempts** (plans keep the best score only). Course quizzes record
  attempts and the best score.

## Verification results

- **Design loop:** the three Figma frames were built and critiqued, then revised once. The
  implementation was compared against them with Playwright screenshots, and one defect was
  fixed (hero text overlapping the art).
- **Contrast:** the zinc and coral audit passes 30/30 pairs in both themes. Charcoal on coral is
  5.18:1, white on charcoal 17.7:1.
- **Theme:** a first visit renders light. A hovered card has `transform` equal to
  `translateY(-3px)`, plus the lift shadow.
- **Quiz, browser test (11/11):**
  - locked until the video ends
  - "Take it now" shows all questions at once
  - Submit is gated until every question is answered
  - grade, pass status, per-question feedback revealing the right answer, and the attempt count
  - Retake starts a fresh attempt
- **Real YouTube player, live:**
  - the embed carries `enablejsapi=1`
  - the player reported a duration of 950s and its playing state
  - a genuine ended event showed "Nice work.", unlocked the quiz, and "Take the quiz" opened it
- **Server logic, live** (throwaway user, deleted afterwards):
  - enroll is idempotent
  - half a lesson moves the course bar (4% of 12 lessons)
  - Continue resumes at `?t=346`
  - 3 retakes counted, best 3/3 kept
  - a signed-out enroll is refused (307)
- **Rendered em-dashes across 6 routes: 0.** Route matrix 60/60. Typecheck, lint, and build are
  clean. The Studio was redeployed with enrollments and quiz attempts.
- **Not browser-tested:** a signed-in session end to end. Clerk will not let the agent sign in.
  The server paths are covered live, above.
