/**
 * Builds the film's soundtrack into out/mix.wav (48 kHz stereo, -16 LUFS):
 *
 *   - each voice line placed so its first word lands on its time in script.json
 *   - the score (public/music/score.wav, from score.mjs) under it, pulled down while the voice
 *     speaks by sidechain compression
 *   - the sound effects in script.json's `sfx` list, plus a key tick for every typed character;
 *     all synthesized, so nothing is licensed and every render is identical
 *
 * Also writes out/vo.wav, the voice alone, which the checks measure onsets from.
 *
 *   node mix.mjs            (after prepare-audio.mjs and score.mjs)
 */

import {spawnSync} from 'node:child_process'
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, 'out')
const timing = JSON.parse(readFileSync(join(HERE, 'src', 'timing.json'), 'utf8'))
const RATE = 48000
const LENGTH = timing.seconds
const N = RATE * LENGTH

function ffmpeg(args) {
  const result = spawnSync(process.env.FFMPEG ?? 'ffmpeg', ['-hide_banner', '-y', ...args], {encoding: 'utf8'})
  if (result.status !== 0) throw new Error(`ffmpeg failed:\n${result.stderr}`)
  return result.stderr
}

// 1. Sound effects: soft, cartoon-clean, no voices.
let seed = 7
const noise = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 2147483648 - 1
}
const left = new Float32Array(N)
const right = new Float32Array(N)
function put(i, value, pan = 0.5) {
  if (i < 0 || i >= N) return
  left[i] += value * Math.cos((pan * Math.PI) / 2)
  right[i] += value * Math.sin((pan * Math.PI) / 2)
}
/** A tone whose pitch follows `f(t)` and loudness `env(t)`, for `dur` seconds. */
function tone(at, dur, f, env, gain, pan = 0.5, harmonics = [1]) {
  const from = Math.round(at * RATE)
  let phase = 0
  for (let n = 0; n < dur * RATE; n += 1) {
    const t = n / RATE
    phase += (2 * Math.PI * f(t)) / RATE
    let v = 0
    harmonics.forEach((amp, h) => {
      v += amp * Math.sin(phase * (h + 1))
    })
    put(from + n, v * env(t) * gain, pan)
  }
}
/** Filtered noise with an envelope; `bright` (0–1, or a function of time) moves it from a hush to a hiss. */
function hiss(at, dur, env, gain, bright = 0.5, pan = 0.5) {
  const from = Math.round(at * RATE)
  let lp = 0
  for (let n = 0; n < dur * RATE; n += 1) {
    const t = n / RATE
    const raw = noise()
    const k = typeof bright === 'function' ? bright(t) : bright
    lp += (0.05 + 0.5 * k) * (raw - lp)
    put(from + n, (k > 0.6 ? raw - lp : lp) * env(t) * gain, pan)
  }
}
const decay = (rate) => (t) => Math.min(1, t / 0.004) * Math.exp(-t * rate)

