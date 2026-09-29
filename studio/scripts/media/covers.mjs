/**
 * Builds each course cover from the course itself: its first three lesson thumbnails as a
 * filmstrip on the category's color. The first lesson sits in the middle, so every crop the site
 * uses (the tall course hero, square card icons, 16:9 home cards) shows a real frame from the course.
 *
 *   PLAYWRIGHT=<path to playwright/index.mjs> npx sanity exec scripts/media/covers.mjs --with-user-token
 *
 * Run after thumbnails.mjs, so the frames are full resolution. Rendering uses a headless browser
 * (Playwright) for rounded corners and shadows; nothing here runs in the request path.
 */

import {getCliClient} from 'sanity/cli'
import {deleteOrphans, imageField, uploadImage} from './lib.mjs'

const client = getCliClient({apiVersion: '2025-01-01'})
const {chromium} = await import(process.env.PLAYWRIGHT ?? 'playwright')

const WIDTH = 1200
const HEIGHT = 1400

/** One hue per category, the same as the explainer video's. */
const HUES = {
  'AI Engineering': '#8b5cf6',
  'Web Development': '#0ea5e9',
  Data: '#14b8a6',
  Security: '#f43f5e',
  'Backend & Infrastructure': '#f59e0b',
  Languages: '#84cc16',
}

const courses = await client.fetch(`*[_type == "course"]{
  _id,
  title,
  "slug": slug.current,
  "category": category->title,
  "old": coverImage.asset._ref,
  "lessons": (modules[].lessons[]->{title, "src": thumbnail.asset->url, "crop": thumbnail.crop})[0...3]
}`)

const html = (course, hue) => {
  // Middle, top, bottom: lesson 1 is the one every center crop shows.
  const [first, second, third] = course.lessons
  const frame = (lesson, top) => {
    const crop = lesson.crop ?? {top: 0, bottom: 0}
    const visible = 1 - crop.top - crop.bottom
    return `<div class="frame" style="top:${top}px">
      <img src="${lesson.src}?w=1280" style="height:${100 / visible}%;top:${(-crop.top / visible) * 100}%">
    </div>`
  }
  const h = 574
  const middle = (HEIGHT - h) / 2
  return `<!doctype html><html><head><style>
    html,body{margin:0;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden}
    body{background:radial-gradient(120% 80% at 20% 10%, ${hue}55 0%, ${hue}22 45%, #18181b 100%), #18181b}
    .frame{position:absolute;left:${(WIDTH - 1020) / 2}px;width:1020px;height:${h}px;border-radius:30px;overflow:hidden;
      box-shadow:0 30px 70px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.12)}
    .frame img{position:absolute;left:0;width:100%;object-fit:cover}
    .dim{opacity:.55}
  </style></head><body>
    <div class="dim">${frame(second ?? first, middle - h - 40)}${frame(third ?? first, middle + h + 40)}</div>
    ${frame(first, middle)}
  </body></html>`
}

const browser = await chromium.launch()
const page = await browser.newPage({viewport: {width: WIDTH, height: HEIGHT}})
const transaction = client.transaction()
try {
  for (const course of courses) {
    const lessons = course.lessons.filter((lesson) => lesson?.src)
    if (!lessons.length) {
      console.warn(`No thumbnails for ${course.slug}`)
      continue
    }
    await page.setContent(html({...course, lessons}, HUES[course.category] ?? '#f35252'), {waitUntil: 'networkidle'})
    const buffer = await page.screenshot({type: 'jpeg', quality: 88})
    const assetId = await uploadImage(client, buffer, `cover-${course.slug}.jpg`)
    const titles = lessons.map((lesson) => lesson.title)
    const alt = `Frames from ${course.title}: ${titles.slice(0, -1).join(', ')}${titles.length > 1 ? ' and ' : ''}${titles.at(-1)}`
    transaction.patch(course._id, (patch) => patch.set({coverImage: imageField(assetId, {alt})}))
    console.log(`${course.slug}: ${titles[0]}`)
  }
} finally {
  await browser.close()
}
await transaction.commit()
console.log(`Covers: ${courses.length}; ${await deleteOrphans(client, courses.map((course) => course.old))} old covers freed`)
