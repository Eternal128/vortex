# Implementation prompt: The About explainer as colorful motion graphics

Supersedes the "Production pipeline" part of `prompts/about-page-and-explainer-video.md`
(screen recordings plus animated stills). The footer and the `/about` page from that prompt stay
as they are.

## Goal

A narrated explainer of about 75 seconds, told with **colorful, intuitive motion graphics**:
- animated UI pieces
- kinetic type
- icons, and shapes that move with meaning

It covers why Vortex exists and how it works. It plays on `/about`. The four "How it works" cards
get short, silent loops from the same scenes, so the page itself explains at a glance.

## Skills and docs read

- **The taste skill.** Motion must explain something, not decorate. One idea per beat. Honour
  reduced motion. No em-dashes in captions.
- **Higgsfield workflows:**
  - *faceless-video* (narrated explainer): generates AI footage per 10s block. AI footage invents
    UI and renders text badly, so it would **show a Vortex that does not exist**. That is a real
    risk in a video for recruiters. Its cost is also well above the 270-credit balance.
  - *video-editing* (Higgsedit): code-authored motion graphics, but it runs only in Higgsfield's
    remote sandbox, with uploads per render.
  - Higgsfield music models are reserved for its game pipeline, so no music bed from there.
- **Remotion 4.0.530** (React to MP4): deterministic frame rendering, audio tracks, and the
  project's own fonts, colors, and icons.

## Decision: code-rendered motion graphics with Remotion (recommended)

- **Accurate.** Every UI element is redrawn from Vortex's real design: tokens, Source Sans 3,
  lucide icons, real course and lesson titles, and the real quiz grading states. Nothing is
  invented.
- **Colorful.** Coral stays the hero. Scenes add a supporting palette used to code *ideas*, not
  decoration:
  - one hue per course category (teal, amber, violet, sky, lime, rose)
  - green for passed and done
  - coral for "you are here"

  This is a deliberate step outside the site's one-accent rule, because you asked for colorful.
  The site itself keeps one accent.
- **Free and reproducible.** No credits. It re-renders in minutes after a copy change.
- **Location.** A self-contained Remotion project at `studio/scripts/explainer/motion/`, with its
  own `package.json` and `node_modules` (gitignored). It is not a dependency of the web app or the
  Studio. Rendering downloads Chrome Headless Shell once.

## The storyboard (7 scenes, paced to the narration already generated)

| # | Narration (already voiced) | Motion |
|---|---|---|
| 1 | "YouTube holds some of the best teaching in the world. But it's scattered…" | A wall of colorful video tiles drifts apart, jittering. Labels pop and fade: "No order", "No checkpoints", "Did I get it?" |
| 2 | "Vortex turns those videos into real courses…" | The windmill spins up and pulls the tiles into a vortex. They land as a tidy course: modules, numbered lessons, a check per lesson, and a quiz badge. A small "by <creator>" credit on each tile. |
| 3 | "Ask in plain English. Vortex ranks the lessons that teach it…" | A search bar types "what is a context window". Ranked result cards cascade in (1, 2, 3), and the top card lifts and zooms into a lesson. |
| 4 | "Enroll for free… your place saves to the second…" | "Enroll for free" morphs to "Enrolled ✓". A player scrubs, and a coral marker drops "Saved at 5:46". The course ring fills as lessons tick. |
| 5 | "When a video ends, take a short quiz…" | The player hits the end, and a "Nice work." card flips into a 3-question quiz. Answers light green or red, the grade counts up to 67%, and a "Passed" stamp lands. A retake arrow loops. |
| 6 | "Describe your goal, and Vortex builds you a personal plan…" | "Bake sourdough bread" is typed, and sparkles fire. Module rows build downward, and a video thumbnail snaps into each lesson. |
| 7 | "Vortex. Learn anything from YouTube, the way a course teaches it." | Tiles collapse into the windmill logo and the tagline on ivory. |

**Motion language:**
- spring physics (no linear moves), 250–600ms per move, staggered entrances
- one focal move at a time, synced to the narration's key words
- 1920×1080 at 30fps

## Deliverables (`public/about/`)

- **`vortex-explainer.mp4`:** H.264 and AAC, faststart, CRF-tuned to about 6–12MB.
- **`vortex-explainer.vtt`:** captions timed to the narration's real pauses.
- **`vortex-explainer-poster.jpg`:** the final title frame.
- **`step-find.mp4`, `step-watch.mp4`, `step-quiz.mp4`, `step-plan.mp4`:** 4–6s silent loops
  (about 200–400KB each, 1280×720), plus a `.jpg` poster for each.
