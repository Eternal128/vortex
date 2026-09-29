import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { findLesson, getPlan, updatePlanLesson } from "@/lib/plans/store";

const bodySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("complete"), lessonKey: z.string().max(20) }),
  z.object({ type: z.literal("quiz"), lessonKey: z.string().max(20), score: z.number().int().min(0).max(10), total: z.number().int().min(1).max(10) }),
]);

/** Completion and quiz scores for one lesson of the learner's own plan. */
export async function POST(request: Request, { params }: RouteContext<"/api/plans/[key]/progress">) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid update" }, { status: 400 });

  const { key } = await params;
  const plan = await getPlan(userId, key);
  const found = plan && findLesson(plan, parsed.data.lessonKey);
  if (!found) return Response.json({ error: "Not found" }, { status: 404 });

  const now = new Date().toISOString();
  if (parsed.data.type === "complete") {
    await updatePlanLesson(userId, key, found.target, { completedAt: found.lesson.completedAt ?? now });
  } else {
    if (parsed.data.score > parsed.data.total) return Response.json({ error: "Score exceeds total" }, { status: 400 });
    await updatePlanLesson(userId, key, found.target, {
      quizScore: Math.max(found.lesson.quizScore ?? 0, parsed.data.score),
      quizTotal: parsed.data.total,
      completedAt: found.lesson.completedAt ?? now,
    });
  }
  return new Response(null, { status: 204 });
}
