import "server-only";

import { createHash } from "node:crypto";
import { generateText, Output } from "ai";
import { z } from "zod";

import { planModel, planProviderOptions } from "./model";

const QuizSchema = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string(),
        options: z
          .array(z.object({ text: z.string(), isCorrect: z.boolean(), feedback: z.string() }))
          .min(4)
          .max(4),
      }),
    )
    .min(3)
    .max(3),
});

export type PlanQuiz = z.infer<typeof QuizSchema>;

const SYSTEM = `You write short multiple-choice quizzes that check a learner understood one lesson video.
Rules:
- Use ONLY facts stated in the provided transcript and lesson details. Never add outside facts.
- Exactly 3 questions, each with exactly 4 options and exactly ONE correct option.
- Test understanding of the lesson's main ideas, not trivia like names, dates or exact numbers.
- Wrong options must be plausible misconceptions. No "all of the above" / "none of the above".
- Every option gets feedback of 1-2 sentences: for the correct one, why it is right; for each wrong one, why it is wrong.
- Plain text only. Keep prompts under 25 words and options under 15 words.`;

/** Fisher–Yates driven by sha256(seed): well spread, and stable for the same plan and lesson. */
function shuffle<T>(items: T[], seed: string) {
  const bytes = createHash("sha256").update(seed).digest();
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = bytes.readUInt32BE((i * 4) % (bytes.length - 3)) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function valid(quiz: PlanQuiz) {
  return quiz.questions.every(
    (question) =>
      question.options.filter((option) => option.isCorrect).length === 1 &&
      !/all of the above|none of the above/i.test(question.options.map((option) => option.text).join("|")),
  );
}

/**
 * A quiz for one plan lesson. Grounded in the transcript when there is one; otherwise in the
 * lesson's objective and the video's title, and the caller records that weaker source.
 */
export async function generatePlanQuiz(input: {
  seed: string;
  lessonTitle: string;
  objective: string;
  videoTitle: string;
  transcript: string | null;
}): Promise<PlanQuiz> {
  const prompt = [
    `Lesson: ${input.lessonTitle}`,
    `Objective: ${input.objective}`,
    `Video: ${input.videoTitle}`,
    input.transcript ? `Transcript:\n${input.transcript}` : "Transcript: (not available — ask only about the objective's core idea)",
  ].join("\n\n");

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { output } = await generateText({
      model: planModel(),
      providerOptions: planProviderOptions,
      system: SYSTEM,
      prompt,
      output: Output.object({ schema: QuizSchema }),
    });
    if (!valid(output)) continue;
    return {
      questions: output.questions.map((question, index) => ({
        prompt: question.prompt.trim(),
        options: shuffle(question.options, `${input.seed}:${index}`).map((option) => ({
          text: option.text.trim(),
          isCorrect: option.isCorrect,
          feedback: option.feedback.trim(),
        })),
      })),
    };
  }
  throw new Error("quiz generation did not produce a valid quiz");
}