const SOUNDS = {
  /** A rubber ball landing: a short pitch-dropping thump with a small squeak. */
  bounce: ({at, pitch = 1}) => {
    tone(at, 0.25, (t) => (140 - 260 * t) * pitch, decay(18), 0.5)
    tone(at, 0.06, (t) => 900 * pitch - 3000 * t, decay(60), 0.06, 0.55)
  },
  /** A soft whoosh: a noise swell sweeping bright then dark. */
  whoosh: ({at}) => hiss(at, 0.5, (t) => Math.sin(Math.PI * Math.min(1, t / 0.5)) ** 2, 0.16, (t) => 0.2 + 0.6 * Math.sin((Math.PI * t) / 0.5), 0.3 + Math.abs(noise()) * 0.4),
  /** A light card thud. */
  thud: ({at}) => {
    tone(at, 0.15, (t) => 95 - 120 * t, decay(28), 0.35)
    hiss(at, 0.05, decay(80), 0.08, 0.3)
  },
  /** The comic bonk: a hollow knock with a wobbling pitch. */
  bonk: ({at}) => tone(at, 0.4, (t) => 520 * (1 - 0.35 * Math.min(1, t / 0.15)) * (1 + 0.03 * Math.sin(2 * Math.PI * 22 * t)), decay(9), 0.3, 0.5, [1, 0.35, 0.12]),
  /** A glassy chime: three bell partials, a rising third. */
  chime: ({at}) => [1318.5, 1661.2, 1975.5].forEach((f, k) => tone(at + k * 0.05, 1.6, () => f, decay(2.4), 0.07, 0.4 + k * 0.1, [1, 0, 0.18])),
  /** A soft UI tap. */
  tap: ({at}) => tone(at, 0.08, (t) => 1200 - 4000 * t, decay(70), 0.18),
  /** A rising shimmer: a quick ladder of bell tones going up. */
  shimmer: ({at}) => [74, 78, 81, 86, 90, 93, 98].forEach((m, k) => tone(at + k * 0.09, 0.9, () => 440 * 2 ** ((m - 69) / 12), decay(4), 0.035, 0.3 + k * 0.06)),
  /** A cartoon boing: a springy pitch wobble. */
  boing: ({at}) => tone(at, 0.6, (t) => 180 + 140 * t + 60 * Math.sin(2 * Math.PI * 14 * t) * Math.exp(-t * 3), decay(5), 0.22, 0.65, [1, 0.3]),
  /** A springy pop, as the pill springs in. */
  pop: ({at}) => {
    tone(at, 0.12, (t) => 600 + 2200 * t, decay(35), 0.2)
    hiss(at, 0.03, decay(120), 0.08, 0.9)
  },
  /** A gentle error blip: a soft falling two-note buzz. */
  blip: ({at}) => tone(at, 0.18, (t) => (t < 0.08 ? 330 : 247), (t) => Math.min(1, t / 0.005) * Math.exp(-t * 14), 0.12, 0.5, [1, 0, 0.3, 0, 0.12]),
  /** A deflating sigh: breathy noise losing its brightness, with a little pitch sag. */
  sigh: ({at}) => {
    hiss(at, 1.0, (t) => Math.sin(Math.PI * Math.min(1, t)) * (1 - t * 0.5), 0.12, (t) => 0.55 - 0.4 * t)
    tone(at, 0.9, (t) => 260 - 90 * t, (t) => 0.4 * Math.sin(Math.PI * Math.min(1, t / 0.9)), 0.05)
  },
  /** The success chime: a bright major arpeggio. */
  success: ({at}) => [1046.5, 1318.5, 1568.0, 2093.0].forEach((f, k) => tone(at + k * 0.07, 1.4, () => f, decay(2.6), 0.07, 0.35 + k * 0.1, [1, 0, 0.2])),
  /** A small cheer made of squeaky toys. */
  cheer: ({at}) => {
    for (let k = 0; k < 7; k += 1) {
      const start = at + k * 0.09 + Math.abs(noise()) * 0.05
      const base = 700 + Math.abs(noise()) * 500
      tone(start, 0.16, (t) => base + 900 * t - 1500 * t * t, decay(16), 0.06, 0.25 + Math.abs(noise()) * 0.5, [1, 0.4])
    }
  },
  /** A gentle oven ding. */
  ding: ({at}) => tone(at, 2.2, () => 1760, decay(1.6), 0.09, 0.55, [1, 0, 0.25, 0, 0.08]),
  /** One low, soft note under the logo line. */
  low: ({at}) => tone(at, 3.5, () => 73.4, (t) => Math.min(1, t / 0.6) * Math.exp(-t * 0.6), 0.3, 0.5, [1, 0.25]),
  /** A soft key tick, one per typed character. */
  key: ({at}) => {
    hiss(at, 0.025, decay(260), 0.12, 0.9, 0.45 + Math.abs(noise()) * 0.1)
    tone(at, 0.03, () => 1900, decay(300), 0.04)
  },
}

