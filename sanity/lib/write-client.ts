import "server-only";

import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";

/**
 * Server-only client with an Editor token, for learner state (AGENTS.md §7): the only writer in the
 * web app, used only by `/api/progress` and the progress reads beside it. Content stays read-only.
 */
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: requireToken(),
  useCdn: false,
  perspective: "published",
});

function requireToken() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) throw new Error("Missing environment variable: SANITY_API_WRITE_TOKEN");
  return token;
}
