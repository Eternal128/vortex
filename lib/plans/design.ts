import "server-only";

import { generateText, Output } from "ai";
import { z } from "zod";

import { planModel, planProviderOptions } from "./model";

export const LEVELS = ["new", "some", "advanced"] as const;
export const PACES = ["15", "30", "60"] as const;
export type Level = (typeof LEVELS)[number];
export type Pace = (typeof PACES)[number];

const LEVEL_TEXT: Record<Level, string> = {
  new: "completely new to it",
  some: "has some experience",
  advanced: "already fairly advanced",
};
const PACE_TEXT: Record<Pace, string> = {
  "15": "about 15 minutes a day — keep it to 3 modules of 2–3 lessons",
  "30": "about 30 minutes a day — 4 modules of about 3 lessons",
  "60": "about an hour a day — 5 modules of 3–4 lessons",
};

const OutlineSchema = z.object({
  allowed: z.boolean(),
  refusal: z.string(),
  title: z.string(),
  summary: z.string(),
  modules: z
    .array(
      z.object({
        title: z.string(),
        lessons: z
          .array(z.object({ title: z.string(), objective: z.string(), query: z.string() }))
          .max(4),
      }),
    )
    .max(5),
});

export type PlanOutline = z.infer<typeof OutlineSchema>;

const SYSTEM = `You design short, practical self-study courses made of YouTube videos.

First decide if the goal is appropriate. Set allowed=false, with a one-sentence friendly refusal, for goals that are sexual, hateful, harassing, about weapons or explosives, drugs manufacture, self-harm, other illegal activity, or that target a real private person. Otherwise allowed=true and refusal="".

When allowed, build a course that progresses logically from the learner's level:
- title: at most 8 words, no emoji. summary: at most 2 sentences about what they will be able to do.
- 3 to 5 modules, each with 2 to 4 lessons, sized to the learner's pace.
- Each lesson: title (at most 8 words), objective (one sentence starting with a verb), and query: one YouTube search query of 4-8 words that would find a single good tutorial video for exactly that lesson. No quotes, operators or channel names.
- Lessons must not repeat each other. Keep everything practical and safe.

When not allowed, leave title and summary empty and modules empty.`;

/** Designs the syllabus. Returns the refusal as data rather than throwing, so the route can say it kindly. */
export async function designPlan(input: { goal: string; level: Level; pace: Pace }): Promise<PlanOutline> {
  const { output } = await generateText({
    model: planModel(),
    providerOptions: planProviderOptions,
    system: SYSTEM,
    prompt: `Goal: ${input.goal}\nLearner: ${LEVEL_TEXT[input.level]}\nPace: ${PACE_TEXT[input.pace]}`,
    output: Output.object({ schema: OutlineSchema }),
  });
  return output;
}
