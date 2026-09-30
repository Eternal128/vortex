# Implementation prompt: The launch film, rebuilt to the new Apple-style brief

## Goal

Rebuild the About film to your brief: 1920×1080, 30fps, 61s, with the voiceover timings fixed as
given. The camera is always alive, the real UI is animated through each actual interaction,
cuts are matched on shape and motion and snapped to the music's 0.6s beat, three lifestyle
cutaways are added, the voice and music are new with ducking and UI sound effects, captions are
re-timed, and four seamless loops are made for the How it works cards. It replaces the film
on `main`.

## What changes from the current film

| Brief asks for | Today | Plan |
|---|---|---|
| Camera never static; laptop drifts in slow 3D; a push-in on the element being talked about until it fills most of the frame, then ease out | Slow 2D pans; some holds | A CSS 3D rig: perspective, a few degrees of rotation, a slow push. In every chapter, about 1s in, a push-in on the named element, then out. Ease-in-out only. |
| Headlines word by word, drifting up, blur to sharp | The whole headline fades | A per-word reveal: 0.12s stagger, blur 10px to 0, 24px drift |
| Accent colour from the logo | Neutral | One accent from the windmill (its amber sail) for highlights, rings and the checkmark |
| Real UI, real motion | Stills with pans | New captures of **each interaction state**: per-character typing, per-answer selection, player positions and a pause, and the plan typed. Rows and cards are **cropped from the real captures** and animated individually (they stagger in, cascade, and expand). No generated UI. |
| Intro: thumbnail wall drifts up in parallax, snaps into an ordered column | Two drifting rows | Three depth layers drifting upward, then snapping into one ordered column |
| Courses: rows stagger in with the creator's avatar and name | Rows do not show a creator | **A small real feature:** each lesson row in the course curriculum shows its creator (avatar and channel), from the video credits already in the dataset. Then it is filmed. |
| Search: a plain-English question typed character by character; results cascade; one result expands to its timestamp | Three word-by-word frames | Per-character captures of **"How does strict mode work in TypeScript?"**. It returns "tsconfig and strictness settings" first, with the real moment "strict mode — the big one" at 4:55 (checked on production today). The top card lifts and expands until its "Watch from 4:55" fills the frame. |
| Progress: the player scrubs forward and pauses; a "Resumed at 5:46" pill springs in; zoom on the pill | A static frame and a pill | About 12 real player captures, seeking 5:30 to 5:46 with controls showing, then paused. The pill springs in, and the camera pushes into it. |
| Quiz: answers selected, grade counts up, wrong turns red then green, checkmark draws | Two stills | Real captures per selection. The grade number counts up over the real card, the failed rows cross to the passed rows, and a drawn checkmark lands on "Passed". |
| Plan: laptop rotates and morphs into a phone; goal typed; syllabus builds line by line; a thumbnail snaps onto each lesson | A separate phone | A 3D turn, and the laptop frame morphs its size and corners into the phone. Per-character typing of "Bake sourdough bread". A real plan is built, and its rows and thumbnails are cropped and snapped in one by one. |
| Match cuts (search bar becomes the next headline bar; laptop becomes the phone) | Dissolves | Shape-matched morphs at every chapter boundary. No hard cuts, no wipes. |
| Lifestyle clips A, B, C | None | Three 5s clips generated to your style notes; about 1.5s of each is used at the given times |
| New voice, new music, ducking, beat-snapped cuts, UI sounds | Previous voice and bed | All 14 lines voiced separately and placed at your exact times. Music ducked under speech (sidechain compression). Chapter cuts and headline reveals snapped to the nearest 0.6s beat. Soft clicks on each typed character and a quiet chime on "Passed". |
| Captions re-timed from the new voice | 14 cues | Re-timed from each line's measured speech |
| Four loops whose first and last frames are identical | Dissolve seam | The loop's closing frames return to the exact opening state, so frame 1 equals the final frame |

## Fixed timeline (as given)

| Time (s) | Chapter | Voiceover starts (s) | Other |
|---|---|---|---|
| 0–8.5 | Intro | 1.6, 4.7 | Lifestyle clip A, 7–8.5 |
| 9–19.5 | Courses: "In order." | 9.1, 12.8 | |
| 20–28 | Search: "Just ask." | 20.5, 23.2 | Lifestyle clip B, 27–28.5 |
| 29–36 | Progress: "Right where you left off." | 29.1, 31.5 | |
| 36–44 | Quizzes: "Know that you know." | 36.5, 40.5 | Lifestyle clip C, 43–44.5 |
| 45–52 | Plans: "A plan for anything." | 45, 48.6 | |
| 53–61 | End | 53.2, 54.5 | Logo, tagline, 2s hold |

