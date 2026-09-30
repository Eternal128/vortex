# Implementation prompt: The 90s sphere film (Higgsfield production brief)

## Goal

Build the About film from your doc **"Vortex film, Higgsfield production brief"**. It replaces the current 61s film on `main`.

- 90s at 1920×1080. The brief says 24fps for delivery; the current pipeline runs at 30fps, so the render switches to 24.
- Style: Apple's child-safety film. A flat colour background per chapter, glossy learner spheres with personality, real Vortex screens floating free of the device, and witty narration over a playful orchestral score.
- Cast: the five learner spheres (Maya, Leo, Sam, Kai, Pip) plus the white Vortex guide sphere.
- Script and timing: the brief's 12-shot list and 14-line script, at the times in its tables.
- Loops: the four How it works loops (Search, Progress, Quiz, Plan), each starting and ending on a plain background.

Your decisions (this conversation):

| Decision | Answer |
| --- | --- |
| Spheres | Generated on Higgsfield, with real screens composited in the edit |
| Length | 90s, the full brief |
| Music | Made to your orchestral spec: 120 BPM, D major, exactly 90s, with a pizzicato and glockenspiel hook |
| Voice | Alexey (Higgsfield preset `7c2133e5-68ab-511f-9aed-9a67664382b1`) |

## Read and inspected

- The doc: all its sections, the shot list, the script table and the open questions.
- The current film: `studio/scripts/explainer/motion/`. That covers `capture.mjs`, `prepare-audio.mjs`, `mix.mjs`, `render.mjs`, `src/film/*`, `layout.json` and the About page.
- Higgsfield:
  - Balance: 199.3 credits, Starter plan.
  - Kling 3.0: `std` mode, silent, 3 to 15s per shot, start and end frame inputs, 12 credits per 8s.
  - Seedance 2.5: 56 credits per 8s at 720p and 96 at 1080p, so it is too expensive for 12 shots.
  - Images: `gpt_image_2_5` costs 0.25 credits each.
  - Voice: seed_audio costs 0.5 credits per line.

## How it is made

1. **Screens (real, never generated).** Recapture S1 to S7 from a temporary signed-in demo user, at 2x on desktop and 3x on phone, as today. The demo user and its data are deleted afterwards.
   - S3's query becomes "How do context windows work?".
   - S2 is shown with all modules collapsed.
   - S7 needs one plan built. That waits for YouTube's daily search quota, which is exhausted today and resets at 07:00 UTC.
   - The three "transparent cards" are exact crops of these captures, cut in the composition. They are not separate exports.
2. **Cast lock.** One `gpt_image_2_5` still of the six spheres in a row on light grey, to the brief's colours and roles. I regenerate until sizes and colours are right, then show it to you before going further. That still is the reference for every later image.
3. **Keyframes.** One still per shot, with the cast still as reference.
   - Each is on its hex background, and screen shots keep a flat, empty zone where the screen will go.
   - The loop shots (5, 6, 7, 8, 9, 10 and 11) get a plain-background start frame and end frame.
   - I show you all 12 before any video is generated.
4. **Animation.** Kling 3.0 `std`, silent, image to video, one generation per shot, lengths from the shot list (6 to 13s).
   - Loop shots use their plain start and end frames, so they cut out cleanly.
   - Any shot whose spheres change colour, or whose empty zone gets texture, is regenerated from the retake budget.
