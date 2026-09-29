import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { generatePlanQuiz } from "@/lib/plans/quiz";
import { findLesson, getPlan, updatePlanLesson } from "@/lib/plans/store";
import { fetchTranscriptText } from "@/lib/plans/transcript";

/** Transcript fetch plus one LLM call, the first time a lesson is opened. */
export const maxDuration = 60;

const bodySchema = z.object({ lessonKey: z.string().max(20) });

/**
 * The lesson's quiz, generated on first request from the video's transcript and cached on the plan.
 * Later requests return the stored quiz.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/plans/[key]/quiz">) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const { key } = await params;
  const plan = await getPlan(userId, key);
  const found = plan && findLesson(plan, parsed.data.lessonKey);
  if (!found) return Response.json({ error: "Not found" }, { status: 404 });
  if (found.lesson.quiz?.questions?.length) return Response.json({ quiz: found.lesson.quiz });

  const { lesson } = found;
  try {
    const transcript = await fetchTranscriptText(lesson.videoId);
    const quiz = await generatePlanQuiz({
      seed: `${key}:${lesson._key}`,
      lessonTitle: lesson.title,
      objective: lesson.objective,
      videoTitle: lesson.videoTitle,
      transcript,
    });
    // Sanity arrays need keys; the quiz UI uses them too.
    const stored = {
      questions: quiz.questions.map((question, q) => ({
        _key: `q${q}`,
        _type: "planQuestion",
        prompt: question.prompt,
        options: question.options.map((option, o) => ({ _key: `q${q}o${o}`, _type: "planOption", ...option })),
      })),
    };
    await updatePlanLesson(userId, key, found.target, { quiz: stored as never });
    return Response.json({ quiz: stored });
  } catch {
    return Response.json({ error: "We couldn't write a quiz for this video just now." }, { status: 502 });
  }
}
