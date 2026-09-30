/**
 * Composes the film's score in code, to the brief: a playful orchestral cue, 120 BPM, 4/4, D major,
 * exactly 90 seconds, instrumental. Every instrument is modelled sample by sample, so there is
 * nothing to license and every render is identical:
 *
 *   pizzicato strings (plucked-string model), glockenspiel and marimba (struck bars: their own
 *   inharmonic partials), flute and clarinet (breathy and reedy tones with vibrato), a bowed cello
 *   bed and a small bowed string section, and brushed percussion (shaped noise).
 *
 * The hook is a two-bar pizzicato and glockenspiel figure that returns, varied, in every section.
 * The mix is dry (a small room, no wash) so the voice sits on top. Writes public/music/score.wav.
 *
 *   node score.mjs
 */

import {mkdirSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const RATE = 48000
const LENGTH = 90
const BEAT = 0.5 // 120 BPM
const BAR = BEAT * 4
const N = RATE * LENGTH

const left = new Float32Array(N)
const right = new Float32Array(N)

let seed = 11
const noise = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 2147483648 - 1
}
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12)
const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x))

function put(i, value, pan) {
  if (i < 0 || i >= N) return
  left[i] += value * Math.cos((pan * Math.PI) / 2)
  right[i] += value * Math.sin((pan * Math.PI) / 2)
}

/* ------------------------------------------------------------------------------------------------ */
/* Instruments. `pan` runs 0 (left) to 1 (right).                                                    */

/** Pizzicato: a plucked string that dies quickly, through a soft body filter. */
function pizz(midi, at, gain, pan = 0.5) {
  const period = Math.max(2, Math.round(RATE / hz(midi)))
  const line = new Float32Array(period).map(() => noise())
  const from = Math.round(at * RATE)
  let idx = 0
  let body = 0
  for (let n = 0; n < RATE * 0.9; n += 1) {
    const next = (idx + 1) % period
    const out = line[idx]
    line[idx] = 0.492 * (line[idx] + line[next])
    idx = next
    body += 0.35 * (out - body)
    put(from + n, body * gain * Math.min(1, n / 40), pan)
  }
}

/** A struck bar: inharmonic partials, each with its own decay. */
function bar(midi, at, gain, pan, partials) {
  const f = hz(midi)
  const from = Math.round(at * RATE)
  const length = Math.round(RATE * Math.max(...partials.map((p) => p.decay)) * 4)
  for (let n = 0; n < length; n += 1) {
    const t = n / RATE
    let v = 0
    for (const p of partials) v += p.amp * Math.sin(2 * Math.PI * f * p.ratio * t) * Math.exp(-t / p.decay)
    put(from + n, v * gain * Math.min(1, n / 24), pan)
  }
}
const glock = (midi, at, gain, pan = 0.6) =>
  bar(midi, at, gain, pan, [
    {ratio: 1, amp: 1, decay: 0.9},
    {ratio: 2.76, amp: 0.32, decay: 0.35},
    {ratio: 5.4, amp: 0.16, decay: 0.14},
    {ratio: 8.93, amp: 0.07, decay: 0.06},
  ])
const marimba = (midi, at, gain, pan = 0.4) =>
  bar(midi, at, gain, pan, [
    {ratio: 1, amp: 1, decay: 0.32},
    {ratio: 3.93, amp: 0.22, decay: 0.07},
    {ratio: 9.2, amp: 0.05, decay: 0.025},
  ])

/**
 * A wind or bowed voice: harmonics with an envelope and vibrato. `glideTo` bends the pitch over
 * the note (the clarinet's comic slide).
 */
function voice(midi, at, dur, gain, pan, {harmonics, attack, release, vibrato = 0.004, breath = 0, glideTo, detune = 0}) {
  const from = Math.round(at * RATE)
  const total = Math.round((dur + release) * RATE)
  let phase = 0
  let lp = 0
  for (let n = 0; n < total; n += 1) {
    const t = n / RATE
    const env = t < attack ? smooth(t / attack) : t < dur ? 1 : Math.max(0, 1 - (t - dur) / release)
    const bend = glideTo === undefined ? midi : midi + (glideTo - midi) * smooth(Math.min(1, t / dur))
    const vib = 1 + vibrato * Math.sin(2 * Math.PI * 5.3 * t) * smooth((t - 0.15) / 0.3)
    phase += (2 * Math.PI * hz(bend + detune) * vib) / RATE
    let v = 0
    harmonics.forEach((amp, h) => {
      v += amp * Math.sin(phase * (h + 1))
    })
    if (breath) {
      lp += 0.2 * (noise() - lp)
      v += lp * breath
    }
    put(from + n, v * env * gain, pan)
  }
}
const flute = (midi, at, dur, gain, pan = 0.35) => voice(midi, at, dur, gain, pan, {harmonics: [1, 0.22, 0.07], attack: 0.05, release: 0.1, vibrato: 0.005, breath: 0.08})
const clarinet = (midi, at, dur, gain, pan = 0.65, glideTo) =>
  voice(midi, at, dur, gain, pan, {harmonics: [1, 0.02, 0.38, 0.02, 0.16, 0.01, 0.07], attack: 0.04, release: 0.12, vibrato: 0.006, glideTo})
