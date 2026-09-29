/**
 * Writes quizzes.json into the dataset as `quiz` documents — one per lesson, id `quiz.<lesson>`,
 * with deterministic `_key`s so a re-import is a no-op diff. Lesson documents are never touched.
 *
 * Options are shuffled here, because models put the right answer first far more often than chance.
 * The shuffle is seeded from SHA-256 of the lesson and question, so it is well spread yet stable.
 *
 *   npx sanity exec scripts/quiz/import.mjs --with-user-token
 */

import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'

const HERE = dirname(fileURLToPath(import.meta.url))
const cache = JSON.parse(readFileSync(join(HERE, 'quizzes.json'), 'utf8'))
const client = getCliClient({apiVersion: '2025-01-01'})

const lessonIds = new Set(await client.fetch(`*[_type == "lesson"]._id`))
const slug = (id) => id.replace(/^lesson\./, '').replace(/[^a-zA-Z0-9_-]/g, '_')

/** Fisher–Yates driven by the bytes of sha256(seed). */
function shuffle(items, seed) {
  const bytes = createHash('sha256').update(seed).digest()
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = bytes.readUInt32BE((i * 4) % (bytes.length - 3)) % (i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const docs = Object.entries(cache)
  .filter(([lessonId]) => lessonIds.has(lessonId))
  .map(([lessonId, quiz]) => ({
    _id: `quiz.${slug(lessonId)}`,
    _type: 'quiz',
    lesson: {_type: 'reference', _ref: lessonId},
    questions: quiz.questions.map((question, q) => ({
      _key: `q${q}`,
      _type: 'question',
      prompt: question.prompt,
      options: shuffle(question.options, `${lessonId}:${q}`).map((option, o) => ({
        _key: `q${q}o${o}`,
        _type: 'option',
        text: option.text,
        isCorrect: option.isCorrect,
        feedback: option.feedback,
      })),
    })),
  }))

// Where the right answer landed, as a sanity check on the shuffle.
const positions = [0, 0, 0, 0, 0]
for (const doc of docs) for (const question of doc.questions) positions[question.options.findIndex((option) => option.isCorrect)] += 1
console.log(`right-answer position counts (A,B,C,D): ${positions.slice(0, 4).join(', ')}`)
if (process.argv.includes('--dry-run')) process.exit(0)

const skipped = Object.keys(cache).length - docs.length
const transaction = client.transaction()
for (const doc of docs) transaction.createOrReplace(doc)
const result = await transaction.commit()
console.log(`imported ${result.results.length} quizzes${skipped ? ` · skipped ${skipped} for missing lessons` : ''}`)
