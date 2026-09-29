import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { expireLearnerCounts } from "@/lib/learners";
import { client } from "@/sanity/lib/client";
import { enrollCourse } from "@/sanity/lib/progress";

const bodySchema = z.object({ courseId: z.string().min(1).max(200) });

/** Enrolls the signed-in learner in a course. The learner comes from Clerk; the course must exist. */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in to enroll" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });

  const exists = await client.fetch<string | null>(`*[_type == "course" && _id == $id][0]._id`, { id: parsed.data.courseId });
  if (!exists) return Response.json({ error: "Unknown course" }, { status: 404 });

  await enrollCourse(userId, parsed.data.courseId);
  expireLearnerCounts();
  return new Response(null, { status: 204 });
}