const cello = (midi, at, dur, gain, pan = 0.45) =>
  voice(midi, at, dur, gain, pan, {harmonics: [1, 0.5, 0.3, 0.2, 0.13, 0.09, 0.06, 0.04], attack: 0.3, release: 0.5, vibrato: 0.004, breath: 0.015})
/** A small bowed section: three slightly detuned players. */
function strings(midi, at, dur, gain, pan = 0.5) {
  for (const [detune, spread] of [[-0.06, -0.12], [0, 0], [0.07, 0.12]]) {
    voice(midi, at, dur, gain / 3, Math.min(1, Math.max(0, pan + spread)), {harmonics: [1, 0.45, 0.25, 0.15, 0.08, 0.05], attack: 0.08, release: 0.25, vibrato: 0.005, detune})
  }
}

/** Brushes: a soft swish on the backbeat and a light tick on the offbeats. */
function swish(at, gain) {
  const from = Math.round(at * RATE)
  let lp = 0
  let hp = 0
  for (let n = 0; n < RATE * 0.3; n += 1) {
    const t = n / RATE
    const raw = noise()
    lp += 0.5 * (raw - lp)
    hp = raw - lp
    const env = smooth(t / 0.03) * Math.exp(-t * 11)
    put(from + n, hp * env * gain, 0.55)
  }
}
function tick(at, gain) {
  const from = Math.round(at * RATE)
  let lp = 0
  for (let n = 0; n < RATE * 0.04; n += 1) {
    const raw = noise()
    lp += 0.6 * (raw - lp)
    put(from + n, (raw - lp) * Math.exp(-n / (RATE * 0.006)) * gain, 0.62)
  }
}

/* ------------------------------------------------------------------------------------------------ */
/* The score.                                                                                        */

/** One chord per bar, around and around: D, G, Bm, A. */
const CHORDS = [
  {root: 38, tones: [62, 66, 69]},
  {root: 43, tones: [62, 67, 71]},
  {root: 47, tones: [62, 66, 71]},
  {root: 45, tones: [61, 64, 69]},
]
const chordAt = (b) => CHORDS[b % 4]
const beat = (b, n = 0) => b * BAR + n * BEAT

/** The hook: two bars, over D then G. [beat, midi, beats long]. */
const HOOK = [
  [0, 81, 0.5], [0.75, 78, 0.25], [1, 81, 0.5], [1.5, 83, 0.5], [2, 81, 0.5], [2.5, 78, 0.5], [3, 76, 0.5], [3.5, 78, 0.5],
  [4, 79, 0.5], [4.75, 76, 0.25], [5, 79, 0.5], [5.5, 81, 0.5], [6, 78, 0.75], [7, 74, 1],
]
/** Its answer, over Bm then A. */
const ANSWER = [
  [0, 78, 0.5], [0.5, 74, 0.5], [1, 78, 0.5], [1.5, 83, 0.5], [2, 81, 1], [3, 78, 0.5], [3.5, 76, 0.5],
  [4, 76, 0.5], [4.5, 73, 0.5], [5, 76, 0.5], [5.5, 81, 0.5], [6, 79, 0.5], [6.5, 78, 0.5], [7, 76, 1],
]

/** Plays a phrase from bar `b`: `play(midi, time, seconds)` per note, optionally transposed or re-ended. */
function phrase(notes, b, play, {shift = 0, lastTo} = {}) {
  notes.forEach(([at, midi, len], i) => {
    const pitch = (i === notes.length - 1 && lastTo !== undefined ? lastTo : midi) + shift
    play(pitch, beat(b) + at * BEAT, len * BEAT)
  })
}

const glockHook = (gain) => (midi, at) => glock(midi, at, gain)
const pizzHook = (gain) => (midi, at) => pizz(midi, at, gain, 0.62)

