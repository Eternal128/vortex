/**
 * Expands the authored content spec plus the resolved video cache into an NDJSON file the Sanity
 * CLI can import.
 *
 *   node scripts/seed/build-ndjson.mjs
 *   npx sanity dataset import scripts/seed/seed.ndjson production --replace
 *
 * Two things this file is strict about:
 *
 * 1. Document ids are deterministic (`course.<slug>`, `lesson.<slug>`, ...), so importing with
 *    --replace is idempotent instead of duplicating the whole catalog.
 * 2. Nothing is written until every self-check passes. The Studio's validation rules do not run
 *    on import, so they are re-implemented here — a bad seed should fail at build time, not show
 *    up as a red badge in the Studio three days later.
 */

import {createHash} from 'node:crypto'
import {readFileSync, writeFileSync, existsSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

import {categories as courseCategories, courseArt, courses, posts, teamIdeas} from './content.mjs'
import {fieldNotes, noteCategories} from './field-notes.mjs'

/** Course categories plus the blog-only topics (they have no courses, so the catalog hides them). */
const categories = [...courseCategories, ...noteCategories]

const HERE = dirname(fileURLToPath(import.meta.url))
const CACHE_PATH = join(HERE, 'videos.json')
const OUT_PATH = join(HERE, 'seed.ndjson')

if (!existsSync(CACHE_PATH)) {
  console.error('videos.json is missing. Run: node scripts/seed/resolve-videos.mjs')
  process.exit(1)
}

const videos = JSON.parse(readFileSync(CACHE_PATH, 'utf8'))

const problems = []
const check = (condition, message) => {
  if (!condition) problems.push(message)
}

/* ---------------------------------------------------------------- helpers */

const KEY_MAX_LENGTH = 60

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/**
 * Stable `_key`s: same input, same output, so a re-import produces no diff noise.
 *
 * Over-long keys keep a digest of the full input instead of a bare truncation — the distinguishing
 * part of these keys is the tail (`-point-0`, `-h2`), so plain truncation collided every block
 * inside a lesson with a long slug.
 */
const keyOf = (...parts) => {
  const full = parts.map(slugify).filter(Boolean).join('-')
  if (full.length <= KEY_MAX_LENGTH) return full

  const digest = createHash('sha1').update(full).digest('hex').slice(0, 8)
  return `${full.slice(0, KEY_MAX_LENGTH - digest.length - 1).replace(/-$/, '')}-${digest}`
}

/** A Portable Text paragraph or heading. */
const block = (text, style = 'normal', keyBase) => ({
  _type: 'block',
  _key: keyOf(keyBase),
  style,
  markDefs: [],
  children: [{_type: 'span', _key: keyOf(keyBase, 'span'), text, marks: []}],
})

/** A bulleted list item. */
const bullet = (text, keyBase) => ({
  ...block(text, 'normal', keyBase),
  listItem: 'bullet',
  level: 1,
})

/**
 * Image fields use `_sanityAsset`, which tells the import CLI to download the URL and upload it
 * as a real Sanity asset. Nothing hotlinks at runtime.
 */
const image = (url, alt) => ({_type: 'image', _sanityAsset: `image@${url}`, alt})

const posterUrl = (videoId) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

/* ------------------------------------------------------------- documents */

const documents = []

for (const category of categories) {
  check(category.description.length <= 200, `category ${category.slug}: description over 200 chars`)
  documents.push({
    _id: `category.${category.slug}`,
    _type: 'category',
    title: category.title,
    slug: {_type: 'slug', current: category.slug},
    description: category.description,
  })
}

const categorySlugs = new Set(categories.map((c) => c.slug))
const lessonIds = new Set()
const referencedLessonIds = new Set()
const usedVideoIds = new Map()

for (const course of courses) {
  check(categorySlugs.has(course.category), `course ${course.slug}: unknown category`)
  check(course.summary.length <= 200, `course ${course.slug}: summary over 200 chars`)
  check(course.outcomes.length <= 6, `course ${course.slug}: more than 6 learning outcomes`)
  check(course.modules.length >= 1, `course ${course.slug}: needs at least one module`)

  /**
   * Student counts decay through the curriculum, and the course count is the first lesson's, so
   * no lesson ever claims more students than the course that contains it.
   */
  let lessonPosition = 0
  // The course cover starts as its first video's frame; scripts/media/covers.mjs builds the real one.
  let firstVideoId = null

  const modules = course.modules.map((module, moduleIndex) => {
    check(
      !module.summary || module.summary.length <= 240,
      `course ${course.slug} / module ${moduleIndex + 1}: summary over 240 chars`,
    )
    check(
      module.lessons.length >= 1,
      `course ${course.slug} / module ${moduleIndex + 1}: needs at least one lesson`,
    )

    const lessonRefs = module.lessons.map((lesson) => {
      // Lesson slugs must be globally unique: LESSON_BY_SLUG_QUERY matches on the slug alone.
      const slug = `${course.slug}-${lesson.slug}`
      const id = `lesson.${slug}`
      const cacheKey = `${course.slug}-${lesson.slug}`
      const video = videos[cacheKey]

      check(Boolean(video), `lesson ${slug}: no resolved video. Re-run resolve-videos.mjs`)
      check(!lessonIds.has(id), `lesson ${slug}: duplicate lesson slug`)
      lessonIds.add(id)

      if (video) {
        const owner = usedVideoIds.get(video.id)
        check(!owner, `lesson ${slug}: video ${video.id} already used by ${owner}`)
        usedVideoIds.set(video.id, slug)
      }

      check(lesson.points.length <= 6, `lesson ${slug}: more than 6 key points`)
      check(!lesson.proTip || lesson.proTip.length <= 280, `lesson ${slug}: pro tip over 280 chars`)

      // 0-based position of this lesson within the whole course.
      const position = lessonPosition
      lessonPosition += 1
      if (position === 0) firstVideoId = video?.id ?? null

      const resources = [
        {
          _type: 'resource',
          _key: keyOf(slug, 'docs'),
          type: 'link',
          title: course.docs.title,
          description: 'The official reference for the tools used in this lesson.',
          url: course.docs.url,
        },
      ]
      if (lesson.resource) {
        check(
          !lesson.resource.description || lesson.resource.description.length <= 160,
          `lesson ${slug}: resource description over 160 chars`,
        )
        resources.push({_type: 'resource', _key: keyOf(slug, 'extra'), ...lesson.resource})
      }

      documents.push({
        _id: id,
        _type: 'lesson',
        title: lesson.title,
        slug: {_type: 'slug', current: slug},
        videoUrl: `https://www.youtube.com/watch?v=${video?.id ?? 'missing'}`,
        thumbnail: image(posterUrl(video?.id ?? 'missing'), `Video thumbnail for ${lesson.title}`),
        duration: video?.duration ?? 0,
        // One free preview per course: the opening lesson.
        freePreview: position === 0,
        notes: [
          block(lesson.summary, 'normal', `${slug}-intro`),
          block('What this lesson covers', 'h2', `${slug}-h2`),
          ...lesson.points.map((point, i) => bullet(point, `${slug}-point-${i}`)),
          block(
            `This lesson sits in ${module.title}, part of ${course.title}. It assumes what came before it and leads directly into the next lesson in the module.`,
            'normal',
            `${slug}-outro`,
          ),
        ],
        keyPoints: lesson.points,
        ...(lesson.proTip ? {proTip: lesson.proTip} : {}),
        resources,
      })

      referencedLessonIds.add(id)
      return {_type: 'reference', _key: keyOf(slug, 'ref'), _ref: id}
    })

    return {
      _type: 'module',
      _key: keyOf(course.slug, 'module', String(moduleIndex + 1)),
      title: module.title,
      summary: module.summary,
      lessons: lessonRefs,
    }
  })

  documents.push({
    _id: `course.${course.slug}`,
    _type: 'course',
    title: course.title,
    slug: {_type: 'slug', current: course.slug},
    summary: course.summary,
    coverImage: image(posterUrl(firstVideoId ?? 'missing'), `A frame from ${course.title}`),
    category: {_type: 'reference', _ref: `category.${course.category}`},
    level: course.level,
    price: course.price,
    popular: course.popular,
    ...(courseArt[course.slug] ?? {}),
    learningOutcomes: course.outcomes.map((outcome, index) => {
      check(outcome.title.length <= 60, `course ${course.slug}: outcome title over 60 chars`)
      check(
        outcome.description.length <= 160,
        `course ${course.slug}: outcome description over 160 chars`,
      )
      return {_type: 'learningOutcome', _key: keyOf(course.slug, 'outcome', String(index)), ...outcome}
    }),
    modules,
  })
}

/* ------------------------------------------------------------ field notes */

/** Diagram names the web registry can draw (components/blog/diagrams/index.tsx). */
const DIAGRAM_NAMES = new Set([
  'vortex-before-after', 'system-architecture', 'search-pipeline', 'ingestion-pipeline',
  'trust-boundaries', 'write-path-guards', 'creator-flow', 'spacing-ridgeline',
  'forgetting-reviews', 'testing-effect', 'engagement-by-length', 'interpolated-quizzes',
  'feeling-vs-learning', 'blocked-vs-interleaved', 'pretest-loop',
])

/** One body tuple from content.mjs / field-notes.mjs as a Portable Text member. */
function noteBlock(slug, [kind, a, b], index) {
  const keyBase = `${slug}-${index}`
  switch (kind) {
    case 'h2':
    case 'h3':
      return block(a, kind, keyBase)
    case 'quote':
      return block(a, 'blockquote', keyBase)
    case 'li':
      return bullet(a, keyBase)
    case 'ol':
      return {...block(a, 'normal', keyBase), listItem: 'number', level: 1}
    case 'diagram':
      check(DIAGRAM_NAMES.has(a), `post ${slug}: unknown diagram "${a}"`)
      return {_type: 'diagram', _key: keyOf(keyBase, 'diagram'), name: a, ...(b ? {caption: b} : {})}
    case 'callout':
      check(['takeaway', 'vortex', 'caveat'].includes(a), `post ${slug}: unknown callout tone "${a}"`)
      return {_type: 'callout', _key: keyOf(keyBase, 'callout'), tone: a, text: b}
    default:
      check(kind === 'p', `post ${slug}: unknown body entry "${kind}"`)
      return block(a, 'normal', keyBase)
  }
}

const courseSlugs = new Set(courses.map((c) => c.slug))

for (const post of [...posts, ...fieldNotes]) {
  check(categorySlugs.has(post.topic), `post ${post.slug}: unknown topic`)
  check(post.author.length <= 60, `post ${post.slug}: author over 60 chars`)
  check(!post.course || courseSlugs.has(post.course), `post ${post.slug}: unknown course`)
  check(post.title.length <= 110, `post ${post.slug}: title over 110 chars`)
  check(post.excerpt.length <= 220, `post ${post.slug}: excerpt over 220 chars`)

  documents.push({
    _id: `post.${post.slug}`,
    _type: 'post',
    title: post.title,
    slug: {_type: 'slug', current: post.slug},
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    authorName: post.author,
    topic: {_type: 'reference', _ref: `category.${post.topic}`},
    ...(post.course
      ? {relatedCourse: {_type: 'reference', _ref: `course.${post.course}`}}
      : {}),
    body: post.body.map((entry, index) => noteBlock(post.slug, entry, index)),
    ...(post.references?.length
      ? {
          references: post.references.map((ref, index) => {
            check(ref.url?.startsWith('https://'), `post ${post.slug}: reference ${index + 1} needs an https url`)
            return {_type: 'citation', _key: keyOf(post.slug, 'ref', String(index)), ...ref}
          }),
        }
      : {}),
  })
}

/* ------------------------------------------------------------ team ideas */

for (const idea of teamIdeas) {
  check(idea.title.length >= 8 && idea.title.length <= 90, `idea ${idea.slug}: title length`)
  check(
    idea.description.length >= 20 && idea.description.length <= 600,
    `idea ${idea.slug}: description length`,
  )
  documents.push({
    _id: `idea.team-${idea.slug}`,
    _type: 'idea',
    title: idea.title,
    description: idea.description,
    kind: idea.kind,
    status: idea.status,
    moderation: 'approved',
    origin: 'team',
    authorName: 'Vortex team',
    createdAt: idea.createdAt,
  })
}

/* ---------------------------------------------------------- final checks */

for (const id of lessonIds) {
  check(referencedLessonIds.has(id), `lesson ${id} is orphaned: no course references it`)
}

const ids = documents.map((doc) => doc._id)
check(new Set(ids).size === ids.length, 'duplicate document _id in the seed')

if (problems.length) {
  console.error(`Refusing to write ${OUT_PATH}. ${problems.length} problem(s):\n`)
  problems.forEach((problem) => console.error(`  - ${problem}`))
  process.exit(1)
}

writeFileSync(OUT_PATH, `${documents.map((doc) => JSON.stringify(doc)).join('\n')}\n`)

const count = (type) => documents.filter((doc) => doc._type === type).length
console.log(`Wrote ${documents.length} documents to ${OUT_PATH}`)
console.log(
  `  categories: ${count('category')}\n` +
    `  courses: ${count('course')}\n` +
    `  lessons: ${count('lesson')}\n` +
    `  field notes: ${count('post')}\n` +
    `  team ideas: ${count('idea')}`,
)
