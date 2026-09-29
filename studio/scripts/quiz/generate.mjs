/**
 * Generates the end-of-lesson quizzes: 3 questions × 4 options per lesson, each option with
 * feedback on why it is right or wrong. Offline tooling — never in the request path.
 *
 * Grounding: the lesson's transcript chunks when its `video` document exists, plus its title, key
 * points and notes. The model is told to use nothing else. Output is schema-checked and cached in
 * quizzes.json, which is committed — a re-run only generates what is missing. Options are kept in
 * the model's order here; import.mjs shuffles them.
 *
 *   npx sanity exec scripts/quiz/generate.mjs --with-user-token                 # fill what is missing
 *   npx sanity exec scripts/quiz/generate.mjs --with-user-token -- --limit=2    # smoke run
 *   npx sanity exec scripts/quiz/generate.mjs --with-user-token -- --force      # regenerate all
 *
 * Provider, from ../.env.local (or the environment), first match wins:
 *   GROQ_API_KEY    free tier, open-weight models (gpt-oss-120b, Qwen3 27B, gpt-oss-20b), one worker each.
 *                   Groq caps tokens per model per day, so a capped model hands over to the next;
 *                   when all are capped the run stops cleanly and the next run resumes from the cache.
 *   OPENAI_API_KEY  gpt-5-mini.
 *   QUIZ_BASE_URL + QUIZ_API_KEY   any OpenAI-compatible endpoint (e.g. Ollama at
 *                   http://localhost:11434/v1). QUIZ_MODEL overrides the model(s), comma-separated.
 */

import {existsSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {getCliClient} from 'sanity/cli'

const HERE = dirname(fileURLToPath(import.meta.url))
const CACHE_PATH = join(HERE, 'quizzes.json')
const ENV_PATH = join(HERE, '../../../.env.local')

const QUESTIONS = 3
const OPTIONS = 4

const args = process.argv.slice(2)
const force = args.includes('--force')
const limit = Number(args.find((arg) => arg.startsWith('--limit='))?.split('=')[1] ?? Infinity)

function readEnv(name) {
  if (process.env[name]) return process.env[name]
  if (!existsSync(ENV_PATH)) return undefined
  const line = readFileSync(ENV_PATH, 'utf8').split('\n').find((row) => row.startsWith(`${name}=`))
  return line?.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') || undefined
}

function resolveProvider() {
  const override = readEnv('QUIZ_MODEL')?.split(',').map((name) => name.trim()).filter(Boolean)
  if (readEnv('QUIZ_BASE_URL')) {
    return {name: 'custom', baseUrl: readEnv('QUIZ_BASE_URL'), apiKey: readEnv('QUIZ_API_KEY') ?? 'none', models: override ?? ['llama3.1'], transcriptChars: 12_000, concurrency: 1}
  }
  if (readEnv('GROQ_API_KEY')) {
    // Free-tier limits are per model and per minute/day, so: one request at a time, a tighter
    // transcript budget, and a fallback chain.
    return {name: 'groq', baseUrl: 'https://api.groq.com/openai/v1', apiKey: readEnv('GROQ_API_KEY'), models: override ?? ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'], transcriptChars: 10_000, concurrency: 1}
  }
  if (readEnv('OPENAI_API_KEY')) {
    return {name: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: readEnv('OPENAI_API_KEY'), models: override ?? ['gpt-5-mini'], transcriptChars: 24_000, concurrency: 4}
  }
  throw new Error('No quiz provider: set GROQ_API_KEY, OPENAI_API_KEY, or QUIZ_BASE_URL in ../.env.local')
}

const provider = resolveProvider()
/** Models still usable this run; a model that reports its daily cap is dropped. */
const models = [...provider.models]
/** Models that rejected strict json_schema: they get JSON mode with the schema in the prompt. */
const jsonModeOnly = new Set()

const client = getCliClient({apiVersion: '2025-01-01'})
const lessons = await client.fetch(`*[_type == "lesson" && defined(slug.current)] | order(_id asc){
  _id, title, keyPoints, "notes": pt::text(notes),
  "course": *[_type == "course" && references(^._id)][0].title,
  "transcript": *[_type == "video" && url == ^.videoUrl][0].chunks[].text
}`)

const cache = existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, 'utf8')) : {}
const todo = lessons.filter((lesson) => force || !cache[lesson._id]).slice(0, limit)
console.log(`${lessons.length} lessons · ${Object.keys(cache).length} cached · generating ${todo.length} via ${provider.name} (${models.join(' → ')})`)

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['questions'],
  properties: {
    questions: {
      type: 'array',
      minItems: QUESTIONS,
      maxItems: QUESTIONS,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['prompt', 'options'],
        properties: {
          prompt: {type: 'string'},
          options: {
            type: 'array',
            minItems: OPTIONS,
            maxItems: OPTIONS,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['text', 'isCorrect', 'feedback'],
              properties: {text: {type: 'string'}, isCorrect: {type: 'boolean'}, feedback: {type: 'string'}},
            },
          },
        },
      },
    },
  },
}