// 0–12 s (bars 0–5): sparse and curious. Pizzicato alone, then the hook on glockenspiel; chaos at 6 s.
for (let b = 0; b < 6; b += 1) {
  const c = chordAt(b)
  pizz(c.root + 12, beat(b), 0.5, 0.45)
  if (b >= 1) pizz(c.tones[0], beat(b, 2.5), 0.28, 0.6)
}
phrase(HOOK, 2, pizzHook(0.34))
phrase(HOOK, 2, glockHook(0.12), {shift: 12})
// The woodwind flutter and the playful chaos at 6 s.
;[86, 88, 86, 88, 86, 88, 90, 93].forEach((m, i) => flute(m - 12, 6 + i * 0.07, 0.06, 0.08))
;[74, 76, 78, 79, 81].forEach((m, i) => clarinet(m - 12, 6.05 + i * 0.09, 0.08, 0.06))
for (let i = 0; i < 14; i += 1) {
  const at = 6.6 + i * 0.36 + noise() * 0.08
  const pick = [74, 76, 78, 81, 83, 86][Math.floor(Math.abs(noise()) * 6)]
  if (i % 2) pizz(pick, at, 0.24, 0.3 + Math.abs(noise()) * 0.4)
  else glock(pick + 12, at, 0.05, 0.3 + Math.abs(noise()) * 0.4)
}
phrase(ANSWER, 4, glockHook(0.1), {shift: 12})

// 12–26 s (bars 6–12): settles into order. Cello bed, a steady pizzicato ostinato, the hook returns.
for (let b = 6; b < 13; b += 1) {
  const c = chordAt(b)
  cello(c.root + 12, beat(b), BAR - 0.1, 0.16)
  for (let e = 0; e < 8; e += 1) pizz(e % 2 ? c.tones[(e >> 1) % 3] : c.root + 12 + (e === 4 ? 7 : 0), beat(b, e / 2), e % 2 ? 0.2 : 0.34, e % 2 ? 0.62 : 0.42)
}
phrase(HOOK, 8, glockHook(0.13), {shift: 12})
phrase(ANSWER, 10, glockHook(0.11), {shift: 12, lastTo: 74})

// 26–52 s (bars 13–25): light and bouncy. Marimba joins, brushes, gentle momentum, room for the voice.
for (let b = 13; b < 26; b += 1) {
  const c = chordAt(b)
  cello(c.root + 12, beat(b), BAR - 0.1, 0.12)
  pizz(c.root + 12, beat(b), 0.32, 0.42)
  pizz(c.root + 19, beat(b, 2), 0.24, 0.42)
  const arp = [c.tones[0], c.tones[1], c.tones[2], c.tones[1] + 12, c.tones[2], c.tones[1], c.tones[0] + 12, c.tones[2]]
  arp.forEach((m, e) => marimba(m, beat(b, e / 2), e % 2 ? 0.1 : 0.14))
  swish(beat(b, 1), 0.05)
  swish(beat(b, 3), 0.05)
  for (let e = 1; e < 8; e += 2) tick(beat(b, e / 2), 0.03)
}
phrase(HOOK, 16, glockHook(0.08), {shift: 12})
phrase(HOOK, 20, pizzHook(0.2), {shift: 0, lastTo: 76})
phrase(ANSWER, 22, glockHook(0.07), {shift: 12})

// 52–65 s (bars 26–31): a comic dip at 55 s (one descending clarinet slide), a bright lift at 60 s.
for (let b = 26; b < 32; b += 1) {
  const c = chordAt(b)
  const thin = b === 27 || b === 28 // 54–58 s: the floor drops away for the joke
  pizz(c.root + 12, beat(b), thin ? 0.26 : 0.32, 0.42)
  if (!thin) {
    cello(c.root + 12, beat(b), BAR - 0.1, 0.12)
    const arp = [c.tones[0], c.tones[1], c.tones[2], c.tones[1] + 12]
    arp.forEach((m, e) => marimba(m, beat(b, e), 0.11))
    swish(beat(b, 1), 0.05)
    swish(beat(b, 3), 0.05)
  }
}
clarinet(69, 55.0, 1.1, 0.14, 0.6, 50)
// The lift: a rising flute and glockenspiel run into the downbeat at 60 s, then a bright chord.
;[74, 76, 78, 79, 81, 83, 85, 86].forEach((m, i) => {
  flute(m, 59.0 + i * 0.12, 0.1, 0.07)
  glock(m + 12, 59.0 + i * 0.12, 0.05)
})
strings(74, 60, 1.6, 0.1)
strings(78, 60, 1.6, 0.08)
strings(81, 60, 1.6, 0.08)
glock(98, 60, 0.08)
phrase(HOOK, 30, glockHook(0.1), {shift: 12})

