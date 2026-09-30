# Implementation prompt: The sphere film, redrawn flat and 2D in code

## Goal

You said the generated version "looks very bad" and the screens don't look clean. This version keeps the 90s sphere film, but every frame is drawn in code (Remotion). There are no generated plates, no keying and no 3D.

## What stays

- The brief's 12 shots, chapter colours and story beats.
- The script and Alexey's 15 voice lines, at their current times.
- The composed score, the 30 sound effects and the typing ticks, as they are mixed now.
- The real captures, which are still the only UI in the film.
- The four loops, their first and last frames identical, 1280×720.

## What changes

| Now | New |
| --- | --- |
| Glossy 3D spheres from Kling, 720p, upscaled | **Flat 2D circles** in the cast colours, with a flat oval shadow. Squash and stretch on every landing, and small hops, wobbles and deflates, all drawn in code at full resolution. |
| Screens keyed into moving, tilting magenta zones, with fringes and soft edges | **Clean flat cards.** The real captures sit head-on on white rounded cards, with a 1px hairline and a soft shadow. Nothing tilts, nothing is keyed, and every pixel is sharp. |
| A generated silver laptop and phone | **Simple flat device frames** drawn in code: a dark rounded bezel, flat and generic. |
| Sphere moves only roughly matched the voice and sound effects | Every hop, landing, tap and pop lands on its sound-effect time, because both come from the same timeline. |

## Shots (same times as now)

1. **0–6 s, indigo.** Five circles drop one by one and bounce into a row, on the five bounce sounds.
2. **6–12 s, indigo.** Blank pastel cards rain down, and the circles dodge and bump. On "Good luck." a card bonks one of them.
3. **12–18 s, grey.** The white guide glides in, and the cards straighten into one column (chime). The column becomes the real course page.
4. **18–26 s, grey.** The four real module rows sit stacked as cards. The circles hop onto them one by one, with a tap each.
5. **26–32 s, sage.** The real search field floats as a card. Maya rolls in, hops onto its left end and taps twice. The question types in, then a push-in.
6. **32–39 s, sage.** The real results card rises, and the circles gather under it, looking up. The top result lifts, "Watch from 4:55" is outlined, then a push-in.
7. **39–45 s, sky.** A flat laptop plays the real lesson. Leo watches, then hops off (boing).
8. **45–52 s, sky.** Leo bounces back, and "Resumed at 5:46" springs up (pop). Push-in.
9. **52–58 s, teal.** The real quiz card, failed at 33%. Pip lands on it, the card edge pulses red twice (blips), and Pip deflates (sigh).
10. **58–65 s, teal.** Pip reinflates, the card turns to the real passed state (100%) with a green edge, and the others pop up and cheer. Push-in.
11. **65–78 s, warm.** A flat phone slides up. Sam rolls a small dough ball beside it. The goal types in, the real plan builds row by row (ding), then a push-in.
12. **78–90 s, black.** The circles roll in and line up (red, yellow, green, blue, purple, then white). The tagline fades in, then a fade to black.

## Files

- New: `src/film/cast.tsx` for the circles (squash and stretch, shadow, wobble, deflate) and `src/film/flat.tsx` for the shots.
- `Film.tsx` and `Root.tsx` keep the same compositions.
- Removed: `key.mjs`, `plates.json`, the generated plates and the keyed shot code.

## Honest limits

- The circles have no faces, as the brief says. Their personality comes from motion alone.
- "Resumed at 5:46" is still drawn over the real player. The saved second is real.
- The Higgsfield credits already spent on the plates (about 145) are not recovered. The voice lines are reused.

## Checks

- A contact sheet of all 12 shots.
- `ffprobe`: 90.0s, 1920×1080, 24fps.
- Voice onsets unchanged, and the mix at -16 LUFS.
- Loop seams identical.
- Web typecheck and lint.

## As built

- **Replaced:** the generated plates, `key.mjs`, `plates.json` and the keyed shot code are gone.
- **Now:** `src/film/cast.tsx` draws the circles, and `src/film/shots.tsx` holds the 12 shots.
- **Timing:** every landing, hop, pop and tap reads its time from the `sfx` list in `script.json`, the same list the mix uses. Three landings were added: Maya on the search bar (27.2s), Leo's return (47.5s) and Pip's drop (53.0s).
- **Screens:** real captures on white cards (22px radius, a hairline, a soft shadow), plus a flat laptop and a flat phone. Nothing is keyed, tilted or upscaled.
- **Kept:** the voice, the score and the loops.
- **Your prettyjohn1 track:** no longer used. It is back in `music/` at the repo root, where you put it, and is not committed.
