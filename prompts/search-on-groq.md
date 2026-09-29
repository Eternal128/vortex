# Implementation prompt: Move site search from OpenAI to Groq

## Goal

Site search currently fails because the OpenAI account has no credits
(`credit_balance_exhausted`). Run it on Groq (open-weight `gpt-oss`) instead. Nothing the
learner sees should change: the same ranked video and lesson results, grounded in Sanity through
the Context MCP.

## Code and limits inspected

- `app/api/search/route.ts` makes a single `generateText` call through `openai("gpt-5")`
  (OpenAI's Responses API). It has:
  - the MCP tools
  - `stopWhen: stepCountIs(6)`
  - `Output.object({ schema: ModelAnswerSchema })`
  - `providerOptions.openai` with `reasoningEffort` and `textVerbosity`
- **Probe: Groq rejects structured output combined with tools.** Chat completions with `tools`
  plus `response_format` (either `json_schema` or `json_object`) return 400 "json mode cannot
  be combined with tool/function calling". With tools only, the same request works.
- **Size:** the system prompt, including the injected initial context, is about 10.5k
  characters (about 2.6k tokens). A tool loop re-sends it every step, so one search is about
  12–20k tokens.
- **Free-tier limits** (read from the rate-limit headers of this key):
  - `gpt-oss-120b`, `gpt-oss-20b`, and `qwen3.8-27b` each allow 8,000 tokens per minute and
    1,000 requests per day, per model.
  - The plan builder already uses `gpt-oss-120b`.

## Decisions and assumptions

1. **Two-phase search**, forced by the probe:
   - **Phase 1:** the tool loop (MCP tools, at most 4 steps), with no output schema.
   - **Phase 2:** one tool-free call with `Output.object(ModelAnswerSchema)`. It is fed the
     query plus phase 1's messages (the tool calls and their results), and phase 1's final
     text is ignored.
   - Grounding (`groundHits`) and the response shape are unchanged.
2. **The provider is configurable** in a new `lib/search/model.ts`:
   - Groq is the default whenever `GROQ_API_KEY` is set.
   - `SEARCH_PROVIDER=openai` restores the current single-call path exactly, for when OpenAI
     credits are added.
   - `SEARCH_MODEL` overrides the model.
3. **The model is `openai/gpt-oss-20b`.** Its token budget is separate from the plan builder's
   (`gpt-oss-120b`), so the two features do not starve each other, and it answers faster. It
   is switchable through `SEARCH_MODEL`.
4. **A token diet**, to stay as far under the per-minute cap as possible:
   - The step cap drops from 6 to 4.
   - Each tool result is truncated to about 6k characters before phase 2. The tools already
     return filtered matches, so this is a backstop only.
   - The prompts themselves are unchanged, so search quality and rules stay the same.
5. **Rate-limit behavior:** a Groq 429 on the free tier returns the existing "Search is
   unavailable right now. Please try again." (502) and is recorded as an upstream failure in
   PostHog. Nothing is silently retried for a minute while the learner waits.

## Open decision (asked in the approval panel)

- **Groq tier.** The free tier works, but **expect about one search per minute across the
  whole site**, and a stall or failure beyond that.
- **Groq's Developer tier** is pay-as-you-go: add a card at console.groq.com/settings/billing.
  Limits rise to roughly 250k tokens per minute, and a search costs about **US$0.002–0.004**.
- Either way, the code is the same.

## Files to create or change

- New `lib/search/model.ts`: provider selection, the model, and provider options.
- `app/api/search/route.ts`: the two-phase flow for Groq, and the one-phase flow for OpenAI.
- `.env.example`: document `SEARCH_PROVIDER` and `SEARCH_MODEL`, and update the `GROQ_API_KEY`
  comment (it now also powers search).
- `AGENTS.md` §6: the stack line for search changes to "Groq (OpenAI-compatible) via the AI SDK;
  OpenAI optional".

## Security considerations

- The keys stay server-only, and the route stays server-side (AGENTS.md §5).
- No new data reaches the model: the same MCP tools and the same content filter.

## Checks to run

- Typecheck, lint, and build.
- Live check: `POST /api/search` for "context windows", "react hooks", and "docker compose",
  each returning grounded results. Record the latency and token usage per search.
- Search quiz and route matrix regression.

## Manual test steps

1. Search "context windows" from the header. Results appear with video moments and lesson
   cards, and each opens at the right second.
2. On the free tier, a second search within the same minute may be slow, or may ask you to try
   again.

## Deviations and results

- **One tool step on Groq, not a multi-step loop.** The system prompt (~2.6k tokens) plus the
  MCP tool definitions (~3.7k, or ~2.1k with only `groq_query`) put every step at about 5k tokens.
  A second step with results measured 7.9–8.6k, over the free tier's per-request cap (8k, or 7k
  input for Qwen). The model issues its GROQ in one step (several queries allowed), and a second,
  tool-free call writes the structured answer. **It cannot re-query after a miss**, so results
  are thinner and rarely include video moments. `SEARCH_PROVIDER=openai` keeps the full six-step
  loop.
- **Only `groq_query` is exposed on Groq.** The prompt references no other tool:
  `schema_explorer` is redundant with the injected schema, and `array_field_reader` is unused.
- **Model fallback chains**, because free-tier caps are per model:
  - query: gpt-oss-120b → Qwen3 27B → gpt-oss-20b
  - answer: gpt-oss-20b → Qwen3
  - A daily cap, an over-large request, or a malformed tool call moves to the next model.
    `maxRetries` is 1.
  - gpt-oss-20b sometimes wrote tool arguments that failed to parse, so it writes queries only
    as the last resort.
- **The daily cap is real.** gpt-oss-120b reached 195k of its 200k daily tokens, mostly from
  generating 120 course quizzes. Budget is about 30–35 searches a day per model, shared with the
  plan builder.
- **Live:** "context windows" returned 200 in 4.8s (falling back past the capped 120b) with 2
  results, 1 exact and 1 coincidental. Typecheck and lint are clean.
