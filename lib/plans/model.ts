import "server-only";

import { createOpenAI } from "@ai-sdk/openai";

/**
 * The plan builder's LLM: an open-weight model on Groq's free tier, through its OpenAI-compatible
 * API (no extra SDK). Server-only — the key never reaches the browser.
 */
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY ?? "",
});

export const PLAN_MODEL = process.env.PLAN_MODEL || "openai/gpt-oss-120b";

/** The Groq model that designs plans and writes their quizzes; needs GROQ_API_KEY. */
export function planModel() {
  if (!process.env.GROQ_API_KEY) throw new Error("Missing environment variable: GROQ_API_KEY");
  return groq.chat(PLAN_MODEL);
}

/** gpt-oss reasons before answering; low effort keeps a plan to a few seconds. */
export const planProviderOptions = { openai: { reasoningEffort: "low" as const } };
