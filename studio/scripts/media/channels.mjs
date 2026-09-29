/**
 * Credits every YouTube video to its real channel: the channel id, its name, and its own avatar,
 * from the YouTube Data API (videos.list and channels.list, 1 quota unit per 50 ids).
 *
 *   npx sanity exec scripts/media/channels.mjs --with-user-token
 *
 * Needs YOUTUBE_API_KEY (read from ../.env.local). Avatars are imported as Sanity assets; nothing
 * hotlinks at runtime.
 */

import {getCliClient} from 'sanity/cli'
import {deleteOrphans, download, imageField, pool, readEnv, uploadImage} from './lib.mjs'

const client = getCliClient({apiVersion: '2025-01-01'})
const KEY = readEnv('YOUTUBE_API_KEY')
if (!KEY) throw new Error('Set YOUTUBE_API_KEY in ../.env.local')

const chunk = (items, size) => Array.from({length: Math.ceil(items.length / size)}, (_, i) => items.slice(i * size, i * size + size))

async function youtube(resource, params) {
  const query = new URLSearchParams({...params, key: KEY})
  const response = await fetch(`https://www.googleapis.com/youtube/v3/${resource}?${query}`)
  if (!response.ok) throw new Error(`YouTube ${resource}: ${response.status} ${await response.text()}`)
  return (await response.json()).items ?? []
}

const videos = await client.fetch(`*[_type == "video" && provider == "youtube"]{_id, videoId, "oldAvatar": channelAvatar.asset._ref}`)

const channelOf = new Map()
for (const ids of chunk(videos.map((video) => video.videoId), 50)) {
  for (const item of await youtube('videos', {part: 'snippet', id: ids.join(',')})) {
    channelOf.set(item.id, item.snippet.channelId)
  }
}

const channels = new Map()
for (const ids of chunk([...new Set(channelOf.values())], 50)) {
  for (const item of await youtube('channels', {part: 'snippet', id: ids.join(',')})) {
    const thumbs = item.snippet.thumbnails ?? {}
    channels.set(item.id, {title: item.snippet.title, avatarUrl: (thumbs.high ?? thumbs.medium ?? thumbs.default)?.url})
  }
}
console.log(`${videos.length} videos, ${channels.size} channels`)

const avatars = new Map()
await pool([...channels.entries()], 6, async ([id, channel]) => {
  if (!channel.avatarUrl) return
  const buffer = await download(channel.avatarUrl)
  if (buffer) avatars.set(id, await uploadImage(client, buffer, `channel-${id}.jpg`))
})

let patched = 0
let missing = 0
const transaction = client.transaction()
for (const video of videos) {
  const channelId = channelOf.get(video.videoId)
  const channel = channelId && channels.get(channelId)
  if (!channel) {
    missing += 1
    continue
  }
  const set = {channelId, channel: channel.title}
  if (avatars.has(channelId)) set.channelAvatar = imageField(avatars.get(channelId))
  transaction.patch(video._id, (patch) => patch.set(set))
  patched += 1
}
await transaction.commit()

const freed = await deleteOrphans(client, videos.map((video) => video.oldAvatar))
console.log(`Credited ${patched} videos (${avatars.size} avatars); ${missing} not found on YouTube; ${freed} old avatars freed`)