for (const cue of timing.sfx) SOUNDS[cue.kind](cue)
for (const {from, step, text} of Object.values(timing.typing)) {
  for (let i = 1; i <= text.length; i += 1) if (text[i - 1] !== ' ') SOUNDS.key({at: from + i * step - 0.004})
}

mkdirSync(OUT, {recursive: true})
const pcm = Buffer.alloc(N * 4)
for (let i = 0; i < N; i += 1) {
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), i * 4)
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), i * 4 + 2)
}
const header = Buffer.alloc(44)
header.write('RIFF', 0)
header.writeUInt32LE(36 + pcm.length, 4)
header.write('WAVEfmt ', 8)
header.writeUInt32LE(16, 16)
header.writeUInt16LE(1, 20)
header.writeUInt16LE(2, 22)
header.writeUInt32LE(RATE, 24)
header.writeUInt32LE(RATE * 4, 28)
header.writeUInt16LE(4, 32)
header.writeUInt16LE(16, 34)
header.write('data', 36)
header.writeUInt32LE(pcm.length, 40)
writeFileSync(join(OUT, 'sfx.wav'), Buffer.concat([header, pcm]))

// 2. The voice: each line delayed so its first word lands on its time.
const inputs = timing.lines.flatMap((line) => ['-i', join(HERE, 'public', 'vo', `${line.id}.flac`)])
const placed = timing.lines.map((line, i) => {
  const delay = Math.round((line.at - line.lead) * 1000)
  return `[${i}]aresample=${RATE},adelay=${delay}|${delay},pan=stereo|c0=c0|c1=c0[v${i}]`
})
const voice = `${placed.join(';')};${timing.lines.map((_, i) => `[v${i}]`).join('')}amix=inputs=${timing.lines.length}:normalize=0,apad=whole_dur=${LENGTH},atrim=0:${LENGTH}`
ffmpeg([...inputs, '-filter_complex', `${voice}[vo]`, '-map', '[vo]', '-c:a', 'pcm_s16le', join(OUT, 'vo.wav')])

// 3. The mix: the score under the voice, pulled down further while anyone speaks, then the effects.
const MUSIC = join(HERE, 'public', 'music', 'score.wav')
const MUSIC_GAIN = -11
const graph = [
  `[0]asplit=2[vo][key]`,
  `[1]aresample=${RATE},atrim=0:${LENGTH},volume=${MUSIC_GAIN}dB[music]`,
  `[music][key]sidechaincompress=threshold=0.04:ratio=3:attack=40:release=450:knee=4[ducked]`,
  `[ducked][vo][2]amix=inputs=3:normalize=0,atrim=0:${LENGTH}[mix]`,
].join(';')
ffmpeg(['-i', join(OUT, 'vo.wav'), '-i', MUSIC, '-i', join(OUT, 'sfx.wav'), '-filter_complex', graph, '-map', '[mix]', '-c:a', 'pcm_s16le', join(OUT, 'mix-raw.wav')])

// 4. Level the whole film to -16 LUFS with a measured gain and a true-peak ceiling.
const measured = ffmpeg(['-i', join(OUT, 'mix-raw.wav'), '-af', 'ebur128=peak=true', '-f', 'null', '-'])
const loudness = Number(measured.match(/I:\s+(-?[\d.]+) LUFS/g).at(-1).match(/-?[\d.]+/)[0])
ffmpeg(['-i', join(OUT, 'mix-raw.wav'), '-af', `volume=${(-16 - loudness).toFixed(2)}dB,alimiter=limit=0.89:level=false`, '-ar', String(RATE), '-c:a', 'pcm_s16le', join(OUT, 'mix.wav')])
console.log(`Mixed ${LENGTH}s: ${timing.lines.length} lines, the score at ${MUSIC_GAIN} dB and ducked, ${timing.sfx.length} effects, levelled from ${loudness} LUFS to -16 → out/mix.wav`)
