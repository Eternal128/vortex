# Implementation prompt: An Apple-style launch film for the About page

## Goal

Replace the About explainer on `main` with a calm, premium launch film. It should feel like a
product-feature film Apple would release, modelled on the reference below, but it shows Vortex.
The film replaces `public/about/vortex-explainer.mp4`, together with its captions, poster and the
four step loops, so the About page and the film match.

## Reference read

The reference is ["New Apple child safety features help parents keep kids safe
online"](https://www.youtube.com/watch?v=mHXELsEResE), Apple, 2:18.

- **Canvas:** a soft, light warm grey with a faint film grain. Nothing competes with the product.
- **Title cards:** a small line ("New") over one huge, bold headline, centred, with generous
  space around it. There is one idea per card.
- **Product:** the real interface, crisp, inside a device, centred. It is shown one feature at a
  time. The camera drifts and pushes in slowly, and a tap lands where the narrator's words
  point.
- **Voice:** warm, unhurried and benefit-first. Short sentences say what it does for you, not
  how it is built.
- **Brand mark:** small, in a corner, throughout.
- **Rhythm:** slow dissolves and push-ins. No flashy wipes and no busy motion graphics. That
  is the opposite of the current 59s cut, which uses dark scattered tiles, bright highlight
  colours and wipes.

A scene-by-scene analysis of the reference is running (Higgsfield video analysis). Its timings
will tune the pacing if they arrive before rendering.

## The film: about 90 seconds, "Introducing Vortex"

| # | Title card (small line / headline) | On screen | Narration (draft, Apple tone) |
|---|---|---|---|
| 1 | Introducing / **Vortex** | The windmill settles into place on the grain canvas | "YouTube has some of the best teachers in the world. Vortex gives you a way to learn from them." |
| 2 | Courses / **In order.** | A laptop frame; a course page glides up, and its modules and lessons light up in sequence | "Real courses, built from real lessons. Every video in the right order, credited to the creator who made it." |
| 3 | Search / **Just ask.** | A question is typed; ranked lessons and a video moment appear, and a tap opens the lesson | "Ask in plain English. Vortex finds the lesson, and the moment it's taught." |
| 4 | Progress / **Right where you left off.** | The player; a "Saved at 5:46" marker settles on the progress bar | "Your place is saved to the second, so you can pick up right where you left off." |
| 5 | Quizzes / **Know that you know.** | The video ends, and a quiz is graded, with the right answer shown and a retake that passes | "When a video ends, a short quiz checks what stuck. Retake it until you pass." |
| 6 | Plans / **A plan for anything.** | A phone frame; a goal is typed, and a plan builds with a video for each lesson | "And for anything else, describe your goal. Vortex builds you a plan." |
| 7 | **Vortex.** / Learn anything, the way a course teaches it. | Logo lock-up and the site address | "Vortex. Learn anything, the way a course teaches it." |

## How it is made

1. **The interface is real, captured crisp.**
   - Playwright captures the production site at 2x pixel density, so it is sharp inside the
     frames. It covers the current `main` look: the Geist type and the colours from the revamp.
   - The signed-in states (enrolled, a saved position, a graded quiz, a built plan) use a
     **temporary Clerk demo user**. It is deleted afterwards, with its progress, plan and quota
     records.
2. **Composed in Remotion** (`studio/scripts/explainer/motion`), extending the existing project:
   - the grain canvas
   - generic device frames drawn in code: a laptop and a phone, with no Apple hardware
     designs or logos
   - slow camera moves over the screenshots (eased push-ins and pans)
   - soft tap ripples, title cards in Geist, and the windmill mark bottom-left throughout
   - cross-dissolves only
3. **Narration:** a new script (above, about 160 words) in a new, warmer voice (your pick below),
   generated with Higgsfield TTS. It is trimmed and levelled as before, and captions are timed to
   the voice.
4. **Sound:** your pick below.
5. **Outputs** keep today's file names, so the About page code barely changes:
   - `vortex-explainer.mp4` (H.264 and AAC, faststart, about 10MB), `.vtt`
   - a poster (the "Introducing Vortex" card)
   - four step loops plus posters, cut from chapters 3–6, so the page matches the film
   - The page's caption line gets the new length.

## Legal and brand guardrails

- **Apple's tone and framing, not its property:** no Apple logo, no SF Pro (it is licensed only
  for Apple platforms; we use the site's own Geist), no replicas of iPhone or MacBook hardware,
  and no footage or music from the reference.
- **The screens show only public catalog data** and the demo account. No real learner data and
  no keys appear.

## Work plan

- Branch from the latest `main`, which now includes the cloud session's PRs #3–#6, then PR and
  merge. Vercel deploys `main`.
- Cost: about 10 Higgsfield credits for narration; nothing else is paid.

## Checks

- `ffprobe` (streams, duration, faststart), a contact sheet reviewed frame by frame (no clipped
  text, nothing off-frame), captions against the voice, and no em-dashes.
- Typecheck, lint, build, and the `/about` route matrix. The page loads no video bytes before
  play, and the loops honour reduced motion.
- The demo user and its data are deleted, confirmed by a query.

## Manual test

1. Open `/about` and press play. It opens on "Introducing Vortex", and each chapter is one calm
   idea.
2. Scroll to the steps. Each loop matches its chapter.

## Decisions recorded at approval

- Voice: Sienna (Higgsfield preset).
- Sound: a subtle synthesized ambient bed.
- A temporary Clerk demo user for the signed-in captures.

## Deviations during implementation

- **The film runs 61s, not about 90s.** Each chapter is paced to the voice, with a 1.4s title
  lead-in and a dissolve. Longer felt slack against Apple's one-idea-per-beat rhythm.
- **The narration was tightened** from the draft (for example "Just ask, in plain English").
- **Playback is 1x.** The previous cut sped the media up 1.2x; the film keeps the calm pace.
- **The quiz chapter floats the real quiz card** on the canvas instead of a laptop, for
  variety. The plan chapter puts the headline left and the phone right.
- **The search typing shot** fades the page below the field, so the zoom reads as focus on the
  question.
- **The step loops start once the device is in place,** so each loop shows product rather than a
  title card: search, progress, quiz and plan.
- **The Higgsfield scene analysis of the reference** was still queued when rendering began. The
  pacing follows the reference's visible grammar and the voice timings instead.

## Verification results

- **Captures:** 15 real screens from production (desktop at 2x, phone at 3x) and 24 real lesson
  thumbnails. The demo user, and its 3 records (progress, plan, plan quota), were deleted in the
  capture script's `finally` block.
- **Film:** 61.1s, H.264 1920x1080 at 30fps plus AAC stereo, faststart, 12.5MB. The mix is
  -16.6 LUFS integrated (LRA 5.4), and the bed is -30 LUFS on its own.
- **Contact sheet reviewed frame by frame.** Three framing fixes were applied: the curriculum
  pan, the search-field focus, and the "Watch from 4:55" push-in.
- **Captions:** 14 cues timed to the voice's pauses, with no em-dashes.
- **Browser (`/about`):**
  - 200 with no overflow at 375, 768, and 1440
  - no video bytes before play
  - loops load only in view, and posters show under reduced motion
  - captions showing with 14 cues
  - playback runs in real time (2.9s, 6.0s, and 9.0s at 3, 6, and 9s)
  - the 3-second check read 0.6s, because the dev server buffers the 12.5MB file
- **Web:** typecheck, lint, and build pass. The build shows one warning, from the `Geist Pixel`
  font added by an earlier PR, not from this change. Motion project typecheck passes.