// 64–78 s (bars 32–38): the warmest and fullest. The whole ensemble; the hook on strings.
for (let b = 32; b < 39; b += 1) {
  const c = chordAt(b)
  cello(c.root, beat(b), BAR - 0.1, 0.12)
  cello(c.root + 12, beat(b), BAR - 0.1, 0.12)
  c.tones.forEach((m) => strings(m - 12, beat(b), BAR - 0.05, 0.045, 0.35))
  for (let e = 0; e < 8; e += 1) pizz(e % 2 ? c.tones[(e >> 1) % 3] : c.root + 12, beat(b, e / 2), e % 2 ? 0.18 : 0.3, e % 2 ? 0.66 : 0.4)
  const arp = [c.tones[0] + 12, c.tones[1], c.tones[2], c.tones[1] + 12]
  arp.forEach((m, e) => marimba(m, beat(b, e + 0.5), 0.09, 0.3))
  swish(beat(b, 1), 0.06)
  swish(beat(b, 3), 0.06)
  for (let e = 1; e < 8; e += 2) tick(beat(b, e / 2), 0.035)
}
const stringHook = (midi, at, len) => strings(midi, at, len * 0.9, 0.12, 0.55)
phrase(HOOK, 32, stringHook)
phrase(HOOK, 32, glockHook(0.06), {shift: 12})
phrase(ANSWER, 34, stringHook)
phrase(HOOK, 36, stringHook, {lastTo: 81})
phrase(HOOK, 36, glockHook(0.06), {shift: 12, lastTo: 81})
flute(86, beat(34), BAR * 2 - 0.1, 0.05)
flute(85, beat(36), BAR * 2 - 0.1, 0.05)

// 78 s: everything drops to one sustained, soft note.
strings(81, 78, 6, 0.07, 0.5)
flute(81, 78.2, 5.6, 0.03, 0.45)

// 84 s: resolve on a warm, bright D major chord, a glockenspiel sparkle, ring out to 90 s.
for (const m of [38, 50, 57, 62, 66, 69, 74]) (m < 52 ? cello : strings)(m, 84, 4.4, m < 52 ? 0.14 : 0.06)
;[86, 90, 93, 98, 102].forEach((m, i) => glock(m, 84.05 + i * 0.07, 0.09 - i * 0.01))
pizz(50, 84, 0.3, 0.45)
marimba(62, 84, 0.12)
marimba(66, 84.02, 0.1)

/* ------------------------------------------------------------------------------------------------ */
/* A small room (early reflections only), the fade at the very end, normalise, write.               */

const taps = [
  [0.011, 0.22, 0.017, 0.2],
  [0.019, 0.16, 0.023, 0.15],
  [0.029, 0.11, 0.033, 0.1],
  [0.041, 0.07, 0.047, 0.06],
]
const dryL = left.slice()
const dryR = right.slice()
for (const [dl, gl, dr, gr] of taps) {
  const a = Math.round(dl * RATE)
  const b = Math.round(dr * RATE)
  for (let i = N - 1; i >= 0; i -= 1) {
    if (i >= a) left[i] += dryR[i - a] * gl
    if (i >= b) right[i] += dryL[i - b] * gr
  }
}
let peak = 0
for (let i = 0; i < N; i += 1) {
  const t = i / RATE
  const tail = t > LENGTH - 1.5 ? Math.max(0, (LENGTH - t) / 1.5) : 1
  left[i] *= tail
  right[i] *= tail
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]))
}
const scale = 0.89 / peak
const data = Buffer.alloc(N * 4)
for (let i = 0; i < N; i += 1) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i] * scale)) * 32767), i * 4)
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i] * scale)) * 32767), i * 4 + 2)
}
const header = Buffer.alloc(44)
header.write('RIFF', 0)
header.writeUInt32LE(36 + data.length, 4)
header.write('WAVEfmt ', 8)
header.writeUInt32LE(16, 16)
header.writeUInt16LE(1, 20)
header.writeUInt16LE(2, 22)
header.writeUInt32LE(RATE, 24)
header.writeUInt32LE(RATE * 4, 28)
header.writeUInt16LE(4, 32)
header.writeUInt16LE(16, 34)
header.write('data', 36)
header.writeUInt32LE(data.length, 40)
mkdirSync(join(HERE, 'public', 'music'), {recursive: true})
writeFileSync(join(HERE, 'public', 'music', 'score.wav'), Buffer.concat([header, data]))
console.log(`Composed ${LENGTH}s at ${60 / BEAT} BPM in D major → public/music/score.wav`)
