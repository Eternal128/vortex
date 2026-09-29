import { urlFor } from "@/sanity/lib/image";

/** A video's credit as the queries project it from its `video` document. */
export interface CreatorSource {
  channel: string | null;
  channelId: string | null;
  channelAvatar: { asset?: { _ref: string } } | null;
}

/** A YouTube channel behind a course, with how many of its videos the course uses. */
export interface Creator {
  id: string;
  name: string;
  /** A square avatar URL on the Sanity CDN, or null to fall back to initials. */
  avatar: string | null;
  videos: number;
}

/**
 * The real creators behind a set of videos, most-used first. Plain values only, so the result can
 * be handed to client components.
 */
export function toCreators(sources: readonly (CreatorSource | null)[] | null | undefined, size = 64): Creator[] {
  const byId = new Map<string, Creator>();
  for (const source of sources ?? []) {
    const name = source?.channel?.trim();
    if (!source || !name) continue;
    const id = source.channelId ?? name;
    const existing = byId.get(id);
    if (existing) {
      existing.videos += 1;
      continue;
    }
    byId.set(id, {
      id,
      name,
      avatar: source.channelAvatar?.asset ? urlFor(source.channelAvatar).width(size).height(size).fit("crop").url() : null,
      videos: 1,
    });
  }
  return [...byId.values()].sort((a, b) => b.videos - a.videos || a.name.localeCompare(b.name));
}

/** "IBM Technology", "IBM Technology and DataMListic", or "IBM Technology and 9 more". */
export function creatorsLabel(creators: readonly Creator[], named = 1): string {
  if (creators.length === 0) return "";
  if (creators.length <= named + 1 && creators.length > 1) {
    return `${creators.slice(0, -1).map((creator) => creator.name).join(", ")} and ${creators.at(-1)!.name}`;
  }
  const shown = creators.slice(0, named).map((creator) => creator.name).join(", ");
  const rest = creators.length - named;
  return rest > 0 ? `${shown} and ${rest} more` : shown;
}
