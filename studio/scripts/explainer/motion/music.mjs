/**
 * Synthesizes the film's music bed into public/music/bed.m4a: a quiet, warm pad that moves through
 * four chords with slow swells, lightly detuned across the stereo field, softened and given room.
 * Made from sine waves with ffmpeg, so there is nothing to license. It sits about 14 dB under the
 * voice (-30 LUFS against the narration's -16).
 *
 *   node music.mjs        (after prepare-audio.mjs, which sets the film's length)
 */

import {spawnSync} from 'node:child_process'
import {mkdirSync, readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const FPS = 30
const DISSOLVE = 24 // Mirrors src/film/Film.tsx.

const timing = JSON.parse(readFileSync(join(HERE, 'src', 'timing.json'), 'utf8'))
const frames = timing.reduce((sum, take, i) => sum + Math.round((take.lead + take.seconds + take.tail) * FPS) - (i < timing.length - 1 ? DISSOLVE : 0), 0)
const length = frames / FPS

/** Cmaj9, Am9, Fmaj9, Gsus: open voicings, lowest note first. */
const CHORDS = [
  [130.81, 196.0, 246.94, 293.66, 329.63],
  [110.0, 164.81, 196.0, 246.94, 261.63],
  [87.31, 130.81, 164.81, 196.0, 220.0],
  [98.0, 146.83, 220.0, 261.63, 293.66],
]
const STEP = 7
const HOLD = 10

const voices = []
for (let start = 0, i = 0; start < length; start += STEP, i += 1) {
  const chord = CHORDS[i % CHORDS.length]
  chord.forEach((f, n) => {
    const a = n === 0 ? 0.16 : 0.09
    const tone = (hz) => `${a}*(0.75*sin(2*PI*${hz}*t)+0.25*sin(4*PI*${hz}*t))`
    voices.push({start, expr: `${tone(f)}|${tone((f * 1.004).toFixed(3))}`})
  })
}

const graph = [
  ...voices.map(
    (v, i) => `aevalsrc='${v.expr}':s=48000:d=${HOLD},afade=t=in:d=3,afade=t=out:st=${HOLD - 4}:d=4,adelay=${Math.round(v.start * 1000)}:all=1[v${i}]`,
  ),
  `${voices.map((_, i) => `[v${i}]`).join('')}amix=inputs=${voices.length}:normalize=0,lowpass=f=1800,aecho=0.8:0.6:180|360:0.3|0.2,atrim=0:${length.toFixed(3)},afade=t=in:d=2.5,afade=t=out:st=${(length - 4).toFixed(3)}:d=4,loudnorm=I=-30:TP=-6:LRA=7,aresample=48000[out]`,
].join(';')

mkdirSync(join(HERE, 'public', 'music'), {recursive: true})
const out = join(HERE, 'public', 'music', 'bed.m4a')
const run = spawnSync(process.env.FFMPEG ?? 'ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-filter_complex', graph, '-map', '[out]', '-ac', '2', '-c:a', 'aac', '-b:a', '160k', out], {encoding: 'utf8'})
if (run.status !== 0) throw new Error(run.stderr)
console.log(`Music bed: ${length.toFixed(1)}s, ${voices.length} voices → ${out}`)
