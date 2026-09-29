/**
 * Re-imports every lesson thumbnail as YouTube's full-resolution frame (maxresdefault, 1280×720).
 * When a video has no maxres, it falls back to sddefault or hqdefault, which are 4:3 with the 16:9
 * picture letterboxed inside; the image's crop then trims the bars off.
 *
 *   npx sanity exec scripts/media/thumbnails.mjs --with-user-token
 */

import {getCliClient} from 'sanity/cli'
import {deleteOrphans, download, imageField, pool, uploadImage, youtubeId} from './lib.mjs'

const client = getCliClient({apiVersion: '2025-01-01'})

/** A 16:9 frame inside a 4:3 image leaves 12.5% bars top and bottom. */
const LETTERBOX = {_type: 'sanity.imageCrop', top: 0.125, bottom: 0.125, left: 0, right: 0}
const SOURCES = [
  {name: 'maxresdefault', crop: null},
  {name: 'sddefault', crop: LETTERBOX},
  {name: 'hqdefault', crop: LETTERBOX},
]

const lessons = await client.fetch(`*[_type == "lesson" && videoUrl match "*youtu*"]{_id, title, videoUrl, "alt": thumbnail.alt, "old": thumbnail.asset._ref}`)

const tally = {}
const results = await pool(lessons, 6, async (lesson) => {
  const id = youtubeId(lesson.videoUrl)
  for (const source of SOURCES) {
    const buffer = await download(`https://i.ytimg.com/vi/${id}/${source.name}.jpg`)
    // YouTube answers a missing maxres with a 120×90 grey placeholder on some edges; skip tiny files.
    if (!buffer || buffer.length < 5_000) continue
    const assetId = await uploadImage(client, buffer, `${id}-${source.name}.jpg`)
    tally[source.name] = (tally[source.name] ?? 0) + 1
    return {lesson, field: imageField(assetId, {alt: lesson.alt ?? `Video thumbnail for ${lesson.title}`, ...(source.crop ? {crop: source.crop} : {})})}
  }
  console.warn(`No thumbnail for ${lesson._id}`)
  return null
})

const transaction = client.transaction()
for (const result of results.filter(Boolean)) {
  transaction.patch(result.lesson._id, (patch) => patch.set({thumbnail: result.field}))
}
await transaction.commit()

const freed = await deleteOrphans(client, lessons.map((lesson) => lesson.old))
console.log(`Thumbnails: ${JSON.stringify(tally)}; ${freed} old assets freed`)