- **`/about` step cards:**
  - Play the loops `autoplay muted loop playsInline preload="none"`, started when scrolled into
    view.
  - Under reduced motion, show the poster only.
  - This means one small client component.

## Cleanup and cost

- The Playwright recording scripts (`record.mjs`, `demo-user.mjs`) and the stills pipeline are
  removed. The **temporary Clerk demo user is deleted now**, with its progress and plan records,
  because no recordings are needed.
- **Cost: 0 Higgsfield credits.** About 1.1 credits were already spent re-voicing scene 3. The
  opener stills generated earlier (1.5 credits) go unused.

## Files

- New `studio/scripts/explainer/motion/`:
  - `package.json`, the Remotion config, `src/` (the scenes, a shared `theme.ts` mirroring
    `globals.css`, and the composition)
  - `render.mjs`, which renders the main video and loops, then writes the captions and posters
    through ffmpeg
- `studio/scripts/explainer/script.json`: the narration text (scene 3 updated).
- `app/about/page.tsx`: steps use loops.
- New `components/about/step-loop.tsx`: a client component for the in-view play and
  reduced-motion handling.
- `.gitignore`: the motion project's `node_modules/` and `out/`.

## Security considerations

- No keys, and no network calls at render time except fetching the Google Font.
- The video shows only public catalog titles. No learner data.

## Acceptance criteria

- The video plays on `/about` with narration and captions (on by default). No text is cut off or
  clipped, and no em-dashes.
- The step loops play only in view, pause out of view, and show still posters under reduced
  motion.
- Nothing loads video bytes before play or scroll-in.

## Checks

- `ffprobe`: the duration, and the audio and video streams.
- A contact sheet (one frame every 2s), reviewed by me for clipped text and legibility.
- Caption timing spot-checked against the audio.
- `npm run typecheck`, `npm run lint`, and `npm run build`.
- `/about` in the Playwright route matrix at 375, 768, and 1440, with no overflow.
- Reduced-motion emulation shows posters.

## Manual test

1. Open `/about` and press play. The motion graphics follow the voice, with captions.
2. Scroll to "How it works". Each card loops its scene.
3. Turn on Reduce motion in your OS. The cards show stills.

## Deviations during implementation

- **One story, real data throughout.** The video follows one real lesson end to end:
  - it searches "what is a context window"
  - it shows the real top three results, in order
  - it enrolls in *Building AI Apps with LLMs* (12 lessons, 4 modules)
  - it watches *Tokens and context windows* by IBM Technology (11:31)
  - it takes that lesson's real quiz (two of the four options shown per question)

  Module 1's titles, lengths, and channel credits are real. Only the sourdough plan is
  illustrative, because plans are generated per learner.
- **Loops run the whole scene, 8–11s, not 4–6s.** Each is 140–360KB. The loop's end dissolves
  into its start, so it never jumps.
- **The "Why we built it" copy is unchanged.** The hero caption reads "A 75-second tour".
- **The Studio `tsconfig.json` excludes `scripts/explainer/motion`,** which has its own tsconfig
  and dependencies.
- **The cleaned narration is committed** as `motion/public/vo/n0-6.mp3` (about 1.7MB), so the
  video re-renders without the raw takes. To re-render: `cd studio/scripts/explainer/motion &&
  npm install && npm run render`.

## Verification results

- **`ffprobe`:** 74.0s, H.264 1920×1080 at 30fps plus stereo AAC, `moov` before `mdat`
  (faststart). 7.9MB. Loops are 1280×720, silent.
- **Contact sheet and full-size frames reviewed.** Two defects were found and fixed: the cursor
  was missing the Enroll button, and the "Saved at 5:46" pin covered the player.
- **Captions:** 17 cues, snapped to the voice's real pauses, with 0 em-dashes.
- **Browser (Playwright), 14 of 14 checks pass:**
  - `/about` returns 200 with no overflow at 375, 768, and 1440
  - zero video bytes on load
  - the explainer has `preload="none"` and a default captions track, and it plays with 17 cues
    showing
  - the loops play once scrolled into view, and only then fetch
  - reduced motion keeps all four loops on their posters
  - no em-dashes on the page
  - the footer has one "About Vortex" heading, with the link to `/about`
- **Web:** typecheck, lint, and build pass (0 warnings). **Studio:** typecheck passes.
- **Not verified by ear:** the narration wording (there is no speech recognizer available
  locally). The durations and pause structure match the script.
