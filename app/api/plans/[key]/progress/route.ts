import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { changePlanLesson } from "@/lib/plans/store";
import { type GradableQuestion, gradeQuiz } from "@/lib/quiz/grade";

const lessonKey = z.string().max(20);

const bodySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("complete"), lessonKey }),
  // Answers, never a score: the grade is computed here, against the quiz stored on the plan.
  z.object({
    type: z.literal("quiz"),
    lessonKey,
    answers: z.record(z.string().max(20), z.string().max(20)).refine((answers) => Object.keys(answers).length <= 10),
    attemptId: z.uuid(),
  }),
]);

type Outcome = { saved: true; score?: number; total?: number } | { noQuiz: true };

/**
 * Completion and quiz grades for one lesson of the learner's own plan. Writes are race-safe and
 * monotonic: completion is kept once set and the best grade is kept, so a retried or out-of-order
 * request cannot lower either.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/plans/[key]/progress">) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid update" }, { status: 400 });
  const body = parsed.data;
  const { key } = await params;
  const now = new Date().toISOString();

  const outcome = await changePlanLesson<Outcome>(userId, key, body.lessonKey, (lesson) => {
    if (body.type === "complete") {
      return { fields: lesson.completedAt ? null : { completedAt: now }, result: { saved: true as const } };
    }
    const questions = (lesson.quiz?.questions ?? []) as unknown as GradableQuestion[];
    if (!questions.length) return { fields: null, result: { noQuiz: true as const } };
    const grade = gradeQuiz(questions, body.answers);
    return {
      fields: {
        quizScore: Math.max(lesson.quizScore ?? 0, grade.score),
        quizTotal: grade.total,
        completedAt: lesson.completedAt ?? now,
      },
      result: { saved: true as const, ...grade },
    };
  });

  if (!outcome) return Response.json({ error: "Not found" }, { status: 404 });
  if ("noQuiz" in outcome) return Response.json({ error: "This lesson has no quiz yet" }, { status: 409 });
  return Response.json(outcome);
}
