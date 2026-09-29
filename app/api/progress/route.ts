import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { expireLearnerCounts } from "@/lib/learners";
import { type GradableQuestion, gradeQuiz } from "@/lib/quiz/grade";
import { client } from "@/sanity/lib/client";
import { type ProgressUpdate, recordProgress } from "@/sanity/lib/progress";

const lessonId = z.string().min(1).max(200);

const bodySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("position"), lessonId, seconds: z.number().min(0).max(24 * 3600) }),
  z.object({ type: z.literal("complete"), lessonId }),
  // Answers, never a score: the grade is computed here, against the stored quiz.
  z.object({
    type: z.literal("quiz"),
    lessonId,
    answers: z.record(z.string().max(60), z.string().max(60)).refine((answers) => Object.keys(answers).length <= 20),
    attemptId: z.uuid(),
  }),
]);

/**
 * The only write path for learner state (AGENTS.md §7). The learner is whoever Clerk says is
 * signed in — the body never names a user — and the lesson must exist, so no junk references land.
 * Quiz grades are computed on the server from the submitted answers, so a stored grade can never be
 * one the answers did not earn. Answers `{saved: true}` (plus the grade for a quiz) once persisted.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in to save progress" }, { status: 401 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "Invalid progress update" }, { status: 400 });
  const body = parsed.data;

  const lesson = await client.fetch<{ _id: string; quiz: GradableQuestion[] | null } | null>(
    `*[_type == "lesson" && _id == $id][0]{_id, "quiz": *[_type == "quiz" && lesson._ref == ^._id][0].questions[]{_key, options[]{_key, isCorrect}}}`,
    { id: body.lessonId },
  );
  if (!lesson) return Response.json({ error: "Unknown lesson" }, { status: 404 });

  let update: ProgressUpdate;
  let grade: { score: number; total: number } | null = null;
  if (body.type === "quiz") {
    if (!lesson.quiz?.length) return Response.json({ error: "This lesson has no quiz" }, { status: 404 });
    grade = gradeQuiz(lesson.quiz, body.answers);
    update = { type: "quiz", lessonId: body.lessonId, attemptId: body.attemptId, ...grade };
  } else {
    update = body;
  }

  await recordProgress(userId, update);
  expireLearnerCounts();
  return Response.json({ saved: true, ...(grade ?? {}) });
}