const SYSTEM = `You write short multiple-choice quizzes that check a learner understood one lesson video.
Rules:
- Use ONLY facts stated in the provided transcript, notes and key points. Never add outside facts.
- Exactly ${QUESTIONS} questions, each with exactly ${OPTIONS} options and exactly ONE correct option.
- Test understanding of the lesson's main ideas, not trivia like names, dates or exact numbers.
- Wrong options must be plausible misconceptions, not jokes. No "all of the above" / "none of the above".
- Every option gets feedback of 1-2 sentences: for the correct one, why it is right; for each wrong one, why it is wrong.
- Plain text only: no markdown, no numbering, no quotes around answers. Keep prompts under 25 words and options under 15 words.`

function userMessage(lesson) {
  const transcript = (lesson.transcript ?? []).join(' ').slice(0, provider.transcriptChars)
  return [
    `Course: ${lesson.course ?? 'unknown'}`,
    `Lesson: ${lesson.title}`,
    lesson.keyPoints?.length ? `Key points:\n- ${lesson.keyPoints.join('\n- ')}` : '',
    lesson.notes ? `Notes:\n${lesson.notes}` : '',
    transcript ? `Transcript:\n${transcript}` : 'Transcript: (not available — use the notes and key points only)',
  ]
    .filter(Boolean)
    .join('\n\n')
}

function validate(quiz) {
  if (!Array.isArray(quiz?.questions) || quiz.questions.length !== QUESTIONS) return 'wrong question count'
  for (const question of quiz.questions) {
    if (!question.prompt?.trim()) return 'empty prompt'
    if (question.options?.length !== OPTIONS) return 'wrong option count'
    if (question.options.filter((option) => option.isCorrect).length !== 1) return 'not exactly one correct option'
    if (question.options.some((option) => !option.text?.trim() || !option.feedback?.trim())) return 'empty option or feedback'
  }
  return null
}


const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function requestBody(model, lesson) {
  const jsonMode = jsonModeOnly.has(model)
  return {
    model,
    // Reasoning models (gpt-5, gpt-oss) accept an effort; others reject the field.
    ...(/gpt-5|gpt-oss/.test(model) ? {reasoning_effort: 'low'} : {}),
    // Qwen3 reasons in the reply body unless told otherwise, which breaks the JSON.
    ...(/qwen3/.test(model) && provider.name === 'groq' ? {reasoning_format: 'hidden'} : {}),
    messages: [
      {role: 'system', content: jsonMode ? `${SYSTEM}\nReply with JSON only, matching this JSON Schema:\n${JSON.stringify(schema)}` : SYSTEM},
      {role: 'user', content: userMessage(lesson)},
    ],
    response_format: jsonMode
      ? {type: 'json_object'}
      : {type: 'json_schema', json_schema: {name: 'lesson_quiz', strict: true, schema}},
  }
}

class ModelCapped extends Error {}

