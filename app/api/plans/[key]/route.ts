import { auth } from "@clerk/nextjs/server";

import { deletePlan, getPlan } from "@/lib/plans/store";

/** Deletes one of the signed-in learner's own plans. */
export async function DELETE(_request: Request, { params }: RouteContext<"/api/plans/[key]">) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { key } = await params;
  if (!(await getPlan(userId, key))) return Response.json({ error: "Not found" }, { status: 404 });
  await deletePlan(userId, key);
  return new Response(null, { status: 204 });
}