5. **Edit (Remotion, in the existing motion project, not Higgsfield's editor).** Each plate plays as a video layer.
   - The real screens are pinned into the empty zones: matching corner radius, a soft 20% shadow, a 4% scale ease-in.
   - The camera pushes in until the named card fills about 60% of the frame (shots 5, 6, 8 and 10).
   - The search query types in as a layer.
   - The tagline is added as text, white on black, in Geist. Geist is the site's own face; I'd use it instead of Inter Display or SF Pro, which the brief names.
6. **Voice.** Alexey reads the 14 lines, one take per line, cleaned and levelled as now, each placed at its time in the brief.
7. **Music.** Composed in code, since Higgsfield's music model is limited to its game pipeline. It follows your spec section by section:
   - 120 BPM, D major, exactly 90.0s.
   - A 2-bar hook that returns varied in every section.
   - A woodwind flutter at 6s, a clarinet slide at 55s, the lift at 60s, the full ensemble at 65s.
   - One held note at 78s, and the D major resolve at 84s with a glockenspiel sparkle.
8. **SFX.** Synthesized in code and placed per the brief's table:
   - soft bounces, whooshes and thuds, and a comic bonk
   - a glassy chime, row taps and keyboard ticks
   - a rising shimmer, a boing, a spring pop and error blips
   - a success chime and an oven ding
   - one low note at the end
9. **Mix.** The music ducks about 8 dB under the voice, the SFX sit on top, and the whole mix is levelled to -16 LUFS.
10. **Outputs.** Same file names in `public/about/`:
    - the film, captions re-timed from the new voice, and a poster
    - the four loops at 1280×720, with posters

## Credits

| Item | Credits |
| --- | --- |
| 12 Kling shots, 90s at 1.5 credits per second | 135 |
| Cast still and 12 keyframes, with retries (about 20 images) | 5 |
| 14 voice lines | 7 |
| **Planned total** | **about 147 of 199** |
| Left for retakes | about 50 (4 shots of 8s) |

I stop and ask before spending past 180 credits.

## Honest limits, flagged up front

- **The music can't fully meet "no synths".** It is made in code: plucked strings, glockenspiel, marimba and brushed percussion come from physical models and sound convincingly acoustic. Flute, clarinet and cello are approximations and will sound somewhat synthetic. If that isn't good enough, drop in a track (as you did with prettyjohn1) and it replaces mine with no other change.
- **The sigh and the small cheer are hard to synthesize.** The sigh becomes a soft falling breath. The cheer becomes a bright glockenspiel flourish.
- **Spheres can't touch the UI precisely.** Kling doesn't know where the screen will sit, so "hops onto the module rows" and "rolls onto the search bar" happen around the empty zone. The composited UI reacts on the beat (a row lights, the query types), but a sphere won't land pixel-exactly on a row.
- **Kling `std` renders at 720p.** 1080p needs `pro`, which requires a higher Higgsfield plan. The plates are upscaled to 1080p in the edit. The UI stays sharp because it comes from the 2x captures, but the spheres will be a little soft on the push-ins.
- **Colour drift.** Video models can shift colours between shots. The cast still and the fixed hex backgrounds keep this down, and the retake budget covers the worst shots.
- **"Resumed at 5:46" is a motion graphic.** The site saves the second, but this pill isn't site UI. As in the current film, it is drawn over the real player.

## Brief's open questions, as answered

- **Length:** 90s (you chose it).
- **Loops:** silent, as today; the About page loops never had sound.
- **Screens:** a temporary demo account on the "Building AI Apps with LLMs" course, as the capture list names.

## Security

- The demo user's sign-in ticket is never printed. The demo user and its `progress`, `plan` and `planQuota` documents are deleted afterwards.
- No keys go into prompts, files or commits.
- The Higgsfield uploads are screenshots of public catalog pages and the demo account only.

## Acceptance criteria

- 90.0s, 1920×1080, 24fps, with the index moved to the front so playback starts early.
- Every one of the 14 lines starts within 0.05s of its time in the brief.
- Each chapter's background matches its hex value.
- All screens are real captures, and none is generated.
- The four loops start and end on a plain background, and their first and last frames are identical.
- The music ducks by about 8 dB under speech, and the mix measures -16 LUFS.
- The captions have no em-dashes, and the About page alt texts are updated.

## Checks

- `ffprobe` on the film and the loops.
- Measured voice onsets and ducking.
- A contact sheet of all 12 shots.
- A pixel comparison of each loop's first and last frames.
- Web typecheck, lint and build, then `/about` in the browser.
- Credits spent, reported.

## Manual test

1. Open `/about` and play the film. The spheres bounce, each chapter has its own colour, the screens are real, and the jokes land on the sound effects.
2. Turn on captions and check they follow the voice.
3. Scroll to How it works and check the four loops run with no visible seam.

## As built (changes during the build)

- **Magenta screen zones.** Keyframes and plates carry flat magenta (#FF00FF) zones instead of white; magenta because Sam is green.
  - `key.mjs` keys them out by hue, into VP9 video with alpha, and tracks every zone frame by frame (`tracks.json`).
  - The real screen sits behind the plate. Spheres that pass in front of a screen stay in front of it, and the screen follows its zone as the card drifts or tilts.
- **Plates are not committed.** `plates.json` lists their Higgsfield URLs, and `key.mjs` downloads any that are missing.
- **Continuity:**
  - Keyframes 8 and 10 were regenerated from 7 and 9, so the laptop and the quiz card stay put across each cut.
  - Plates 5 and 11 were redone with end frames pinned: the search bar had tilted into a thin slab, and the phone had split into two.
- **Credits:** about 145 spent, 54 left at the end.
  - 14 Kling generations, 12 shots plus 2 retakes, came to about 118.
  - About 20 images and 15 voice lines came to about 13.
  - The batch refused some submissions with "out of credits" while the balance still covered them. Resubmitting worked.
- **Search question:** "How does strict mode work in TypeScript?", not the brief's "How do context windows work?".
  - The brief's question returned lesson-only results with no video moment, and three of its four matches were off-topic (Kubernetes pods, autoscaling, CSVs). That would undercut the line "the exact moment it's explained".
  - The strict-mode question returns a real moment at 4:55.
- **Voice:** Alexey, one take per line. "Good luck." moved from 10s to 11s, and line 2's comic pauses are capped at 0.45s, so the two don't overlap. Every line starts within 4 ms of its time.
- **Score:** composed in code (`score.mjs`) to your spec, section by section.
- **Sound effects:** synthesized (`mix.mjs`), placed from the `sfx` list in `script.json` against the moments in the plates.
- **Mix:** the score ducks about 8 dB under speech, and the whole mix measures -16 LUFS.
- **The end:** only the tagline is added text, white on black, in Geist. The spheres line up, then the frame fades to black at 88.6 to 90s.
- **Loops:** each is one chapter, 13s long. Frame 0 and the last frame are pixel-identical (checked).
  - A first attempt used Remotion's `Freeze` for the blend. It clamps to the loop's own length, so the loops now use a sequence offset instead.
- **About page:** the copy now says "90-second", and the four alt texts describe the sphere loops.
