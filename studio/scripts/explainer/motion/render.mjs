/**
 * Renders the About page media into public/about/:
 *
 *   vortex-explainer.mp4 / .vtt / -poster.jpg   the narrated explainer, captions, and poster
 *   step-*.mp4 / step-*.jpg                      silent 1280×720 loops for the How it works cards
 *
 *   npm run render            (after `node prepare-audio.mjs <takes>` has written src/timing.json)
 *
 * Needs ffmpeg on PATH. Remotion downloads its own headless Chrome on first run.
 */

import {spawnSync} from 'node:child_process'
import {mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(HERE, '../../../../public/about')
const TMP = join(HERE, 'out')
const ENTRY = 'src/index.ts'

// Mirrors src/theme.ts and src/Explainer.tsx.
const FPS = 30
const LEAD = 0.5
const TAIL = 0.8
const LOOP_BLEND = 15

/** Each loop, and the scene second (voice time) its poster is taken from. */
const LOOPS = {
  'step-find': {scene: 'search', posterAt: 5.4},
  'step-watch': {scene: 'enroll', posterAt: 6.6},
  'step-quiz': {scene: 'quiz', posterAt: 6.8},
  'step-plan': {scene: 'plan', posterAt: 7.8},
}

mkdirSync(OUT, {recursive: true})
mkdirSync(TMP, {recursive: true})

function run(command, args) {
  const result = spawnSync(command, args, {cwd: HERE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']})
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed:\n${result.stderr || result.stdout}`)
  return result.stdout
}

const remotion = (args) => run('npx', ['remotion', ...args, '--log=error'])
/** Moves the index to the front so the browser can start playing before the whole file arrives. */
const faststart = (from, to) => run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', from, '-c', 'copy', '-movflags', '+faststart', to])

const timing = JSON.parse(readFileSync(join(HERE, 'src', 'timing.json'), 'utf8'))
let from = 0
const timeline = timing.map((take) => {
  const frames = Math.round((LEAD + take.seconds + TAIL) * FPS)
  const scene = {...take, from, frames, voiceAt: (from + Math.round(LEAD * FPS)) / FPS}
  from += frames
  return scene
})
const lastFrame = from - 1

// 1. The explainer.
console.log('Rendering the explainer…')
remotion(['render', ENTRY, 'Explainer', join(TMP, 'explainer.mp4'), '--codec=h264', '--crf=22', '--audio-bitrate=128k'])
faststart(join(TMP, 'explainer.mp4'), join(OUT, 'vortex-explainer.mp4'))
remotion(['still', ENTRY, 'Explainer', join(TMP, 'poster.jpg'), `--frame=${lastFrame}`, '--image-format=jpeg', '--jpeg-quality=85'])
renameSync(join(TMP, 'poster.jpg'), join(OUT, 'vortex-explainer-poster.jpg'))

// 2. The step loops: silent, 1280×720, each with its own poster for reduced motion.
for (const [id, {scene, posterAt}] of Object.entries(LOOPS)) {
  console.log(`Rendering ${id}…`)
  remotion(['render', ENTRY, id, join(TMP, `${id}.mp4`), '--codec=h264', '--crf=26', '--scale=0.6667', '--muted'])
  faststart(join(TMP, `${id}.mp4`), join(OUT, `${id}.mp4`))
  const frame = Math.round((LEAD + posterAt) * FPS) - LOOP_BLEND
  remotion(['still', ENTRY, id, join(OUT, `${id}.jpg`), `--frame=${frame}`, '--scale=0.6667', '--image-format=jpeg', '--jpeg-quality=82'])
}

// 3. Captions: one cue per sentence, its edges snapped to the pauses the voice actually took.
const stamp = (seconds) => {
  const ms = Math.max(0, Math.round(seconds * 1000))
  const part = (value, size = 2) => String(value).padStart(size, '0')
  return `${part(Math.floor(ms / 3_600_000))}:${part(Math.floor((ms % 3_600_000) / 60_000))}:${part(Math.floor((ms % 60_000) / 1000))}.${part(ms % 1000, 3)}`
}

const cues = timeline.flatMap((scene) => {
  const sentences = scene.narration.match(/[^.?!]+[.?!]+/g).map((sentence) => sentence.trim())
  const {segments} = scene
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
  return sentences.map((text, i) => ({from: scene.voiceAt + bounds[i], to: scene.voiceAt + bounds[i + 1], text}))
})

writeFileSync(
  join(OUT, 'vortex-explainer.vtt'),
  `WEBVTT\n\n${cues.map((cue, i) => `${i + 1}\n${stamp(cue.from)} --> ${stamp(cue.to)}\n${cue.text}`).join('\n\n')}\n`,
)

console.log(`Done: ${(from / FPS).toFixed(1)}s, ${cues.length} captions, ${Object.keys(LOOPS).length} loops → ${OUT}`)
