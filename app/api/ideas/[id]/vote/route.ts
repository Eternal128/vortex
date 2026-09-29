import { auth } from "@clerk/nextjs/server";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { rejectCrossSite } from "@/lib/ideas/request";
import { ideaIdSchema } from "@/lib/ideas/validation";
import { getPostHogClient } from "@/lib/posthog-server";
import { getWriteClient } from "@/sanity/lib/write-client";

/**
 * POST /api/ideas/[id]/vote — toggles the signed-in learner's upvote on one approved idea.
 *
 * The vote's document id is derived from the idea and a hash of the voter, so one learner can hold
 * at most one vote per idea however many requests arrive, and the raw Clerk id never appears in an
 * id. Returns the fresh count and the learner's state.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/ideas/[id]/vote">) {
  const refused = rejectCrossSite(request);
  if (refused) return refused;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
  }

  const { id } = await params;
  const parsedId = ideaIdSchema.safeParse(id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "Idea not found." }, { status: 404 });
  }
  const ideaId = parsedId.data;

  const client = getWriteClient();

  const idea = await client.fetch<{ _id: string } | null>(
    `*[
      _type == "idea" && _id == $ideaId && !(_id in path("drafts.**")) && !(_id in path("versions.**"))
      && moderation == "approved" && status != "declined"
    ][0]{_id}`,
    { ideaId },
  );
  if (!idea) {
    return NextResponse.json({ error: "Idea not found." }, { status: 404 });
  }

  const voterHash = createHash("sha256").update(userId).digest("hex").slice(0, 24);
  const voteId = `ideaVote.${ideaId.replace(/\./g, "-")}.${voterHash}`;

  const existing = await client.fetch<string | null>(`*[_id == $voteId][0]._id`, { voteId });

  if (existing) {
    await client.delete(voteId);
  } else {
    await client.createIfNotExists({
      _id: voteId,
      _type: "ideaVote",
      idea: { _type: "reference", _ref: ideaId, _weak: true },
      voterId: userId,
    });
  }

  const votes = await client.fetch<number>(
    `count(*[_type == "ideaVote" && idea._ref == $ideaId])`,
    { ideaId },
  );

  getPostHogClient()?.capture({
    distinctId: userId,
    event: "idea_voted",
    properties: { idea_id: ideaId, voted: !existing },
  });

  return NextResponse.json({ votes, hasVoted: !existing });
}
