import { getLearnerCounts } from "@/lib/learners";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public, read-only learner counts for the live numbers on cards and pages. Only aggregates leave
 * the server: no progress record, user id, or anything per person.
 */
export async function GET() {
  const counts = await getLearnerCounts();
  return Response.json(counts, { headers: { "Cache-Control": "no-store" } });
}
