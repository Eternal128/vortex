import "server-only";

import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";

/**
 * The only credential that can write to the dataset. Server-only by construction (importing this
 * from a client component is a build error), and imported only by route handlers that have
 * already authenticated the learner with Clerk (AGENTS.md §5, §12).
 *
 * Created lazily so pages that never write do not require the token to be configured.
 */
let writeClient: ReturnType<typeof createClient> | null = null;

export function getWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) {
    throw new Error("Missing environment variable: SANITY_API_WRITE_TOKEN");
  }

  writeClient ??= createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
    perspective: "raw",
  });

  return writeClient;
}
