import "server-only";

import { compareAndSet } from "@/sanity/lib/cas";
import { writeClient } from "@/sanity/lib/write-client";

/** Plan builds a learner may start in any rolling 24 hours. */
export const PLANS_PER_DAY = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The dot keeps it private, and the owner is in the id, as with progress and plans. */
function quotaId(userId: string) {
  return `planQuota.${userId}`;
}

/**
 * Reserves one plan build for `userId` before any model or YouTube call, and reports whether it was
 * admitted. Every admitted build counts, even one that is refused or fails, so retries cannot run
 * past the limit. The reservation is compare-and-set, so parallel requests each take their own
 * slot: of seven at once, exactly five are admitted.
 */
export async function reservePlanBuild(userId: string): Promise<boolean> {
  const id = quotaId(userId);
  await writeClient.createIfNotExists({ _id: id, _type: "planQuota", userId, admitted: [] });

  return compareAndSet(
    id,
    () => writeClient.fetch<{ _rev: string; admitted: string[] | null } | null>(
      `*[_id == $id][0]{_rev, admitted}`,
      { id },
      { cache: "no-store" },
    ),
    (doc) => {
      const now = Date.now();
      const recent = (doc.admitted ?? []).filter((at) => now - Date.parse(at) < DAY_MS);
      if (recent.length >= PLANS_PER_DAY) return { patch: null, result: false };
      return { patch: (patch) => patch.set({ admitted: [...recent, new Date(now).toISOString()] }), result: true };
    },
  );
}
