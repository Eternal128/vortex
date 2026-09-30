/**
 * Captures the real product for the launch film: every interaction state the film animates, from
 * the live site, at 2x pixel density (3x for the phone), into public/captures/, plus layout.json
 * with the boxes of the elements the camera and the crops use (CSS pixels, page coordinates).
 *
 *   PLAYWRIGHT=<path to playwright/index.mjs> node --env-file=../../../../.env.local capture.mjs [chapter…]
 *
 * Chapters: course, search, player, quiz, plan (all by default). Boxes merge into layout.json, so
 * one chapter can be re-captured on its own.
 *
 * Signed-in states use a temporary Clerk user, signed in with a single-use ticket that is never
 * printed. The user and everything it wrote (progress, plan, plan quota) are deleted at the end,
 * whatever happens. Only public catalog data and the demo account appear on screen.
 */

import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, 'public', 'captures')
const BASE = process.env.CAPTURE_BASE_URL ?? 'https://vortex-seven-self.vercel.app'
const {chromium} = await import(process.env.PLAYWRIGHT ?? 'playwright')

const COURSE = '/courses/building-ai-apps-with-llms'
const LESSON = '/lessons/building-ai-apps-with-llms-tokens-and-context-windows'
const QUESTION = process.env.CAPTURE_QUESTION ?? 'How does strict mode work in TypeScript?'
const GOAL = process.env.CAPTURE_GOAL ?? 'Bake sourdough bread'
/** Seconds the player scrubs through before pausing on the saved one (5:46). */
const SCRUB = [322, 325, 328, 331, 334, 337, 340, 343, 346]
/** The lesson's real quiz: the answers picked on the first try, then the right ones on the retake. */
const FIRST_TRY = ["The model's working memory for tokens", 'The model runs out of compute power and stops generating', 'It reduces the need for a system prompt']
const RETAKE = ["The model's working memory for tokens", 'Earlier tokens are dropped, so the model guesses missing info', 'Quadratic increase in compute cost and possible performance drop']

const env = (name) => {
  if (!process.env[name]) throw new Error(`${name} is not set`)
  return process.env[name]
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const LAYOUT = join(OUT, 'layout.json')
const layout = existsSync(LAYOUT) ? JSON.parse(readFileSync(LAYOUT, 'utf8')) : {}
const wanted = process.argv.slice(2)
const want = (chapter) => wanted.length === 0 || wanted.includes(chapter)

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

/** A box in page coordinates (CSS pixels), rounded. */
async function box(locator, relativeTo) {
  const b = await locator.first().boundingBox()
  if (!b) return null
  const scroll = await locator.first().page().evaluate(() => ({x: scrollX, y: scrollY}))
  const origin = relativeTo ? await relativeTo.boundingBox() : null
  const x = origin ? b.x - origin.x : b.x + scroll.x
  const y = origin ? b.y - origin.y : b.y + scroll.y
  return {x: Math.round(x), y: Math.round(y), w: Math.round(b.width), h: Math.round(b.height)}
}

/**
 * Puts sticky headers back in the document's flow and hides floating bars, so a full-page shot has
 * nothing stuck halfway down it; the film lays the header over the screen itself.
 */
async function unstick(page) {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      const {position} = getComputedStyle(el)
      if (position === 'sticky') el.style.position = 'static'
      if (position === 'fixed') el.style.display = 'none'
    }
  })
  await settle(page, 600)
}

const shot = (page, name, options = {}) => page.screenshot({path: join(OUT, `${name}.png`), ...options})
const pad = (n) => String(n).padStart(2, '0')

mkdirSync(OUT, {recursive: true})
const user = await clerk('/users', {
  method: 'POST',
  body: JSON.stringify({first_name: 'Alex', last_name: 'Rivera', email_address: [`vortex-film-${Date.now()}+clerk_test@example.com`], skip_password_requirement: true}),
})
const browser = await chromium.launch({args: ['--autoplay-policy=no-user-gesture-required']})

