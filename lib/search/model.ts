import "server-only";

import { createOpenAI, openai } from "@ai-sdk/openai";

/**
 * Which LLM runs search. Groq (open-weight gpt-oss, OpenAI-compatible API) whenever GROQ_API_KEY is
 * set; `SEARCH_PROVIDER=openai` restores OpenAI. `SEARCH_MODEL` overrides the model on either.
 */
export type SearchProvider = "groq" | "openai";

/** Which provider runs search: Groq when its key is set (unless SEARCH_PROVIDER says otherwise), else OpenAI. */
export function searchProvider(): SearchProvider {
  if (process.env.SEARCH_PROVIDER === "openai") return "openai";
  if (process.env.SEARCH_PROVIDER === "groq" || process.env.GROQ_API_KEY) return "groq";
  return "openai";
}

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY ?? "",
});

/**
 * gpt-oss-20b by default on Groq: fast, and its rate limit is counted separately from the plan
 * builder's gpt-oss-120b, so the two features do not starve each other.
 */
export function searchModel() {
  if (searchProvider() === "openai") {
    return openai(process.env.SEARCH_MODEL || process.env.OPENAI_SEARCH_MODEL || "gpt-5");
  }
  if (!process.env.GROQ_API_KEY) throw new Error("Missing environment variable: GROQ_API_KEY");
  return groq.chat(process.env.SEARCH_MODEL || "openai/gpt-oss-20b");
}

/**
 * Groq's free tier caps each model separately: 8,000 tokens a minute (Qwen: 7,000 input) and
 * 200,000 a day, shared with the plan builder. A search is two calls of ~5k tokens — write the
 * GROQ, then answer — and each has a fallback chain for when a model is capped.
 * `SEARCH_MODEL` pins both calls to one model instead.
 */
export function groqSearchModels() {
  if (!process.env.GROQ_API_KEY) throw new Error("Missing environment variable: GROQ_API_KEY");
  const pinned = process.env.SEARCH_MODEL;
  if (pinned) return { query: [groq.chat(pinned)], answer: [groq.chat(pinned)] };
  return {
    // The strongest model writes the GROQ first: smaller models more often emit tool-call arguments
    // that fail to parse (GROQ is quote-heavy), which Groq rejects as `tool_use_failed`.
    query: ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"].map((id) => groq.chat(id)),
    answer: ["openai/gpt-oss-20b", "qwen/qwen3.8-27b"].map((id) => groq.chat(id)),
  };
}

/** A capped or over-large request on one model: worth trying the next model, not retrying this one. */
export function isModelCapacityError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /tokens per day|requests per day|Request too large|tool_use_failed|Failed to parse tool call/i.test(message);
}

/** Shallow reasoning keeps a search fast; `textVerbosity` exists only on OpenAI's Responses API. */
export function searchProviderOptions() {
  return searchProvider() === "openai"
    ? { openai: { reasoningEffort: "low" as const, textVerbosity: "low" as const } }
    : { openai: { reasoningEffort: "low" as const } };
}
