# Plan composer: ⌘K on the home page builds a plan, and a welcoming plan page

## Goal

The selling point of Vortex is that a learner describes what they want to learn and gets their own
playlist. Make that the front door:

1. The ⌘K bar in the home hero becomes a plan composer. Submitting it opens the plan builder
   (`/plans/new?goal=…`) with the text already filled in. It no longer goes to `/search`.
2. `/plans/new` feels like opening claude.ai: a calm greeting, one large composer that is focused
   and obviously the place to type, a send button that lights up once there is text, and smooth
   transitions. The generating state reads like a conversation instead of a spinner in a box.

## Skills and docs read

- AGENTS.md (§3 UI tokens, §5 boundaries, §7 plans, §12 Clerk).
- `node_modules/next/dist/docs/` for `PageProps` search params (already used by the page).
- No Sanity, Context or agent skills are needed. Nothing touches search or content.

## Code inspected

- `components/home/hero.tsx`: renders `<SearchForm id="home-search" size="lg" …>` under the hero.
- `components/search/search-form.tsx`: ⌘K focuses the field; submit goes to `searchHref(query)`.
- `components/ui/search-input.tsx`: the `field` and `pill` inputs, with the `⌘ K` kbd hint.
- `components/home/plan-teaser.tsx`: already pushes `/plans/new?goal=…`, so the handoff exists.
- `app/plans/new/page.tsx`: reads `?goal=`, capped at 120 characters, and renders `PlanBuilderForm`.
- `components/plans/plan-builder-form.tsx`: the goal input, example chips, level and pace radios,
  the POST to `/api/plans`, and a timed four-step loading card.
- `app/api/plans/route.ts`: Zod `goal: string().trim().min(3).max(120)`.
- `proxy.ts`: `/plans(.*)` is behind sign-in, and Clerk returns to the original URL, query included.
- `app/my-learning/page.tsx`: the existing `currentUser()` pattern for a first name.

## Decisions and assumptions

- **Only the home hero bar changes.** The header search keeps going to `/search`, so lesson
  search stays one keystroke away on every page. On the home page ⌘K focuses the hero composer
  (as it does today), not the header.
- **Longer, descriptive goals.** People are asked to describe what they want, so the cap rises from
  120 to 300 characters: in the API Zod schema, in the page's `?goal=` slice, and in the textarea.
  The LLM design prompt already embeds the goal as data after the moderation step. 300 characters
  is still small for the model and the stored plan title.
- **Signed-out learners.** Submitting the hero composer still navigates to `/plans/new?goal=…`.
  Clerk sends them to sign in and back with the goal intact. No new auth code is needed.
- **Greeting.** "Good morning, Sam" style, with the first name from `currentUser()` on the
  server, and falling back to "What do you want to learn?". The time of day is computed on the
  client after mount, so the server and client render the same markup, with no hydration mismatch.
- **Composer.** A `textarea` that auto-grows from 3 to about 8 lines. It autofocuses and places the
  caret at the end of any prefilled goal. Enter sends, and Shift+Enter adds a new line. The round
  send button in the bottom right is disabled and muted until there are 3 or more characters, then
  turns ink. Level and pace move into the composer's bottom toolbar as two compact pill selects
  (native `<select>` styled as pills, so they stay accessible and work on mobile). A character count
  appears only near the limit.
- **Suggestions.** Below the composer, 4 example chips written as descriptive goals (e.g. "I want
  to cook healthy dinners for two in under 30 minutes"). Clicking one fills the composer and
  focuses it, and does not auto-submit.
- **Generating state.** The composer slides away, and the learner's goal appears as a right-aligned
  message bubble. Below it, Vortex's reply shows the windmill loader and the four existing steps as a
  checklist: done steps get a check, the current step pulses gently, and later steps are muted. The
  timer and the copy stay as they are today, so it is honest that these are estimates. On an error or
  refusal, the composer returns with the text intact and the message above it.
- **Motion.** A small fade and rise on mount, and a crossfade between the compose and generating
  states, using CSS transitions or keyframes in `globals.css`. All motion is disabled under
  `prefers-reduced-motion`.
- **Visuals.** Tokens only: the off-white canvas, a white hairline card for the composer with
  `shadow-press-soft`, the charcoal send button, amber only for the small "new" sparkle, Geist,
  Geist Mono for the eyebrow, and Geist Pixel for one hero word in the greeting, matching the home
  hero. No new colours.
- **Hero copy.** The hero bar's label and placeholder change to "Describe what you want to
  learn…", with a sparkle icon in place of the magnifier. The `⌘ K` hint stays. `PlanTeaser` lower
  on the home page is left as is.

## Files expected to change

- `components/home/hero.tsx`: use the new `PlanPromptForm` instead of `SearchForm`.
- `components/plans/plan-prompt-form.tsx` (new, client): the hero composer. It handles ⌘K focus,
  and on submit calls `router.push('/plans/new?goal=…')`.
- `components/ui/search-input.tsx`: an optional `icon` prop, so the hero can show a sparkle.
- `app/plans/new/page.tsx`: the greeting layout, the first name from `currentUser()`, and the 300
  character cap.
- `components/plans/plan-builder-form.tsx`: rebuilt as the composer plus the conversation-style
  generating state. The same POST body and the same response handling.
- `app/api/plans/route.ts`: the goal max changes from 120 to 300.
- `app/globals.css`: one `compose-in` keyframe and a reduced-motion guard, if needed.

## Requirements

- The hero composer submit goes to `/plans/new?goal=<encoded>`. An empty submit focuses the field.
- ⌘K / Ctrl+K on the home page focuses the hero composer. Elsewhere it still focuses the header search.
- `/plans/new` autofocuses the composer. Enter submits, Shift+Enter adds a new line, and the send
  button is disabled below 3 characters.
- Level and pace are still sent, with the same defaults (`new`, `30`).
- The generating state shows the goal bubble and the progressing checklist, with `aria-live` on the
  current step.
- Errors and refusals restore the composer with the text preserved.
- The layout is responsive to 360px wide. The composer is full width, and the toolbar pills wrap.
- It supports dark mode through the tokens.

## Security

- No new routes, and no new data leaves the server. The first name is read on the server and
  rendered as text.
- The goal only travels in the URL (`encodeURIComponent`) and in the JSON body. It is validated by
  Zod on the server, which remains the only authority. The client cap is a convenience.
- React escapes all rendering of the goal, and no HTML is injected.
- The existing plan rate limit (5 a day), moderation and same-origin checks are unchanged.

## Acceptance criteria

- Typing "I want to learn to bake sourdough at home" in the home hero and pressing Enter lands on
  `/plans/new` with that text in a focused composer, after sign-in if needed.
- The plan page greets the learner by first name, and the send button activates only with text.
- Submitting shows the goal bubble and the progressing checklist, then opens the new plan.
- The header search on any page still opens `/search` results.

## Checks

- `npx tsc --noEmit`, `npx eslint .`, and `npx next build` in web.
- Screenshots of the home hero and `/plans/new` (light, dark, and 390px mobile) against a local mock.

## Manual test

1. `npm run dev`, open `/`, and press ⌘K. The hero composer focuses.
2. Type a goal and press Enter. Sign in if prompted. You land on `/plans/new` with the goal
   prefilled and focused.
3. Clear the text. The send button is muted. Click a suggestion chip. It fills in and focuses.
4. Press Shift+Enter to add a line, then press Enter to send. Watch the goal bubble and the checklist
   advance. The plan opens when it is ready.
5. Try a disallowed goal. The refusal appears and your text is still in the composer.
6. Use the header search on `/courses`. It still opens `/search`.
