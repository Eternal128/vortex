/**
 * Captures the real product for the launch film: every screen the film shows, from the live site,
 * at 2x pixel density (3x for the phone), into public/captures/.
 *
 *   PLAYWRIGHT=<path to playwright/index.mjs> node --env-file=../../../../.env.local capture.mjs
 *
 * Signed-in states use a temporary Clerk user, signed in with a single-use ticket that is never
 * printed. The user and everything it wrote (progress, plan, plan quota) are deleted at the end,
 * whatever happens. Only public catalog data and the demo account appear on screen.
 */

import {mkdirSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, 'public', 'captures')
const BASE = process.env.CAPTURE_BASE_URL ?? 'https://vortex-seven-self.vercel.app'
const {chromium} = await import(process.env.PLAYWRIGHT ?? 'playwright')

const COURSE = '/courses/building-ai-apps-with-llms'
const LESSON = '/lessons/building-ai-apps-with-llms-tokens-and-context-windows'
const LESSON_ID = 'lesson.building-ai-apps-with-llms-tokens-and-context-windows'
const QUERY = 'typescript strict mode'
const GOAL = 'Bake sourdough bread at home'
/** The lesson's real quiz: the right option, and a plausible wrong one, per question. */
const QUIZ = [
  {right: "The model's working memory for tokens", wrong: "The model's working memory for tokens"},
  {right: 'Earlier tokens are dropped, so the model guesses missing info', wrong: 'The model runs out of compute power and stops generating'},
  {right: 'Quadratic increase in compute cost and possible performance drop', wrong: 'It reduces the need for a system prompt'},
]

