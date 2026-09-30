/**
 * Renders the About page media into public/about/:
 *
 *   vortex-explainer.mp4 / .vtt / -poster.jpg   the launch film, its captions, and its poster
 *   step-*.mp4 / step-*.jpg                      silent 1280×720 loops for the How it works cards
 *
 * Order of work, from studio/scripts/explainer/motion:
 *   node --env-file=../../../../.env.local capture.mjs     real screens from the live site
 *   node prepare-audio.mjs <dir with V01.wav … V15.wav>    the voice, cleaned and measured
 *   npm run render                                         this file (composes the score if needed, then mixes)
 *
 * Needs ffmpeg on PATH (or its path in FFMPEG). Set REMOTION_BROWSER to use an existing Chrome.
 */

import {spawnSync} from 'node:child_process'
import {existsSync, mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(HERE, '../../../../public/about')
const TMP = join(HERE, 'out')
const ENTRY = 'src/index.ts'
const FPS = 24

/** Mirrors LOOPS in src/film/Film.tsx; `poster` is the film time each card's still is taken from. */
const LOOPS = {
  'step-find': {from: 26, poster: 37.6},
  'step-watch': {from: 39, poster: 49.6},
  'step-quiz': {from: 52, poster: 63.4},
  'step-plan': {from: 65, poster: 76.5},
}

/** The film's poster: the spheres lined up on black, under the tagline. */
const POSTER_AT = 86

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
const x264 = (crf) => ['-c:v', 'libx264', '-crf', String(crf), '-preset', 'slow', '-pix_fmt', 'yuv420p', '-r', String(FPS)]

const timing = JSON.parse(readFileSync(join(HERE, 'src', 'timing.json'), 'utf8'))

/** `--loops-only` re-renders just the step loops, reusing the film already in public/about. */
const loopsOnly = process.argv.includes('--loops-only')

// 1. The film: silent picture from Remotion, the soundtrack from mix.mjs, muxed and moved to the front for streaming.
if (!loopsOnly) {
  if (!existsSync(join(HERE, 'public', 'music', 'score.wav'))) run('node', ['score.mjs'])
  console.log('Mixing the soundtrack…')
  run('node', ['mix.mjs'])
  console.log('Rendering the film…')
  remotion(['render', ENTRY, 'Explainer', join(TMP, 'film.mp4'), '--codec=h264', '--crf=14', '--muted'])
  ffmpeg(['-i', join(TMP, 'film.mp4'), '-i', join(TMP, 'mix.wav'), '-map', '0:v', '-map', '1:a', ...x264(23), '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', join(OUT, 'vortex-explainer.mp4')])
  remotion(['still', ENTRY, 'Explainer', join(TMP, 'poster.jpg'), `--frame=${Math.round(POSTER_AT * FPS)}`, '--image-format=jpeg', '--jpeg-quality=88'])
  renameSync(join(TMP, 'poster.jpg'), join(OUT, 'vortex-explainer-poster.jpg'))
}

// 2. The step loops: silent, 1280×720, each with its own poster for reduced motion.
for (const [id, {from, poster}] of Object.entries(LOOPS)) {
  console.log(`Rendering ${id}…`)
  remotion(['render', ENTRY, id, join(TMP, `${id}.mp4`), '--codec=h264', '--crf=14', '--muted'])
  ffmpeg(['-i', join(TMP, `${id}.mp4`), '-vf', 'scale=1280:-2:flags=lanczos', ...x264(27), '-an', '-movflags', '+faststart', join(OUT, `${id}.mp4`)])
  remotion(['still', ENTRY, id, join(TMP, `${id}.png`), `--frame=${Math.round((poster - from) * FPS)}`, '--image-format=png'])
  ffmpeg(['-i', join(TMP, `${id}.png`), '-vf', 'scale=1280:-2:flags=lanczos', '-q:v', '3', join(OUT, `${id}.jpg`)])
}

// 3. Captions: one cue per line, from its first word to a moment after its last, never over the next line.
const stamp = (seconds) => {
  const ms = Math.max(0, Math.round(seconds * 1000))
  const part = (value, size = 2) => String(value).padStart(size, '0')
  return `${part(Math.floor(ms / 3_600_000))}:${part(Math.floor((ms % 3_600_000) / 60_000))}:${part(Math.floor((ms % 60_000) / 1000))}.${part(ms % 1000, 3)}`
}
const cues = timing.lines.map((line, i) => {
  const spoken = line.segments.at(-1)[1] - line.lead
  const next = timing.lines[i + 1]?.at ?? timing.seconds
  return {from: line.at, to: Math.min(line.at + spoken + 0.5, next - 0.05), text: line.text}
})
writeFileSync(
  join(OUT, 'vortex-explainer.vtt'),
  `WEBVTT\n\n${cues.map((cue, i) => `${i + 1}\n${stamp(cue.from)} --> ${stamp(cue.to)}\n${cue.text}`).join('\n\n')}\n`,
)

console.log(`Done: ${timing.seconds}s film, ${cues.length} captions, ${Object.keys(LOOPS).length} loops → ${OUT}`)
