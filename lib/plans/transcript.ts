import "server-only";

/**
 * A video's caption text, for grounding plan quizzes. Ported from studio/scripts/ingest/providers/
 * youtube.mjs, which documents why: the watch-page caption URL answers with an empty body, and the
 * InnerTube player endpoint with the iOS client context is the path that serves. Undocumented and
 * brittle by nature — callers treat a failure as "no transcript", never as fatal.
 */

const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const IOS_USER_AGENT = "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X)";
const IOS_CONTEXT = {
  client: { clientName: "IOS", clientVersion: "20.10.4", deviceModel: "iPhone16,2", hl: "en", gl: "US" },
};

interface CaptionTrack {
  baseUrl: string;
  languageCode?: string;
  kind?: string;
}

function decodeXml(text: string) {
  return text
    .replace(/&amp;#39;|&#39;/g, "'")
    .replace(/&amp;quot;|&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Plain transcript text, capped at `maxChars`. Null when the video has no usable captions. */
export async function fetchTranscriptText(videoId: string, maxChars = 12_000): Promise<string | null> {
  try {
    const player = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": IOS_USER_AGENT, "accept-language": "en-US,en" },
      body: JSON.stringify({ videoId, context: IOS_CONTEXT }),
      cache: "no-store",
    }).then((response) => (response.ok ? response.json() : null));

    const tracks: CaptionTrack[] = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
    if (tracks.length === 0) return null;
    // English first; a human-authored track beats the auto-generated one.
    const score = (track: CaptionTrack) =>
      (track.languageCode?.startsWith("en") ? 2 : 0) + (track.kind === "asr" ? 0 : 1);
    const track = [...tracks].sort((a, b) => score(b) - score(a))[0];

    const body = await fetch(`${track.baseUrl}&fmt=json3`, {
      headers: { "user-agent": IOS_USER_AGENT },
      cache: "no-store",
    }).then((response) => (response.ok ? response.text() : ""));
    if (!body) return null;

    let text: string;
    if (body.trimStart().startsWith("<")) {
      text = [...body.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((match) => decodeXml(match[1])).join(" ");
    } else {
      const data = JSON.parse(body) as { events?: { segs?: { utf8?: string }[] }[] };
      text = (data.events ?? []).flatMap((event) => event.segs ?? []).map((seg) => seg.utf8 ?? "").join("");
    }
    text = text.replace(/\s+/g, " ").trim();
    return text ? text.slice(0, maxChars) : null;
  } catch {
    return null;
  }
}