const env = (name) => {
  if (!process.env[name]) throw new Error(`${name} is not set`)
  return process.env[name]
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function clerk(path, init = {}) {
  const response = await fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: {authorization: `Bearer ${env('CLERK_SECRET_KEY')}`, 'content-type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Clerk ${path}: ${response.status}`)
  return response.status === 204 ? null : response.json()
}

async function sanity(body) {
  const base = `https://${env('NEXT_PUBLIC_SANITY_PROJECT_ID')}.api.sanity.io/v2025-01-01/data`
  const headers = {authorization: `Bearer ${env('SANITY_API_WRITE_TOKEN')}`, 'content-type': 'application/json'}
  const dataset = env('NEXT_PUBLIC_SANITY_DATASET')
  if (body.query) {
    const params = new URLSearchParams({query: body.query, ...Object.fromEntries(Object.entries(body.params).map(([k, v]) => [`$${k}`, JSON.stringify(v)]))})
    return (await fetch(`${base}/query/${dataset}?${params}&perspective=raw`, {headers}).then((r) => r.json())).result
  }
  return fetch(`${base}/mutate/${dataset}`, {method: 'POST', headers, body: JSON.stringify(body)})
}

async function signIn(context, userId) {
  const page = await context.newPage()
  await page.goto(BASE, {waitUntil: 'load'})
  await page.waitForFunction(() => window.Clerk?.loaded, null, {timeout: 60_000})
  const {token} = await clerk('/sign_in_tokens', {method: 'POST', body: JSON.stringify({user_id: userId, expires_in_seconds: 300})})
  await page.evaluate(async (ticket) => {
    const attempt = await window.Clerk.client.signIn.create({strategy: 'ticket', ticket})
    await window.Clerk.setActive({session: attempt.createdSessionId})
  }, token)
  await page.waitForFunction(() => Boolean(window.Clerk?.user))
  return page
}

/** Waits for the page to settle: fonts, images, and a beat for motion to finish. */
async function settle(page, ms = 1500) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('load')
  await wait(ms)
}

const shot = (page, name, options = {}) => page.screenshot({path: join(OUT, `${name}.png`), ...options})

mkdirSync(OUT, {recursive: true})
const user = await clerk('/users', {
  method: 'POST',
  body: JSON.stringify({first_name: 'Alex', last_name: 'Rivera', email_address: [`vortex-film-${Date.now()}+clerk_test@example.com`], skip_password_requirement: true}),
})
const browser = await chromium.launch({args: ['--autoplay-policy=no-user-gesture-required']})

try {
  // Desktop, at 2x, for the laptop frame.
  const desktop = await browser.newContext({viewport: {width: 1440, height: 900}, deviceScaleFactor: 2, colorScheme: 'light'})
  await desktop.addInitScript(() => {
    try { localStorage.setItem('vortex-theme', 'light') } catch {}
  })
  const page = await signIn(desktop, user.id)

  // Chapter 2: a course, in order.
  await page.goto(BASE + COURSE, {waitUntil: 'load'})
  await settle(page)
  await shot(page, 'course-hero')
  await shot(page, 'course-full', {fullPage: true})

  // Chapter 3: search, typed word by word, then the results.
  await page.goto(BASE, {waitUntil: 'load'})
  await settle(page)
  const field = page.getByPlaceholder('What do you want to learn?').first()
  await field.click()
  const words = QUERY.split(' ')
  for (let i = 1; i <= words.length; i += 1) {
    await field.fill(words.slice(0, i).join(' '))
    await wait(250)
    await shot(page, `search-typed-${i}`)
  }
  await page.goto(`${BASE}/search?q=${encodeURIComponent(QUERY)}`, {waitUntil: 'load'})
  await page.getByText(/Found \d+ results?/).waitFor({timeout: 90_000})
  await settle(page, 2000)
  await shot(page, 'search-results')

  // Chapter 4: enroll, watch, and the place saved to the second.
  await page.goto(BASE + COURSE, {waitUntil: 'load'})
  await settle(page)
  await page.getByRole('button', {name: 'Enroll for free'}).first().click()
  await page.getByText(/Enrolled/).first().waitFor({timeout: 30_000})
  await settle(page)
  await shot(page, 'course-enrolled')
  const saved = await page.evaluate((lessonId) => fetch('/api/progress', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({type: 'position', lessonId, seconds: 346})}).then((r) => r.status), LESSON_ID)
  if (saved !== 200) throw new Error(`progress save: ${saved}`)
  await page.goto(BASE + COURSE, {waitUntil: 'load'})
  await settle(page)
  await shot(page, 'course-continue')
  await page.goto(`${BASE}${LESSON}?t=346`, {waitUntil: 'load'})
  await page.locator('iframe[src*="youtube"]').first().waitFor({timeout: 30_000})
  await settle(page, 6000)
  await shot(page, 'lesson-playing')

  // Chapter 5: the quiz, failed once and then passed.
  await page.goto(BASE + LESSON, {waitUntil: 'load'})
  await settle(page)
  const quiz = page.locator('#lesson-quiz')
  await quiz.scrollIntoViewIfNeeded()
  await quiz.getByRole('button', {name: 'Take it now'}).click()
  await quiz.locator('fieldset').first().waitFor()
  for (const [i, answer] of QUIZ.entries()) {
    await quiz.locator('fieldset').nth(i).locator('label', {hasText: answer.wrong}).click()
  }
  await settle(page, 600)
  await quiz.screenshot({path: join(OUT, 'quiz-taking.png')})
  await quiz.getByRole('button', {name: 'Submit'}).click()
  await quiz.getByText('Your grade').waitFor({timeout: 30_000})
  await settle(page, 1200)
  await quiz.screenshot({path: join(OUT, 'quiz-failed.png')})
  await quiz.getByRole('button', {name: 'Retake quiz'}).first().click()
  await quiz.locator('fieldset').first().waitFor()
  for (const [i, answer] of QUIZ.entries()) {
    await quiz.locator('fieldset').nth(i).locator('label', {hasText: answer.right}).click()
  }
  await quiz.getByRole('button', {name: 'Submit'}).click()
  await quiz.getByText(/Passed/).first().waitFor({timeout: 30_000})
  await settle(page, 1200)
  await quiz.screenshot({path: join(OUT, 'quiz-passed.png')})
  await desktop.close()

  // Chapter 6: a plan, on a phone, at 3x.
  const phone = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'light'})
  const mobile = await signIn(phone, user.id)
  await mobile.goto(`${BASE}/plans/new`, {waitUntil: 'load'})
  await settle(mobile)
  const goal = mobile.getByLabel('What do you want to learn?')
  await goal.fill(GOAL)
  await settle(mobile, 500)
  await shot(mobile, 'plan-typed')
  await mobile.getByRole('button', {name: 'Build my plan'}).click()
  await mobile.waitForURL(/\/plans\/[a-f0-9]{10}$/, {timeout: 180_000})
  await settle(mobile, 2500)
  await shot(mobile, 'plan-top')
  await shot(mobile, 'plan-full', {fullPage: true})
  await phone.close()
  console.log('Captured every chapter.')
} finally {
  await browser.close()
  const ids = await sanity({
    query: '*[_id == $progress || _id == $quota || string::startsWith(_id, $plans)]._id',
    params: {progress: `progress.${user.id}`, quota: `planQuota.${user.id}`, plans: `plan.${user.id}.`},
  })
  if (ids?.length) await sanity({mutations: ids.map((id) => ({delete: {id}}))})
  await clerk(`/users/${user.id}`, {method: 'DELETE'})
  console.log(`Cleaned up: the demo user and ${ids?.length ?? 0} learner document(s) deleted.`)
}
