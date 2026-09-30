/**
 * Cleans the narration takes and measures them, so the scenes can be paced to the voice.
 *
 *   node prepare-audio.mjs <dir with n0.wav … n6.wav>
 *
 * Each take is trimmed, its long pauses shortened, and levelled to -16 LUFS, then written to
 * public/vo/n<i>.mp3. src/timing.json gets each take's length and its spoken stretches, which the
 * composition uses for scene lengths and render.mjs for caption timing. Needs ffmpeg on PATH.
 */

import {spawnSync} from 'node:child_process'
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const source = process.argv[2]
if (!source) throw new Error('Usage: node prepare-audio.mjs <dir with n0.wav … n6.wav>')

const {scenes} = JSON.parse(readFileSync(join(HERE, '..', 'script.json'), 'utf8'))

function run(command, args) {
  const result = spawnSync(command, args, {encoding: 'utf8'})
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr}`)
  return result
}

const seconds = (file) =>
  Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).stdout.trim())

/** Spoken stretches as [start, end] seconds, from ffmpeg's silence detector. */
function speechSegments(file) {
  const {stderr} = run('ffmpeg', ['-hide_banner', '-i', file, '-af', 'silencedetect=n=-40dB:d=0.18', '-f', 'null', '-'])
  const total = seconds(file)
  const silences = []
  let start = null
  for (const line of stderr.split('\n')) {
    const opened = line.match(/silence_start: ([\d.]+)/)
    const closed = line.match(/silence_end: ([\d.]+)/)
    if (opened) start = Number(opened[1])
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
  return segments.filter(([a, b]) => b - a > 0.05).map(([a, b]) => [Number(a.toFixed(3)), Number(b.toFixed(3))])
}

mkdirSync(join(HERE, 'public', 'vo'), {recursive: true})
const timing = scenes.map((scene, index) => {
  const out = join(HERE, 'public', 'vo', `n${index}.mp3`)
  run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', join(source, `n${index}.wav`),
    '-af',
    [
      'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05',
      'areverse',
      'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1',
      'areverse',
      'silenceremove=stop_periods=-1:stop_duration=0.6:stop_threshold=-45dB:stop_silence=0.45',
      'loudnorm=I=-16:TP=-1.5:LRA=11',
      'aresample=48000',
    ].join(','),
    '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '192k', out,
  ])
  return {name: scene.name, narration: scene.narration, lead: scene.lead, tail: scene.tail, seconds: Number(seconds(out).toFixed(3)), segments: speechSegments(out)}
})

writeFileSync(join(HERE, 'src', 'timing.json'), `${JSON.stringify(timing, null, 2)}\n`)
for (const take of timing) console.log(`${take.name}: ${take.seconds}s, ${take.segments.length} phrases`)
