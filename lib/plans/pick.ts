import "server-only";

import { generateText, Output } from "ai";
import { z } from "zod";

import { planModel, planProviderOptions } from "./model";
import type { PlanVideo } from "./youtube";

const CANDIDATES_SHOWN = 5;

const PickSchema = z.object({ picks: z.array(z.number().int()) });

const SYSTEM = `You match lessons to YouTube videos. For each lesson you get numbered candidate videos (title and channel).
Pick the ONE candidate that most directly teaches that lesson, in English, for the stated course.
Return -1 when none of them clearly fits (wrong topic, wrong language, a different meaning of the words, clickbait, or unrelated).
Return exactly one number per lesson, in lesson order.`;

/**
 * Chooses a video per lesson from the search candidates, by relevance — search ranking alone matched
 * "Sautéing basics" to a French motocross video. Unique across the plan; -1 means the lesson is dropped.
 */
export async function pickVideos(
  course: string,
  lessons: { title: string; objective: string }[],
  candidates: PlanVideo[][],
): Promise<(PlanVideo | null)[]> {
  const shown = candidates.map((list) => list.slice(0, CANDIDATES_SHOWN));
  const prompt =
    `Course: ${course}\n\n` +
    lessons
      .map(
        (lesson, i) =>
          `Lesson ${i + 1}: ${lesson.title} — ${lesson.objective}\n` +
          (shown[i].length
            ? shown[i].map((video, j) => `  ${j}. "${video.videoTitle}" — ${video.channel}`).join("\n")
            : "  (no candidates)"),
      )
      .join("\n\n");

  let picks: number[] = [];
  try {
    const { output } = await generateText({
      model: planModel(),
      providerOptions: planProviderOptions,
      system: SYSTEM,
      prompt,
      output: Output.object({ schema: PickSchema }),
    });
    picks = output.picks;
  } catch {
    // If the judge is unavailable, fall back to search order rather than failing the plan.
    picks = shown.map((list) => (list.length ? 0 : -1));
  }

  const used = new Set<string>();
  return shown.map((list, i) => {
    const preferred = picks[i] ?? -1;
    if (preferred < 0) return null;
    // The judged pick first; if it is already used elsewhere in the plan, the next unused candidate.
    const ordered = [list[preferred], ...list.filter((_, j) => j !== preferred)].filter(Boolean) as PlanVideo[];
    const video = ordered.find((candidate) => !used.has(candidate.videoId)) ?? null;
    if (video) used.add(video.videoId);
    return video;
  });
}
