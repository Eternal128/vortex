# Implementation prompt: One-section footer, and an About page with an explainer video

## Goal

1. **Footer.** The four column headers become one: a single "About Vortex" section (a
   one-line mission and a link to the About page), plus the copyright line.
2. **`/about`.** A clean, premium, intuitive page (taste skill), built around an **explainer
   video I produce**, about 80–90 seconds long. It covers **why Vortex exists** (the motive) and
   **how it works**, shown on the real app.

## Design read (taste skill)

**Reading this as:** an editorial product "About" page for self-learners, in the same clean
coral and zinc language, built on the existing tokens, with motion only where it explains
something.

**Dials:**

- **Variance 6:** an asymmetric hero, with copy on the left and the video on the right.
- **Motion 3:** the page itself is static, per your "optimize for performance" note. The motion
  lives inside the video.
- **Density 3:** airy.

Rules applied:

- No em-dashes.
- At most one eyebrow.
- Hero subtext of 20 words or fewer.
- No three-equal-cards row.
- One accent color.
- Real images (frames from the video), not fake divs.

## Page structure (`app/about/page.tsx`, public)

- **Hero (split):**
  - Left: "Learn anything from YouTube, the way a course teaches it.", a line of subtext, and
    one CTA, **Browse courses**.
  - Right: the video.
    - Native `<video controls playsInline preload="none">`, with a poster frame.
    - A **captions track (WebVTT)**, on by default.
    - It downloads nothing until the learner presses play, for performance.
- **Why we built it (the motive):** YouTube holds the best teaching in the world, but it is
  scattered: no order, no checkpoints, no way to know you have got it. Vortex adds the structure a
  course gives, and keeps the creators credited.
- **How it works:** four steps in an asymmetric layout, each with a real frame from the video.
  Step four has its own CTA to Build your own plan (a different intent, so it is not a duplicate).
  1. Find a course, or search in plain English.
  2. Watch on-site; progress saves to the second.
  3. Take a quiz when the video ends, and retake it until you pass.
  4. Build your own plan for anything else.

## The video

**Production pipeline.** Everything is scripted and reproducible, in `studio/scripts/explainer/`.
It is not part of the web build.

1. **Script** (~170 words, 7 scenes):
   - motive
   - what Vortex is
   - search to the second
   - course, enroll, and watch
   - the video ends, then the quiz, grade, and retake
   - build your own plan
   - close
2. **Opener (the motive).** 3 generated stills (Higgsfield `gpt_image_2_5`, 0.5 credits each),
   animated with slow pans and zooms: scattered video tiles, tiles snapping into an ordered
   path, and the path lit in coral.
3. **Product scenes:**
   - Recorded from the **real app** with Playwright at 1920×1080. Each scene is scripted and
     paced to its narration.
   - Smooth programmatic scrolling, and a soft cursor highlight so the eye knows where to look.
   - Signed-in scenes (enroll, progress, Build your own plan) use a **temporary Clerk demo user**
     (see the open decisions), deleted afterwards along with its progress and plan records.
4. **Narration.** Higgsfield text-to-speech (`seed_audio`), one clip per scene, in a calm neutral
   English voice. About 7 lines at roughly 1.1 credits each.
5. **Assembly.** ffmpeg does the crossfades between scenes, lays the narration over the scenes,
   and adds a gentle fade in and out.
   - **Output:** H.264 and AAC MP4, `faststart`, CRF-tuned to about 10–15MB, plus a WebVTT
     captions file and a poster JPEG.
   - Everything goes in `public/about/`.
6. **Checks.**
   - `ffprobe` confirms the duration and the audio and video streams.
   - A frame contact sheet, which I review to confirm the scenes are correct and no text is
     cut off.
   - The captions stay in sync with the narration timings.

**Cost:** about **9 Higgsfield credits** (123.9 available), or about 44 with one cinematic AI
clip in the opener.

**New tool:** `brew install ffmpeg`. It is needed to assemble the video, is a local tool only,
and is not a project dependency.

## Open decisions (asked in the approval panel)

- **Opener:** animated generated stills (about 9 credits in total, recommended), or one 5s
  cinematic AI video clip (+35 credits).
- **Signed-in scenes:**
  - Create a temporary demo user in your Clerk dev instance through its Backend API
    (recommended). It is deleted afterwards, together with its progress and plan records, and it
    finally lets me test a signed-in session end to end.
  - Or record signed-out scenes only. Enroll and plans would then be described but not shown.

## Files

- `components/layout/site-footer.tsx`: one About section.
- New `app/about/page.tsx`, and new `public/about/`: `vortex-explainer.mp4`, `.vtt`, a poster,
  and step frames.
- New `studio/scripts/explainer/*`: the script, the recording, and the assembly.

## Security considerations

- The demo user is created and deleted with `CLERK_SECRET_KEY` on your machine only. Its sign-in
  token is single-use and short-lived, and it is never printed or committed.
- The video contains only the demo account and public catalog data: no real learner data and no
  keys on screen.

## Checks

- Typecheck, lint, and build.
- `/about` in the route matrix, with no overflow.
- The video plays: the stream checks, and the page loads the poster only (no video bytes until
  play).
- Captions have no em-dashes.

## Deviations during implementation

- **Search scene narration changed.** On Groq, search runs one tool step, and in practice the
  model skips the video-moment lookup: five test queries returned lesson results only, never a
  "Watch from" card. The video does not claim what the app does not reliably do, so the line is
  "Vortex ranks the lessons that teach it, and takes you straight there", and the About copy says
  the same. The home promo banner still says "land on the exact second it is taught". That, and
  the search itself, are for a follow-up.
- **Recording uses Chrome's screencast frames** (JPEG q92, every composited frame, with
  timestamps) instead of Playwright's built-in recorder, which encodes VP8 at about 1 Mbit/s and
  blurs text. Waits (search, plan generation, player load) are cut from the timeline.
- **Footer needs no data.** The one-section footer is static, so the two Sanity fetches it made on
  every page are gone.
- **Narration voice:** Higgsfield preset Ainsley. Long pauses are shortened in assembly.

## Manual test

1. Footer: one "About Vortex" section. The link opens `/about`.
2. Press play: the explainer runs with narration and captions.
3. The step frames and CTAs work.
