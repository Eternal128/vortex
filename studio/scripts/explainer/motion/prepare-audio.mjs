/**
 * Cleans the voice lines and measures them, so the film and captions follow the voice.
 *
 *   node prepare-audio.mjs <dir with V01.wav … V15.wav>
 *
 * Each take (script.json `lines`) is trimmed to its first and last word, its pauses capped (0.3s, or
 * the line's `maxPause`), and levelled to -16 LUFS, then written to public/vo/<id>.flac (lossless,
 * so a line lands on its exact time with no encoder delay). src/timing.json gets the script plus
 * each line's length and spoken stretches, for the composition, the mix and the captions.
 * Needs ffmpeg on PATH.
 */

import {spawnSync} from 'node:child_process'
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const source = process.argv[2]
if (!source) throw new Error('Usage: node prepare-audio.mjs <dir with V01.wav … V15.wav>')

const script = JSON.parse(readFileSync(join(HERE, '..', 'script.json'), 'utf8'))
const PAUSE = 0.3
const FLOOR = '-50dB'

function run(command, args) {
  const result = spawnSync(command, args, {encoding: 'utf8'})
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr}`)
  return result
}

const seconds = (file) =>
  Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).stdout.trim())

/** Spoken stretches as [start, end] seconds, from ffmpeg's silence detector. */
function speechSegments(file, minSilence = 0.12) {
  const {stderr} = run('ffmpeg', ['-hide_banner', '-i', file, '-af', `silencedetect=n=${FLOOR}:d=${minSilence}`, '-f', 'null', '-'])
  const total = seconds(file)
  const silences = []
  let start = null
  for (const line of stderr.split('\n')) {
    const opened = line.match(/silence_start: (-?[\d.]+)/)
    const closed = line.match(/silence_end: ([\d.]+)/)
    if (opened) start = Math.max(0, Number(opened[1]))
    if (closed && start !== null) {
      silences.push([start, Number(closed[1])])
      start = null
    }
  }
  if (start !== null) silences.push([start, total])
  const segments = []
  let cursor = 0
  for (const [from, to] of silences) {
    if (from > cursor) segments.push([cursor, from])
    cursor = to
  }
  if (cursor < total) segments.push([cursor, total])
  return segments.filter(([a, b]) => b - a > 0.1).map(([a, b]) => [Number(a.toFixed(3)), Number(b.toFixed(3))])
}

mkdirSync(join(HERE, 'public', 'vo'), {recursive: true})
const lines = script.lines.map((line) => {
  const input = join(source, `${line.id}.wav`)
  const spoken = speechSegments(input)
  const cap = line.maxPause ?? PAUSE
  // Keep each spoken stretch with a breath of room either side; any pause longer than the cap is shortened.
  const EDGE = 0.04
  const pieces = spoken.map(([a, b], i) => {
    const gapAfter = i < spoken.length - 1 ? spoken[i + 1][0] - b : 0
    const tail = i < spoken.length - 1 ? Math.min(gapAfter, cap) : EDGE
    return [Math.max(0, a - (i === 0 ? EDGE : 0)), b + tail]
  })
  const chain = pieces.map(([a, b], i) => `[0]atrim=${a.toFixed(3)}:${b.toFixed(3)},asetpts=PTS-STARTPTS[p${i}]`)
  const joined = `${pieces.map((_, i) => `[p${i}]`).join('')}concat=n=${pieces.length}:v=0:a=1[joined]`
  const out = join(HERE, 'public', 'vo', `${line.id}.flac`)
  const temp = join(HERE, 'out', `${line.id}.wav`)
  mkdirSync(join(HERE, 'out'), {recursive: true})
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', input, '-filter_complex', `${chain.join(';')};${joined}`, '-map', '[joined]', '-ac', '1', temp])
  // Level with a measured gain (not loudnorm's dynamic mode), so the take's own dynamics are kept.
  const {stderr} = run('ffmpeg', ['-hide_banner', '-i', temp, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
  const loudness = Number(stderr.match(/I:\s+(-?[\d.]+) LUFS/g).at(-1).match(/-?[\d.]+/)[0])
  const peak = Number(stderr.match(/Peak:\s+(-?[\d.]+) dBFS/g).at(-1).match(/-?[\d.]+/)[0])
  const gain = Math.min(-16 - loudness, -1.5 - peak)
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', temp, '-af', `volume=${gain.toFixed(2)}dB,aresample=48000`, '-ac', '1', '-c:a', 'flac', out])
  const segments = speechSegments(out)
  return {...line, lead: speechSegments(out, 0.02)[0][0], seconds: Number(seconds(out).toFixed(3)), segments}
})

const {lines: _, ...rest} = script
writeFileSync(join(HERE, 'src', 'timing.json'), `${JSON.stringify({...rest, lines}, null, 2)}\n`)
for (const line of lines) {
  const spoken = line.segments.at(-1)[1] - line.segments[0][0]
  console.log(`${line.id} at ${line.at}s: ${spoken.toFixed(2)}s spoken, ends ${(line.at + spoken).toFixed(2)}s`)
}
