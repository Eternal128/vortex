import "server-only";

import type { Patch } from "@sanity/client";

import { writeClient } from "./write-client";

/** Enough for a burst of parallel saves from one learner; each round, one writer wins. */
const ATTEMPTS = 25;

/** Sanity answers a stale `ifRevisionID` with 409. */
function isConflict(error: unknown) {
  return typeof error === "object" && error !== null && "statusCode" in error && error.statusCode === 409;
}

/** Randomized so colliding writers spread out instead of retrying in lockstep. */
const pause = () => new Promise((resolve) => setTimeout(resolve, 20 + Math.random() * 130));

/**
 * Compare-and-set on one document: reads it with `read`, lets `change` decide the next state, and
 * commits only if nobody wrote in between (`ifRevisionID`). On a conflict it re-reads and tries
 * again, so concurrent requests never overwrite each other with stale state. `change` returns null
 * when there is nothing to write. Returns whatever `change` reported.
 */
export async function compareAndSet<Doc extends { _rev: string }, Result>(
  id: string,
  read: () => Promise<Doc | null>,
  change: (doc: Doc) => { patch: (patch: Patch) => Patch; result: Result } | { patch: null; result: Result },
): Promise<Result> {
  for (let attempt = 0; ; attempt += 1) {
    const doc = await read();
    if (!doc) throw new Error(`compareAndSet: ${id} does not exist`);
    const next = change(doc);
    if (!next.patch) return next.result;
    try {
      await next.patch(writeClient.patch(id).ifRevisionId(doc._rev)).commit();
      return next.result;
    } catch (error) {
      if (!isConflict(error) || attempt + 1 >= ATTEMPTS) throw error;
      await pause();
    }
  }
}
