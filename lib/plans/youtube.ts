import "server-only";

/**
 * Finds lesson videos with the official YouTube Data API v3: safe search, embeddable only, and a
 * duration window that rules out Shorts and multi-hour streams. Quota: a search costs 100 units and
 * the details lookup 1, so one lesson is ~101 of the free 10,000 a day.
 */

const API = "https://www.googleapis.com/youtube/v3";
const MIN_SECONDS = 3 * 60;
const MAX_SECONDS = 40 * 60;

export interface PlanVideo {
  videoId: string;
  videoUrl: string;
  videoTitle: string;
  channel: string;
  durationSeconds: number;
  thumbnailUrl: string | null;
}

export class YouTubeQuotaError extends Error {}

function apiKey() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("Missing environment variable: YOUTUBE_API_KEY");
  return key;
}

async function call<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${API}/${path}`);
  for (const [name, value] of Object.entries({ ...params, key: apiKey() })) url.searchParams.set(name, value);
  const response = await fetch(url, { cache: "no-store" });
  if (response.status === 403) {
    const body = await response.text();
    if (/quota/i.test(body)) throw new YouTubeQuotaError("YouTube quota exhausted for today");
    throw new Error(`YouTube API 403: ${body.slice(0, 200)}`);
  }
  if (!response.ok) throw new Error(`YouTube API ${response.status}`);
  return response.json() as Promise<T>;
}

/** "PT1H2M3S" -> 3723. */
function isoSeconds(iso: string) {
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

function decodeEntities(text: string) {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

interface SearchResponse {
  items?: { id?: { videoId?: string } }[];
}
interface VideosResponse {
  items?: {
    id: string;
    snippet?: {
      title?: string;
      channelTitle?: string;
      liveBroadcastContent?: string;
      defaultAudioLanguage?: string;
      defaultLanguage?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
    contentDetails?: { duration?: string };
    status?: { embeddable?: boolean; privacyStatus?: string };
  }[];
}

/** Acceptable videos for one query, best first. */
export async function videoCandidates(query: string): Promise<PlanVideo[]> {
  const search = await call<SearchResponse>("search", {
    part: "id",
    type: "video",
    q: query,
    maxResults: "8",
    safeSearch: "strict",
    videoEmbeddable: "true",
    videoSyndicated: "true",
    relevanceLanguage: "en",
  });
  const ids = (search.items ?? []).flatMap((item) => (item.id?.videoId ? [item.id.videoId] : []));
  if (ids.length === 0) return [];

  const details = await call<VideosResponse>("videos", { part: "snippet,contentDetails,status", id: ids.join(",") });
  const byId = new Map((details.items ?? []).map((item) => [item.id, item]));

  return ids.flatMap((id) => {
    const item = byId.get(id);
    const seconds = isoSeconds(item?.contentDetails?.duration ?? "");
    // relevanceLanguage is only a hint; a declared non-English audio track is a hard no.
    const language = item?.snippet?.defaultAudioLanguage ?? item?.snippet?.defaultLanguage;
    const english = !language || language.toLowerCase().startsWith("en");
    const ok =
      item &&
      item.status?.embeddable !== false &&
      item.status?.privacyStatus === "public" &&
      item.snippet?.liveBroadcastContent === "none" &&
      english &&
      seconds >= MIN_SECONDS &&
      seconds <= MAX_SECONDS;
    if (!ok) return [];
    const thumbs = item.snippet?.thumbnails ?? {};
    return [
      {
        videoId: id,
        videoUrl: `https://www.youtube.com/watch?v=${id}`,
        videoTitle: decodeEntities(item.snippet?.title ?? ""),
        channel: decodeEntities(item.snippet?.channelTitle ?? ""),
        durationSeconds: seconds,
        thumbnailUrl: thumbs.high?.url ?? thumbs.medium?.url ?? thumbs.default?.url ?? null,
      },
    ];
  });
}