try {
  const desktop = await browser.newContext({viewport: {width: 1440, height: 900}, deviceScaleFactor: 2, colorScheme: 'light'})
  const page = await signIn(desktop, user.id)

  // Courses: the page, with the first module open so its lesson rows can be cropped one by one.
  if (want('course')) {
  await page.goto(BASE + COURSE, {waitUntil: 'load'})
  await settle(page)
  await unstick(page)
  // Every module collapsed first: the four module rows the spheres hop along.
  const titles = ['LLM Fundamentals', 'Prompting That Holds Up', 'Tool Calling and Agents', 'Shipping to Production']
  const moduleButton = (title) => page.locator('button[aria-expanded]').filter({hasText: title})
  for (const title of titles) {
    if ((await moduleButton(title).getAttribute('aria-expanded')) === 'true') await moduleButton(title).click()
  }
  await settle(page, 800)
  layout.courseCollapsed = {modules: await Promise.all(titles.map((title) => box(moduleButton(title))))}
  await shot(page, 'course-collapsed-full', {fullPage: true})
  const firstModule = moduleButton('LLM Fundamentals')
  if ((await firstModule.getAttribute('aria-expanded')) !== 'true') await firstModule.click()
  await settle(page, 800)
  const panel = page.locator(`#${await firstModule.getAttribute('aria-controls')}`)
  layout.course = {
    creators: await box(page.getByText(/Videos by/)),
    avatars: await box(page.getByText(/Videos by/).locator('xpath=preceding-sibling::*[1]')),
    title: await box(page.locator('h1')),
    contentHeading: await box(page.getByText('Course Content', {exact: true})),
    module: await box(firstModule),
    rows: await Promise.all([0, 1, 2].map((i) => box(panel.locator('li').nth(i)))),
    modules: await Promise.all(['Prompting That Holds Up', 'Tool Calling and Agents'].map((title) => box(page.locator('button[aria-expanded]').filter({hasText: title})))),
    nav: await box(page.locator('header').first()),
    height: await page.evaluate(() => document.documentElement.scrollHeight),
  }
  await shot(page, 'course-full', {fullPage: true})
  }

  // Search: the question typed character by character into the search page's own field.
  if (want('search')) {
  await page.goto(`${BASE}/search`, {waitUntil: 'load'})
  await settle(page)
  const field = page.locator('#search-page-input')
  layout.searchField = await box(field.locator('xpath=ancestor::form[1]'))
  await field.click()
  await shot(page, 'search-typed-00')
  for (let i = 1; i <= QUESTION.length; i += 1) {
    await page.keyboard.type(QUESTION[i - 1])
    await wait(40)
    await shot(page, `search-typed-${pad(i)}`)
  }
  await page.keyboard.press('Enter')
  await page.getByText(/Found \d+ results?/).waitFor({timeout: 90_000})
  await settle(page, 2000)
  const cards = page.locator('main a').filter({hasText: /Watch from|View lesson/})
  layout.results = {
    cards: await Promise.all(Array.from({length: Math.min(4, await cards.count())}, (_, i) => box(cards.nth(i)))),
    watch: (await page.getByText(/Watch from/).count()) ? await box(page.getByText(/Watch from/).first()) : null,
    heading: await box(page.getByText(/Results for/)),
  }
  await shot(page, 'search-results')
  await shot(page, 'search-results-full', {fullPage: true})
  }

  // Progress: the real player scrubbing forward to the saved second, then paused on it.
  if (want('player')) {
  await page.goto(`${BASE}${LESSON}?t=${SCRUB[0]}`, {waitUntil: 'load'})
  const iframe = page.locator('iframe[src*="youtube"]').first()
  await iframe.waitFor({timeout: 30_000})
  await settle(page, 5000)
  layout.player = await box(iframe)
  const command = (func, args = []) =>
    page.evaluate(([func, args]) => {
      // The embed is served from youtube-nocookie.com; like the app, post to any origin.
      document.querySelector('iframe[src*="youtube"]').contentWindow.postMessage(JSON.stringify({event: 'command', func, args}), '*')
    }, [func, args])
  const hover = async (i) => {
    const b = await iframe.boundingBox()
    await page.mouse.move(b.x + b.width * (0.4 + (i % 2) * 0.1), b.y + b.height * 0.6, {steps: 4})
  }
  // Each frame is sought and paused, so its timestamp reads exactly; the last is the saved 5:46.
  for (const [i, second] of SCRUB.entries()) {
    await command('seekTo', [second, true])
    await command('pauseVideo')
    await hover(i)
    await wait(1200)
    await shot(page, `player-${pad(i)}`)
  }
  await hover(1)
  await wait(600)
  await shot(page, 'player-paused')
  }

  // Quiz: each answer picked, graded, then retaken and passed.
  if (want('quiz')) {
  await page.goto(BASE + LESSON, {waitUntil: 'load'})
  await settle(page)
  const quiz = page.locator('#lesson-quiz')
  await quiz.scrollIntoViewIfNeeded()
  await quiz.getByRole('button', {name: 'Take it now'}).click()
  await quiz.locator('fieldset').first().waitFor()
  await settle(page, 600)
  const pick = async (answers, prefix) => {
    await quiz.screenshot({path: join(OUT, `${prefix}-0.png`)})
    for (const [i, answer] of answers.entries()) {
      await quiz.locator('fieldset').nth(i).locator('label', {hasText: answer}).click()
      await wait(300)
      await quiz.screenshot({path: join(OUT, `${prefix}-${i + 1}.png`)})
    }
    layout[`${prefix}Options`] = await Promise.all(answers.map((answer, i) => box(quiz.locator('fieldset').nth(i).locator('label', {hasText: answer}), quiz)))
    layout[`${prefix}Size`] = await box(quiz, quiz)
  }
  await pick(FIRST_TRY, 'quiz-first')
  await quiz.getByRole('button', {name: 'Submit'}).click()
  await quiz.getByText('Your grade').waitFor({timeout: 30_000})
  await settle(page, 1200)
  layout.quizFailed = {size: await box(quiz, quiz), grade: await box(quiz.getByText('33%'), quiz), rows: await Promise.all([0, 1, 2].map((i) => box(quiz.locator('ol > li').nth(i), quiz))), retake: await box(quiz.getByRole('button', {name: 'Retake quiz'}), quiz)}
  await quiz.screenshot({path: join(OUT, 'quiz-failed.png')})
  await quiz.getByRole('button', {name: 'Retake quiz'}).first().click()
  await quiz.locator('fieldset').first().waitFor()
  await settle(page, 600)
  await pick(RETAKE, 'quiz-retake')
  await quiz.getByRole('button', {name: 'Submit'}).click()
  await quiz.getByText(/Passed/).first().waitFor({timeout: 30_000})
  await settle(page, 1200)
  layout.quizPassed = {size: await box(quiz, quiz), grade: await box(quiz.getByText('100%'), quiz), passed: await box(quiz.getByText('Passed', {exact: true}), quiz), rows: await Promise.all([0, 1, 2].map((i) => box(quiz.locator('ol > li').nth(i), quiz)))}
  await quiz.screenshot({path: join(OUT, 'quiz-passed.png')})
  }

  // Plan, on the laptop first: the frame that morphs into the phone.
  if (want('plan')) {
    await page.goto(`${BASE}/plans/new`, {waitUntil: 'load'})
    await settle(page)
    await shot(page, 'plan-desktop')
  }
  await desktop.close()

  if (want('plan')) {
  // Plan, on a phone at 3x: the goal typed, the plan built, its rows and thumbnails boxed.
  const phone = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'light'})
  const mobile = await signIn(phone, user.id)
  await mobile.goto(`${BASE}/plans/new`, {waitUntil: 'load'})
  await settle(mobile)
  const goal = mobile.getByLabel('What do you want to learn?')
  await goal.click()
  layout.planNav = await box(mobile.locator('header').first())
  layout.planGoal = await box(goal)
  await shot(mobile, 'plan-typed-00')
  for (let i = 1; i <= GOAL.length; i += 1) {
    await mobile.keyboard.type(GOAL[i - 1])
    await wait(40)
    await shot(mobile, `plan-typed-${pad(i)}`)
  }
  layout.planSend = await box(mobile.getByRole('button', {name: 'Build my plan'}))
  await mobile.getByRole('button', {name: 'Build my plan'}).click()
  try {
    await mobile.waitForURL(/\/plans\/[a-f0-9]{10}$/, {timeout: 180_000})
  } catch (error) {
    await shot(mobile, 'plan-error')
    const alert = await mobile.getByRole('alert').first().textContent().catch(() => null)
    throw new Error(`The plan did not build: ${alert ?? 'no message on the page'}`, {cause: error})
  }
  await settle(mobile, 3000)
  await mobile.evaluate(() => scrollTo(0, 0))
  await unstick(mobile)
  // Each lesson is a link to its lesson page, with the video's thumbnail as its image.
  const lessons = mobile.locator('main a[href^="/plans/"]').filter({has: mobile.locator('img')})
  const count = Math.min(6, await lessons.count())
  layout.plan = {
    rows: await Promise.all(Array.from({length: count}, (_, i) => box(lessons.nth(i)))),
    thumbs: await Promise.all(Array.from({length: count}, (_, i) => box(lessons.nth(i).locator('img')))),
    nav: await box(mobile.locator('header').first()),
    height: await mobile.evaluate(() => document.documentElement.scrollHeight),
  }
  await shot(mobile, 'plan-full', {fullPage: true})
  await phone.close()
  }

  writeFileSync(LAYOUT, `${JSON.stringify(layout, null, 2)}\n`)
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
