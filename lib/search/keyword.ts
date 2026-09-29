import "server-only";

import { formatTimestamp } from "@/lib/format";
import { client } from "@/sanity/lib/client";
import type { ModelHit } from "./types";

/** Words that carry no topic, dropped before matching. */
const STOPWORDS = new Set(
  "a an and are as at be by can do does for from how i in is it me my of on or the to what when where which who why with you your".split(" "),
);

/** At most this many deterministic hits join a result list. */
const MAX_HITS = 20;

/** Lowercase topic words from a plain-English query, deduped, at most six. */
export function queryTerms(query: string): string[] {
  const words = query.toLowerCase().match(/[a-z0-9][a-z0-9+#.-]*/g) ?? [];
  return [...new Set(words.map((word) => word.replace(/[.-]+$/, "")).filter((word) => word.length > 1 && !STOPWORDS.has(word)))].slice(0, 6);
}

/** A keyword hit, flagged strong when it is a chapter moment, or matched every term or the title. */
export type KeywordHit = ModelHit & { strong: boolean };

interface LessonMatch {
  _id: string;
  /** The terms (as patterns) that matched anywhere in the lesson. */
  matched: string[];
  inTitle: number;
  inPoints: number;
  inNotes: number;
}

interface ChapterMatch {
  url: string;
  hits: { startSeconds: number; label: string; n: number }[];
}

/**
 * A deterministic, model-free pass over the same content search covers: token matching (every
 * keyword wildcarded, any term counts) over lesson titles, key points and notes, plus video chapter
 * labels for moments (AGENTS.md §11). It backs up the model, whose single Groq step can miss.
 *
 * Only ids and chapter seconds come back; the route grounds every hit through the same dataset read
 * as the model's, so nothing here is shown unverified. A lesson must match at least half the terms,
 * and a chapter the whole query (or two terms of a longer one), which keeps broad words from
 * flooding the results. Ranked by specificity: a title hit beats a key point, which beats notes.
 */
export async function keywordHits(query: string): Promise<KeywordHit[]> {
  const words = queryTerms(query);
  if (!words.length) return [];
  const terms = words.map((word) => `${word}*`);

  const [lessons, videos] = await Promise.all([
    client.fetch<LessonMatch[]>(
      `*[_type == "lesson" && count($terms[^.title match @ || ^.keyPoints[] match @ || pt::text(^.notes) match @]) > 0]{
        _id,
        "matched": $terms[^.title match @ || ^.keyPoints[] match @ || pt::text(^.notes) match @],
        "inTitle": count($terms[^.title match @]),
        "inPoints": count($terms[^.keyPoints[] match @]),
        "inNotes": count($terms[pt::text(^.notes) match @])
      }`,
      { terms },
    ),
    client.fetch<ChapterMatch[]>(
      `*[_type == "video" && count(chapters[count($terms[^.label match @]) > 0]) > 0]{
        url,
        "hits": chapters[count($terms[^.label match @]) > 0]{startSeconds, label, "n": count($terms[^.label match @])}
      }`,
      { terms },
    ),
  ]);

  // The best chapter per video, if it covers the query well enough.
  const needed = terms.length === 1 ? 1 : Math.min(terms.length, 2);
  const moments = new Map<string, { startSeconds: number; label: string; n: number }>();
  for (const video of videos) {
    const best = [...video.hits].sort((a, b) => b.n - a.n || a.startSeconds - b.startSeconds)[0];
    if (best && best.n >= needed) moments.set(video.url, best);
  }
  const lessonByUrl = moments.size
    ? await client.fetch<{ _id: string; videoUrl: string }[]>(`*[_type == "lesson" && videoUrl in $urls]{_id, videoUrl}`, {
        urls: [...moments.keys()],
      })
    : [];
  const momentOf = new Map(lessonByUrl.map((lesson) => [lesson._id, moments.get(lesson.videoUrl)!]));

  const shown = (patterns: string[]) => patterns.map((pattern) => `“${pattern.replace(/\*$/, "")}”`).join(", ");
  const scored = lessons
    .map((lesson) => {
      const coverage = new Set(lesson.matched).size / terms.length;
      const moment = momentOf.get(lesson._id);
      const score = coverage * 10 + lesson.inTitle * 3 + lesson.inPoints * 2 + lesson.inNotes + (moment ? moment.n * 3 : 0);
      return { lesson, coverage, moment, score };
    })
    .filter(({ coverage, moment }) => coverage >= 0.5 || moment)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_HITS);

  // A lesson whose video has a matching chapter but no text match of its own still counts.
  for (const [lessonId, moment] of momentOf) {
    if (scored.length >= MAX_HITS || scored.some((item) => item.lesson._id === lessonId)) continue;
    scored.push({ lesson: { _id: lessonId, matched: [], inTitle: 0, inPoints: 0, inNotes: 0 }, coverage: 0, moment, score: moment.n * 3 });
  }

  return scored.map(({ lesson, coverage, moment }, index) => ({
    strong: Boolean(moment) || coverage === 1 || lesson.inTitle > 0,
    lessonId: lesson._id,
    kind: moment ? "video" : "lesson",
    reason: moment
      ? `The chapter “${moment.label}” at ${formatTimestamp(moment.startSeconds)} covers it.`
      : `Matches ${shown(lesson.matched)}${lesson.inTitle ? " in the title" : ""}.`,
    rank: index + 1,
    startSeconds: moment ? moment.startSeconds : null,
    momentLabel: moment ? moment.label : null,
  }));
}

/**
 * Merges both passes, ranking agreement first:
 * 1. lessons both found, ordered by keyword specificity (a title with the exact concept beats a
 *    broad hit, AGENTS.md §11); they gain the chapter moment, since a lesson that matches both ways
 *    is shown as its video moment
 * 2. the keyword pass's own top hits (a chapter moment, or every term matched)
 * 3. the model's remaining hits, then the keyword pass's remaining hits
 * so an exact match is never ranked below a guess neither pass agrees on.
 */
export function mergeHits(model: ModelHit[], keyword: KeywordHit[]): ModelHit[] {
  const keywordById = new Map(keyword.map((hit) => [hit.lessonId, hit]));
  const modelIds = new Set(model.map((hit) => hit.lessonId));
  const ordered = [...model].sort((a, b) => a.rank - b.rank);

  const agreed = ordered
    .filter((hit) => keywordById.has(hit.lessonId))
    .sort((a, b) => keywordById.get(a.lessonId)!.rank - keywordById.get(b.lessonId)!.rank)
    .map((hit) => {
      const extra = keywordById.get(hit.lessonId)!;
      return hit.kind === "lesson" && extra.kind === "video"
        ? { ...hit, kind: "video" as const, startSeconds: extra.startSeconds, momentLabel: extra.momentLabel }
        : hit;
    });
  const strong = keyword.filter((hit) => !modelIds.has(hit.lessonId) && hit.strong);
  const strongIds = new Set(strong.map((hit) => hit.lessonId));
  const modelOnly = ordered.filter((hit) => !keywordById.has(hit.lessonId));
  const keywordRest = keyword.filter((hit) => !modelIds.has(hit.lessonId) && !strongIds.has(hit.lessonId));

  return [...agreed, ...strong, ...modelOnly, ...keywordRest].map(({ lessonId, kind, reason, startSeconds, momentLabel }, index) => ({
    lessonId,
    kind,
    reason,
    rank: index + 1,
    startSeconds,
    momentLabel,
  }));
}
