import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { client } from "@/sanity/lib/client";
import { recordProgress } from "@/sanity/lib/progress";

const bodySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("position"), lessonId: z.string().min(1).max(200), seconds: z.number().min(0).max(24 * 3600) }),
  z.object({ type: z.literal("complete"), lessonId: z.string().min(1).max(200) }),
  z.object({
    type: z.literal("quiz"),
    lessonId: z.string().min(1).max(200),
    score: z.number().int().min(0).max(50),
    total: z.number().int().min(1).max(50),
  }),
]);

/**
 * The only write path for learner state (AGENTS.md §7). The learner is whoever Clerk says is
 * signed in — the body never names a user — and the lesson must exist, so no junk references land.
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
  if (parsed.data.type === "quiz" && parsed.data.score > parsed.data.total) {
    return Response.json({ error: "Score exceeds total" }, { status: 400 });
  }

  const exists = await client.fetch<string | null>(`*[_type == "lesson" && _id == $id][0]._id`, {
    id: parsed.data.lessonId,
  });
  if (!exists) return Response.json({ error: "Unknown lesson" }, { status: 404 });

  await recordProgress(userId, parsed.data);
  return new Response(null, { status: 204 });
}
