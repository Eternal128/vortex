/**
 * Shared helpers for the media scripts: env, image download and upload, and freeing replaced assets.
 */

import {existsSync, readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const ENV_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../../.env.local')

export function readEnv(name) {
  if (process.env[name]) return process.env[name]
  if (!existsSync(ENV_PATH)) return undefined
  const line = readFileSync(ENV_PATH, 'utf8').split('\n').find((row) => row.startsWith(`${name}=`))
  return line?.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') || undefined
}

/** A YouTube video id from any watch, share, or embed URL. */
export function youtubeId(url) {
  const parsed = new URL(url)
  if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1)
  return parsed.searchParams.get('v') ?? parsed.pathname.split('/').pop()
}

/** Downloads an image, or returns null on a 404. */
export async function download(url) {
  const response = await fetch(url)
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`GET ${url}: ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

export async function uploadImage(client, buffer, filename) {
  const asset = await client.assets.upload('image', buffer, {filename})
  return asset._id
}

export const imageField = (assetId, extra = {}) => ({
  _type: 'image',
  asset: {_type: 'reference', _ref: assetId},
  ...extra,
})

/** Deletes assets that nothing references any more, after a script has replaced them. */
export async function deleteOrphans(client, assetIds) {
  const unique = [...new Set(assetIds.filter(Boolean))]
  let deleted = 0
  for (const id of unique) {
    const refs = await client.fetch('count(*[references($id)])', {id})
    if (refs === 0) {
      await client.delete(id)
      deleted += 1
    }
  }
  return deleted
}

/** Runs `worker` over `items` with at most `limit` in flight. */
export async function pool(items, limit, worker) {
  const results = []
  let next = 0
  await Promise.all(
    Array.from({length: Math.min(limit, items.length)}, async () => {
      while (next < items.length) {
        const index = next++
        results[index] = await worker(items[index], index)
      }
    }),
  )
  return results
}
