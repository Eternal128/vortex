/**
 * Renders the About page media into public/about/:
 *
 *   vortex-explainer.mp4 / .vtt / -poster.jpg   the launch film, its captions, and its poster
 *   step-*.mp4 / step-*.jpg                      silent 1280×720 loops for the How it works cards
 *
 * Order of work, from studio/scripts/explainer/motion:
 *   node --env-file=../../../../.env.local capture.mjs     real screens from the live site
 *   node --env-file=../../../../.env.local thumbnails.mjs  real lesson frames for the opening
 *   node prepare-audio.mjs <dir with n0.wav … n6.wav>      narration, levelled and timed
 *   node music.mjs                                         the music bed, to the film's length
 *   npm run render                                         this file
 *
 * Needs ffmpeg on PATH (or its path in FFMPEG). Set REMOTION_BROWSER to use an existing Chrome.
 */

import {spawnSync} from 'node:child_process'
import {mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(HERE, '../../../../public/about')
const TMP = join(HERE, 'out')
const ENTRY = 'src/index.ts'

// Mirrors src/theme.ts and src/film/Film.tsx.
const FPS = 30
const DISSOLVE = 24
const LOOP_BLEND = 15
const LOOP_STARTS = {search: 1.4, progress: 1.4, quiz: 1.6, plan: 0.8}

/** Each loop's chapter, and the voice-time its still poster is taken from. */
const LOOPS = {
  'step-find': {scene: 'search', posterAt: 6.1},
  'step-watch': {scene: 'progress', posterAt: 4.2},
  'step-quiz': {scene: 'quiz', posterAt: 3.4},
  'step-plan': {scene: 'plan', posterAt: 5.4},
}

/** The poster is the opening card, once "Introducing Vortex" has fully settled. */
const POSTER = {scene: 'intro', at: 1.4}

mkdirSync(OUT, {recursive: true})
mkdirSync(TMP, {recursive: true})

function run(command, args) {
  const result = spawnSync(command, args, {cwd: HERE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']})
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed:\n${result.stderr || result.stdout}`)
  return result.stdout
}

const browser = process.env.REMOTION_BROWSER ? [`--browser-executable=${process.env.REMOTION_BROWSER}`] : []
const remotion = (args) => run('npx', ['remotion', ...args, ...browser, '--log=error'])
const ffmpeg = (args) => run(process.env.FFMPEG ?? 'ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args])

/** Re-encodes for the web: H.264, the index moved to the front so playback starts before the download ends. */
function publish(from, to, {audio, crf, width}) {
  const scale = width ? ['-vf', `scale=${width}:-2:flags=lanczos`] : []
  ffmpeg(['-i', from, ...scale, '-r', String(FPS), '-c:v', 'libx264', '-crf', String(crf), '-preset', 'slow', '-pix_fmt', 'yuv420p', ...(audio ? ['-c:a', 'aac', '-b:a', '160k'] : ['-an']), '-movflags', '+faststart', to])
}

const timing = JSON.parse(readFileSync(join(HERE, 'src', 'timing.json'), 'utf8'))
let from = 0
const timeline = timing.map((take, i) => {
  const frames = Math.round((take.lead + take.seconds + take.tail) * FPS)
  const chapter = {...take, from, frames, voiceAt: (from + Math.round(take.lead * FPS)) / FPS}
  from += frames - (i < timing.length - 1 ? DISSOLVE : 0)
  return chapter
})
const chapterOf = (name) => timeline.find((chapter) => chapter.name === name)
const total = (timeline.at(-1).from + timeline.at(-1).frames) / FPS

/** `--loops-only` re-renders just the step loops, reusing the film already in public/about. */
const loopsOnly = process.argv.includes('--loops-only')

// 1. The film.
if (!loopsOnly) {
  console.log('Rendering the film…')
  remotion(['render', ENTRY, 'Explainer', join(TMP, 'film.mp4'), '--codec=h264', '--crf=16', '--audio-bitrate=192k'])
  publish(join(TMP, 'film.mp4'), join(OUT, 'vortex-explainer.mp4'), {audio: true, crf: 21})
  const intro = chapterOf(POSTER.scene)
  const posterFrame = intro.from + Math.round((intro.lead + POSTER.at) * FPS)
  remotion(['still', ENTRY, 'Explainer', join(TMP, 'poster.jpg'), `--frame=${posterFrame}`, '--image-format=jpeg', '--jpeg-quality=88'])
  renameSync(join(TMP, 'poster.jpg'), join(OUT, 'vortex-explainer-poster.jpg'))
}

// 2. The step loops: silent, 1280×720, each with its own poster for reduced motion.
for (const [id, {scene, posterAt}] of Object.entries(LOOPS)) {
  console.log(`Rendering ${id}…`)
  remotion(['render', ENTRY, id, join(TMP, `${id}.mp4`), '--codec=h264', '--crf=18', '--muted'])
  publish(join(TMP, `${id}.mp4`), join(OUT, `${id}.mp4`), {audio: false, crf: 26, width: 1280})
  const frame = Math.round((posterAt - LOOP_STARTS[scene]) * FPS) - LOOP_BLEND
  remotion(['still', ENTRY, id, join(TMP, `${id}.png`), `--frame=${frame}`, '--image-format=png'])
  ffmpeg(['-i', join(TMP, `${id}.png`), '-vf', 'scale=1280:-2:flags=lanczos', '-q:v', '3', join(OUT, `${id}.jpg`)])
}

// 3. Captions: one cue per sentence, its edges snapped to the pauses the voice actually took.
const stamp = (seconds) => {
  const ms = Math.max(0, Math.round(seconds * 1000))
  const part = (value, size = 2) => String(value).padStart(size, '0')
  return `${part(Math.floor(ms / 3_600_000))}:${part(Math.floor((ms % 3_600_000) / 60_000))}:${part(Math.floor((ms % 60_000) / 1000))}.${part(ms % 1000, 3)}`
}

const cues = timeline.flatMap((chapter) => {
  const sentences = chapter.narration.match(/[^.?!]+[.?!]+/g).map((sentence) => sentence.trim())
  const {segments} = chapter
  const first = segments[0][0]
  const last = segments.at(-1)[1]
  const gaps = segments.slice(1).map(([start], i) => (segments[i][1] + start) / 2)
  const letters = sentences.reduce((sum, sentence) => sum + sentence.length, 0)
  let seen = 0
  const bounds = [first]
  for (const sentence of sentences.slice(0, -1)) {
    seen += sentence.length
    const guess = first + (last - first) * (seen / letters)
    const snapped = gaps.length ? gaps.reduce((best, gap) => (Math.abs(gap - guess) < Math.abs(best - guess) ? gap : best)) : guess
    bounds.push(Math.max(snapped, bounds.at(-1) + 0.4))
  }
  bounds.push(last)
  return sentences.map((text, i) => ({from: chapter.voiceAt + bounds[i], to: chapter.voiceAt + bounds[i + 1], text}))
})

writeFileSync(
  join(OUT, 'vortex-explainer.vtt'),
  `WEBVTT\n\n${cues.map((cue, i) => `${i + 1}\n${stamp(cue.from)} --> ${stamp(cue.to)}\n${cue.text}`).join('\n\n')}\n`,
)

console.log(`Done: ${total.toFixed(1)}s, ${cues.length} captions, ${Object.keys(LOOPS).length} loops → ${OUT}`)
