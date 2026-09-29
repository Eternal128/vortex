import type { MCPClient } from "@ai-sdk/mcp";
import { auth } from "@clerk/nextjs/server";
import { generateText, Output, stepCountIs } from "ai";
import type { NextRequest } from "next/server";

import { groundHits } from "@/lib/search/ground";
import { keywordHits, mergeHits } from "@/lib/search/keyword";
import { createSearchMcpClient, fetchInitialContext } from "@/lib/search/mcp";
import {
  groqSearchModels,
  isModelCapacityError,
  searchModel,
  searchProvider,
  searchProviderOptions,
} from "@/lib/search/model";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/search/system-prompt";
import {
  ModelAnswerSchema,
  type ModelAnswer,
  SearchRequestSchema,
  type SearchResponse,
  type SearchSort,
} from "@/lib/search/types";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { getPostHogClient } from "@/lib/posthog-server";

/**
 * The search API (AGENTS.md §5): connects to the Sanity Context MCP, injects the schema and the
 * system prompt, calls the LLM, then grounds whatever comes back against the dataset before it is
 * returned. Everything token-bearing stays here — the browser only ever sees the JSON below.
 *
 * The route is read-only: no write token, no mutation tool, and the Context document's filter scopes
 * what the model can even see.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The tool loop needs room to query, re-query on a miss, and answer — but no more. A learner is
 * waiting, and every extra step is another round trip.
 */
const MAX_STEPS = 6;

/**
 * Groq's free tier caps each request at 8,000 tokens a minute, and the system prompt plus the tool
 * definition alone are ~5k. A second tool step (with the first step's results) measured 7.9–8.6k,
 * over the cap, so on Groq the model gets one step: it may issue several queries at once, but it
 * cannot re-query after a miss. `SEARCH_PROVIDER=openai` keeps the full six-step loop.
 */
const GROQ_MAX_STEPS = 1;

/** The only MCP tool the prompt uses; the others cost ~1.6k tokens a step for nothing on Groq. */
const GROQ_TOOLS = ["groq_query"];

/** Per tool result, and in total, when handing phase 1's results to phase 2. */
const RESULT_CHARS = 4_000;
const FINDINGS_CHARS = 8_000;

function clip(value: unknown, max: number) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > max ? `${text.slice(0, max)}… (truncated)` : text;
}


/**
 * Phase 1's tool results as plain text for phase 2. Text rather than replayed tool messages, which
 * some providers reject once no tools are declared — and it caps the size.
 */
/**
 * Runs `call` with each model in turn until one succeeds, moving on only for capacity errors (a
 * daily cap, an over-large request, a malformed tool call). Anything else fails the search.
 */
async function withFallback<M, T>(models: M[], call: (model: M) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (const model of models) {
    try {
      return await call(model);
    } catch (error) {
      if (!isModelCapacityError(error)) throw error;
      lastError = error;
    }
  }
  throw lastError;
}

function findingsText(results: { toolName: string; input: unknown; output: unknown }[]) {
  const blocks = results.map((result, index) => {
    return `Result ${index + 1} — ${result.toolName} ${JSON.stringify(result.input)}\n${clip(result.output, RESULT_CHARS)}`;
  });
  return blocks.join("\n\n").slice(0, FINDINGS_CHARS);
}

const answerOutput = Output.object({ schema: ModelAnswerSchema });

function errorResponse(status: number, error: string) {
  return Response.json({ error }, { status });
}

/**
 * How long the model may take before the keyword results ship on their own. Groq's free tier can
 * take half a minute under load; a learner should not wait that long for results we already have.
 */
const MODEL_BUDGET_MS = 12_000;

/** Shown above keyword-only results, when the model could not answer. */
const KEYWORD_REPLY = "Here are the lessons whose titles, notes and chapters match your words.";

