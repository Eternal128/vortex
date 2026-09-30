import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";

import { CACHE_TAGS } from "@/sanity/lib/fetch";

/**
 * Tagged content queries are cached until expired (`sanity/lib/fetch.ts`), and on Vercel that cache
 * outlives deployments. A Sanity webhook calls this route on publish, so new and edited content
 * shows at once. It only expires cache entries: it reads and writes nothing.
 */
const TAGS_BY_TYPE: Record<string, string[]> = {
  post: [CACHE_TAGS.post],
  course: [CACHE_TAGS.course],
  // Course pages embed their lessons.
  lesson: [CACHE_TAGS.lesson, CACHE_TAGS.course],
  // Course and post cards show their category.
  category: [CACHE_TAGS.category, CACHE_TAGS.course, CACHE_TAGS.post],
};

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    return Response.json({ error: "Revalidation is not configured." }, { status: 500 });
  }

  let parsed: Awaited<ReturnType<typeof parseBody<{ _type?: string }>>>;
  try {
    // Waits for Content Lake consistency, so the refetch after expiry sees the new document.
    parsed = await parseBody<{ _type?: string }>(request, secret, true);
  } catch {
    return Response.json({ error: "Invalid body." }, { status: 400 });
  }

  if (!parsed.isValidSignature) {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  const type = parsed.body?._type;
  if (typeof type !== "string" || !type) {
    return Response.json({ error: "Missing _type." }, { status: 400 });
  }

  const tags = TAGS_BY_TYPE[type] ?? [];
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return Response.json({ revalidated: tags });
}
