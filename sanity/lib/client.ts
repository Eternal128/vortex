import "server-only";

import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";
import { readToken } from "./token";

/**
 * Server-only Sanity client. The dataset is private, so reads carry a token and skip the CDN:
 * every response is authenticated and fresh, with Next's cache sitting in front of it.
 *
 * Never import this from a client component. Use `sanityFetch` from `./fetch` in server
 * components and route handlers.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token: readToken,
  useCdn: false,
  perspective: "published",
});
