import { auth, currentUser } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { IDEAS_PER_DAY } from "@/lib/ideas/constants";
import { PayloadTooLargeError, readJson, rejectCrossSite } from "@/lib/ideas/request";
import { newIdeaSchema } from "@/lib/ideas/validation";
import { getPostHogClient } from "@/lib/posthog-server";
import { getWriteClient } from "@/sanity/lib/write-client";

/**
 * POST /api/ideas — a signed-in learner submits an idea.
 *
 * The learner controls title, description and kind only. Everything else is set here: the id, the
 * author, the timestamps, and `moderation: "pending"`, so nothing a learner posts is public until
 * the team approves it in the Studio.
 */
export async function POST(request: Request) {
  const refused = rejectCrossSite(request);
  if (refused) return refused;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to post an idea." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await readJson(request);
  } catch (error) {
    const status = error instanceof PayloadTooLargeError ? 413 : 400;
    return NextResponse.json({ error: "The request body could not be read." }, { status });
  }

  const parsed = newIdeaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the idea and try again." },
      { status: 400 },
    );
  }

  const client = getWriteClient();

  // Rate limit from the dataset itself, so it holds across serverless instances.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recent = await client.fetch<number>(
    `count(*[_type == "idea" && authorId == $userId && createdAt > $since])`,
    { userId, since },
  );
  if (recent >= IDEAS_PER_DAY) {
    return NextResponse.json(
      { error: `You can post ${IDEAS_PER_DAY} ideas a day. Try again tomorrow.` },
      { status: 429 },
    );
  }

  const user = await currentUser();
  const authorName = displayName(user?.firstName, user?.lastName);
  const now = new Date().toISOString();
  const id = `idea.${randomUUID()}`;

  await client.create({
    _id: id,
    _type: "idea",
    title: parsed.data.title,
    description: parsed.data.description,
    kind: parsed.data.kind,
    status: "open",
    origin: "community",
    moderation: "pending",
    authorId: userId,
    authorName,
    createdAt: now,
  });

  getPostHogClient()?.capture({
    distinctId: userId,
    event: "idea_submitted",
    properties: { idea_id: id, kind: parsed.data.kind },
  });

  return NextResponse.json(
    {
      idea: {
        _id: id,
        title: parsed.data.title,
        description: parsed.data.description,
        kind: parsed.data.kind,
        status: "open",
        origin: "community",
        moderation: "pending",
        authorName,
        createdAt: now,
        votes: 0,
        hasVoted: false,
      },
    },
    { status: 201 },
  );
}

/** First name and last initial, never an email. Falls back to a neutral label. */
function displayName(first?: string | null, last?: string | null) {
  const safe = (value?: string | null) => (value ?? "").replace(/[^\p{L}\p{M}' -]/gu, "").trim();
  const firstName = safe(first).slice(0, 24);
  const initial = safe(last).charAt(0);
  if (!firstName) return "Learner";
  return initial ? `${firstName} ${initial.toUpperCase()}.` : firstName;
}