/**
 * Searches in two ways at once and merges them: the model over the Context MCP, and a
 * deterministic keyword and chapter pass (`lib/search/keyword.ts`) that backs it up, since Groq's
 * single tool step can miss or fail. Every hit is then grounded against the dataset. If the model
 * fails, the keyword results still come back; only when both come up empty after a model failure
 * is the search reported as failed.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "Expected a JSON body.");
  }

  const parsedRequest = SearchRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return errorResponse(400, "Expected { query: string, sort?: 'relevance' | 'newest' | 'duration' }.");
  }

  const { query, sort, distinctId, sessionId } = parsedRequest.data;
  const analytics = { distinctId, sessionId };
  const startedAt = Date.now();

  const keywordPass = keywordHits(query).catch((error) => {
    console.error("[api/search] keyword pass failed", error);
    return [];
  });

  let output: ModelAnswer | null = null;
  let modelError: unknown = null;
  const budget = AbortSignal.timeout(MODEL_BUDGET_MS);
  try {
    output = await modelAnswer(query, AbortSignal.any([request.signal, budget]));
  } catch (error) {
    // A learner who navigated away is not a failure. The abort is expected, so it is neither logged
    // as an error nor counted as an upstream outage in PostHog.
    if (request.signal.aborted) return errorResponse(499, "Search was cancelled.");
    // Over budget is not an outage either: the keyword results (or an honest empty state) ship.
    if (budget.aborted) {
      console.warn("[api/search] model over budget; keyword results only");
    } else {
      // The message can carry the MCP URL or a provider payload, so it is logged, never returned.
      console.error("[api/search]", error);
      modelError = error;
    }
  }

  const hits = mergeHits(output?.hits ?? [], await keywordPass);

  if (modelError && hits.length === 0) {
    const message = modelError instanceof Error ? modelError.message : "";
    const unconfigured = message.startsWith("Missing environment variable");

    // Only the coarse reason reaches PostHog — the message itself is as unsafe to send as it is to
    // return.
    await captureSearchFailure({ query, sort }, unconfigured ? "unconfigured" : "upstream", analytics, Date.now() - startedAt);

    if (unconfigured) return errorResponse(500, "Search is not configured.");
    return errorResponse(502, "Search is unavailable right now. Please try again.");
  }

  const results = await groundHits(hits, sort);

  const response: SearchResponse = {
    query,
    sort,
    count: results.length,
    courseCount: new Set(results.map((result) => result.courseSlug)).size,
    reply: output?.reply ?? KEYWORD_REPLY,
    results,
  };

  try {
    await captureSearch(response, analytics, Date.now() - startedAt);
  } catch (error) {
    // Telemetry is never worth failing a search the learner already got results for.
    console.error("[api/search] failed to capture search_performed", error);
  }

  return Response.json(response);
}

/**
 * The model's answer: MCP tools, the injected context, and either the OpenAI tool loop or Groq's
 * two phases (query, then a tool-free structured answer).
 */
async function modelAnswer(query: string, signal: AbortSignal): Promise<ModelAnswer> {
  let mcpClient: MCPClient | null = null;

  try {
    const [client, initialContext] = await Promise.all([
      createSearchMcpClient(),
      fetchInitialContext(),
    ]);
    mcpClient = client;

    // `initial_context` is dropped: its payload is already in the system prompt, so keeping the tool
    // only invites a redundant round trip (§12 — never hand the model more context than it needs).
    const mcpTools = await mcpClient.tools();
    const tools = Object.fromEntries(
      Object.entries(mcpTools).filter(([name]) => name !== "initial_context"),
    );

    const system = buildSystemPrompt(initialContext);
    const prompt = buildUserPrompt(query);
    // Search is latency-sensitive and the reasoning here is shallow: write one GROQ query, rank
    // what comes back. Heavy reasoning pushed a single search past a minute.
    const providerOptions = searchProviderOptions();

    if (searchProvider() === "openai") {
      const { output } = await generateText({
        model: searchModel(),
        system,
        prompt,
        tools,
        stopWhen: stepCountIs(MAX_STEPS),
        output: answerOutput,
        abortSignal: signal,
        providerOptions,
      });
      return output;
    } else {
      // Groq cannot combine tool calling with structured output (400: "json mode cannot be combined
      // with tool/function calling"), so the search runs in two phases.
      const groqModels = groqSearchModels();
      const groqTools = Object.fromEntries(Object.entries(tools).filter(([name]) => GROQ_TOOLS.includes(name)));
      // Phase 1: the model writes its GROQ queries (one step; see GROQ_MAX_STEPS) and they run.
      // One quick retry at most: a capped model will not recover in seconds, the next model might.
      const gathered = await withFallback(groqModels.query, (model) =>
        generateText({
          model,
          system,
          prompt,
          tools: groqTools,
          stopWhen: stepCountIs(GROQ_MAX_STEPS),
          maxRetries: 1,
          abortSignal: signal,
          providerOptions,
        }),
      );
      const findings = findingsText(gathered.steps.flatMap((step) => step.toolResults));
      // Phase 2: the structured answer, tool-free, from what phase 1 found.
      const { output } = await withFallback(groqModels.answer, (model) =>
        generateText({
          model,
          system,
          prompt: `${prompt}\n\nYour searches returned the following. Answer now, using only these results:\n\n${findings || "(no results)"}`,
          output: answerOutput,
          maxRetries: 1,
          abortSignal: signal,
          providerOptions,
        }),
      );
      return output;
    }
  } finally {
    await mcpClient?.close();
  }
}