async function generate(lesson, model) {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {'content-type': 'application/json', authorization: `Bearer ${provider.apiKey}`},
      body: JSON.stringify(requestBody(model, lesson)),
    })
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300)
      if (response.status === 429) {
        if (/per day|TPD|RPD|daily|credit_balance|quota/i.test(detail)) throw new ModelCapped(`${model} hit its daily cap`)
        const wait = Math.min(90, Number(response.headers.get('retry-after')) || 10 * attempt)
        console.warn(`  rate limited on ${model}, waiting ${wait}s`)
        await sleep(wait * 1000)
        continue
      }
      // Groq checks the schema server-side; a reply that misses it is a bad draw, not a bad request.
      if (response.status === 400 && /json_validate_failed/i.test(detail)) {
        console.warn(`  retry ${lesson._id}: ${model} reply missed the schema`)
        continue
      }
      if (response.status === 400 && /response_format|json_schema|structured/i.test(detail) && !jsonModeOnly.has(model)) {
        console.warn(`  ${model} has no strict schema support — using JSON mode`)
        jsonModeOnly.add(model)
        continue
      }
      // A model the account cannot use retires its worker instead of failing every lesson.
      if (response.status === 404 && /model_not_found|does not exist/i.test(detail)) {
        throw new ModelCapped(`${model} is not available to this account`)
      }
      if (response.status >= 500) {
        await sleep(3000 * attempt)
        continue
      }
      throw new Error(`${provider.name} ${response.status}: ${detail}`)
    }
    const data = await response.json()
    let quiz
    try {
      quiz = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
    } catch {
      console.warn(`  retry ${lesson._id}: reply was not JSON`)
      continue
    }
    const problem = validate(quiz)
    if (problem) {
      console.warn(`  retry ${lesson._id}: ${problem}`)
      continue
    }
    return {
      questions: quiz.questions.map((question) => ({
        prompt: question.prompt.trim(),
        options: question.options.map((option) => ({
          text: option.text.trim(),
          isCorrect: option.isCorrect,
          feedback: option.feedback.trim(),
        })),
      })),
      source: lesson.transcript?.length ? 'transcript+notes' : 'notes',
      model: `${provider.name}:${model}`,
      usage: data.usage ? {input: data.usage.prompt_tokens, output: data.usage.completion_tokens} : null,
      generatedAt: new Date().toISOString(),
    }
  }
  throw new Error(`gave up on ${lesson._id} after 6 attempts`)
}

let done = 0
let failed = 0
const queue = [...todo]
/**
 * Rate limits are per model, so on Groq each model gets its own worker pulling from the shared
 * queue; elsewhere the first model runs `concurrency` workers. A worker whose model reports its
 * daily cap puts the lesson back and retires.
 */
async function worker(model) {
  while (queue.length) {
    const lesson = queue.shift()
    try {
      cache[lesson._id] = await generate(lesson, model)
      done += 1
      // Written after every lesson, so an interrupted run keeps what it paid for.
      writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`)
      console.log(`  ✓ ${done}/${todo.length} ${lesson.title}`)
    } catch (error) {
      if (error instanceof ModelCapped) {
        queue.unshift(lesson)
        console.warn(`  ${error.message} — worker retiring`)
        return
      }
      failed += 1
      console.warn(`  ✗ ${lesson._id}: ${error.message}`)
    }
  }
}
const workers =
  provider.name === 'groq' ? models : Array.from({length: provider.concurrency}, () => models[0])
await Promise.all(workers.map((model) => worker(model)))
if (queue.length) console.warn(`stopped with ${queue.length} lessons left: every model is capped. Run again later — cached lessons are kept.`)

const usage = Object.values(cache).reduce(
  (sum, entry) => ({input: sum.input + (entry.usage?.input ?? 0), output: sum.output + (entry.usage?.output ?? 0)}),
  {input: 0, output: 0},
)
console.log(`done: ${done} generated · ${failed} failed · cache holds ${Object.keys(cache).length} · tokens in/out across cache: ${usage.input}/${usage.output}`)