## How it is made

- **Captures.** `capture.mjs` is extended to record every interaction state plus a
  `layout.json` of element boxes, so crops and push-ins are exact. It uses a temporary Clerk
  user, deleted with its data afterwards, as before.
- **Composition.** Remotion renders silent video. The final audio mix is built in ffmpeg:
  - the voice placed at the exact times
  - music ducked under the voice by sidechain compression
  - sound effects on the typing and quiz frames

  The two are then muxed together.
- **Lifestyle clips.** Kling 3.0 on Higgsfield, 10 credits per 5s: 30 credits, or 60 if a clip
  needs a second take. Generated people only; screens out of focus; no logos or text.
- **Outputs** keep today's file names in `public/about/`, so the page barely changes. The caption
  keeps "a one-minute film".

## Honest limits, flagged up front

- **The "Resumed at 5:46" pill, the count-up and the drawn checkmark are motion graphics** laid
  over the real UI. The saved second, the grade and "Passed" are real.
- **The search result "expanding"** is the real card lifting and scaling; the site does not
  expand cards.
- **Brief timings sit off the beat grid.** VO timings stay exactly as given. Chapter cuts and
  headline reveals snap to 0.6s beats: 9.0, 19.8, 28.8, 36.0, 45.0, 52.8.

## Security

- The demo user's ticket is never printed. The user and its data are deleted in `finally`.
- Captures show only public catalog data and the demo account.

## Checks

- `ffprobe`: 61.0s, 1920×1080, 30fps, faststart.
- VO onsets measured against the brief's times (within ±0.05s).
- Music ducking measured under speech.
- A contact sheet reviewed.
- Each loop's first and last frames compared pixel for pixel.
- Captions checked for em-dashes.
- Web typecheck, lint and build. The `/about` browser checks.
- The new creator column on course pages checked in the route matrix.

## Manual test

1. `/about`: play the film. The cuts land on the beat, the voice sits over the music, and the
   typing clicks.
2. A course page: each lesson row shows its creator.
3. The How it works cards loop with no visible seam.

## As built (changes agreed during the build)

- **No lifestyle clips.** Dropped at your request ("remove the part where you need human characters"). Nothing generated with people is used.
- **No creator rows feature.** You chose to skip it. The course's existing "Videos by IBM Technology, Adam Lucek and 8 more" line is filmed instead, and an accent outline draws around it on "credited to the creator".
- **Voice:** Gia (Higgsfield seed_audio preset), one take per line.
  - Each take is trimmed and its pauses are capped at 0.3s. "Retake it until you pass" had a 1.2s gap mid-line, capped at 0.12s.
  - Each take is levelled to -16 LUFS.
  - Every first word lands within 1 ms of the brief's time.
- **Music: your track**, "Inspirational" by prettyjohn1 (`public/music/prettyjohn1-inspirational-604479.mp3`, 61.3s).
  - A track composed in code came first. It was removed at your request, then replaced with this one.
  - The track runs at about 94 BPM, so the cuts, which stay on the film's 0.6s grid, are near its beat but not locked to it.
- **Mix (`mix.mjs`):**
  - The music sits at -15 dB (about -24 LUFS) and is ducked by sidechain compression: about 8.5 dB under speech, 0 dB between lines.
  - It fades out over the last 1.5s.
  - A synthesized click plays on each typed character, a tap on send, and a chime on "Passed".
  - The whole mix is levelled to -16 LUFS, peaking at -1.3 dBFS.
- **Plan goal:** "Bake sourdough bread at home" if the shorter "Bake sourdough bread" does not build a plan. YouTube's daily search quota ran out during the build, so the plan chapter was captured after the reset.
- **Sharpness:** Chrome rasterizes 3D-transformed layers at their own size and then enlarges them. The device is laid out 3x larger inside its 3D layer and scaled back down in the same transform, so push-ins stay sharp.
- **Captures:** full-page shots put sticky headers back in the page flow and hide floating bars, and the film lays the header over the screen itself.
- **Loops:** each ends by blending into its own first frame. Frame 0 and the last frame are pixel-identical (checked).