/** The browser's own PostHog ids, so a server event joins the session it came from. */
interface AnalyticsIdentity {
  distinctId?: string;
  sessionId?: string;
}

/**
 * Resolves who the event belongs to. A signed-in learner is always their Clerk user id — that is
 * what `PostHogUserIdentifier` calls `identify` with, so the server and browser agree on one person.
 * The client-supplied id is the signed-out fallback and is never trusted beyond attribution.
 */
async function resolveIdentity({ distinctId, sessionId }: AnalyticsIdentity) {
  const { userId } = await auth();

  return {
    distinctId: userId ?? distinctId ?? "anonymous",
    signedIn: Boolean(userId),
    // `$session_id` is what stitches this event into the learner's client session, which is what
    // makes "searched, then never opened a lesson" answerable.
    sessionProperties: sessionId ? { $session_id: sessionId } : {},
  };
}

/** "A search performed" is one of the engagement moments §7 asks for. */
async function captureSearch(
  response: SearchResponse,
  identity: AnalyticsIdentity,
  durationMs: number,
) {
  const posthog = getPostHogClient();
  if (!posthog) return;

  const { distinctId, signedIn, sessionProperties } = await resolveIdentity(identity);
  const videoResultCount = response.results.filter((result) => result.kind === "video").length;

  posthog.capture({
    distinctId,
    event: ANALYTICS_EVENTS.searchPerformed,
    properties: {
      ...sessionProperties,
      query: response.query,
      sort: response.sort,
      result_count: response.count,
      course_count: response.courseCount,
      video_result_count: videoResultCount,
      lesson_result_count: response.count - videoResultCount,
      zero_results: response.count === 0,
      duration_ms: durationMs,
      signed_in: signedIn,
    },
  });

  // A route handler is torn down per invocation, and `capture` only enqueues. Without this the send
  // never happens and the event is silently lost.
  await posthog.flush();
}

/** A search that never produced results is as much a signal as one that did. */
async function captureSearchFailure(
  { query, sort }: { query: string; sort: SearchSort },
  reason: "unconfigured" | "upstream",
  identity: AnalyticsIdentity,
  durationMs: number,
) {
  const posthog = getPostHogClient();
  if (!posthog) return;

  try {
    const { distinctId, signedIn, sessionProperties } = await resolveIdentity(identity);

    posthog.capture({
      distinctId,
      event: ANALYTICS_EVENTS.searchFailed,
      properties: {
        ...sessionProperties,
        query,
        sort,
        reason,
        duration_ms: durationMs,
        signed_in: signedIn,
      },
    });

    await posthog.flush();
  } catch (error) {
    // Already on the failure path — analytics must not replace the learner's error with its own.
    console.error("[api/search] failed to capture search_failed", error);
  }
}
