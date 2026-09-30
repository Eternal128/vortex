/**
 * Downloads real lesson thumbnails for the film's opening shot into public/captures/thumbs/.
 * Public catalog images only, read through the server-side token.
 *
 *   node --env-file=../../../../.env.local thumbnails.mjs
 */

import {mkdirSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'public', 'captures', 'thumbs')
const COUNT = 24

const env = (name) => {
  if (!process.env[name]) throw new Error(`${name} is not set`)
  return process.env[name]
}

const query = encodeURIComponent(`*[_type == "lesson" && defined(thumbnail.asset)] | order(_id asc)[0...${COUNT * 3}]{"url": thumbnail.asset->url, "crop": thumbnail.crop}`)
const response = await fetch(
  `https://${env('NEXT_PUBLIC_SANITY_PROJECT_ID')}.api.sanity.io/v2025-01-01/data/query/${env('NEXT_PUBLIC_SANITY_DATASET')}?query=${query}`,
  {headers: {authorization: `Bearer ${env('SANITY_API_READ_TOKEN')}`}},
)
const {result} = await response.json()

// Every third lesson, for a spread across courses; maxres frames only (no letterbox crop).
const picks = result.filter((row, i) => i % 3 === 0 && !row.crop).slice(0, COUNT)
mkdirSync(OUT, {recursive: true})
await Promise.all(
  picks.map(async (row, i) => {
    const image = await fetch(`${row.url}?w=640&h=360&fit=crop&fm=jpg&q=82`)
    writeFileSync(join(OUT, `t${String(i).padStart(2, '0')}.jpg`), Buffer.from(await image.arrayBuffer()))
  }),
)
console.log(`Saved ${picks.length} thumbnails.`)
