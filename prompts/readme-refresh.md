# Implementation prompt: A README that matches the product

## Goal

Rewrite `README.md` so it describes Vortex as it is today, with real screenshots of the live product. The current README was adapted from the tutorial the project started from.

## What I inspected

- The current `README.md`.
- `app/`: 20 pages and 10 API routes.
- `lib/`: search, plans, progress, quiz, ideas and analytics.
- `proxy.ts`: Clerk protects My Learning, plans, and the progress, enroll, plans and ideas APIs. Browsing stays public.
- `studio/`: 11 document types, the seed, ingest, quiz and context scripts, and the film pipeline.
- `.env.example` and `package.json`.
- The production dataset: 8 categories, 10 courses, 120 lessons, 120 video documents.

## What is wrong today

| README says | Code says |
| --- | --- |
| A tutorial banner image | No real screenshot of Vortex anywhere |
| An "author admin dashboard" in the app | Authors work in Sanity Studio (`studio/`). The app has no admin area. |
| Clerk "role-based access, separating admin workflows" | Clerk gates learner surfaces only (`proxy.ts`). There are no roles. |
| Search runs on OpenAI | Search runs on Groq (gpt-oss) by default; `SEARCH_PROVIDER=openai` switches to OpenAI. The model writes GROQ through the Sanity Context MCP, a keyword pass is merged in, and every hit is grounded against the dataset. |
| Five features | It is missing personal plans (Groq plus the YouTube Data API), per-video quizzes, saved progress and resume, My Learning, the Ideas board, Field notes, the roadmap, and the About film. |
| Env list | It is missing `SANITY_API_WRITE_TOKEN`, `GROQ_API_KEY`, `YOUTUBE_API_KEY`, `SEARCH_PROVIDER` and `SEARCH_MODEL`. |

## Plan

- **Screenshots:** real ones from production, in `public/readme/`.
  - Home, a course page, search results with a video moment, a lesson with the player, a graded quiz, and a personal plan on a phone.
  - Taken with the existing capture setup: a temporary demo account, deleted afterwards.
  - Saved as WebP, about 1440 wide, under 300 KB each.
  - The tutorial images (`readme-hero.webp`, `Thumbnail.webp`) are removed.
- **README sections:**
  - What Vortex is, in one paragraph, plus the live link.
  - Screenshots.
  - Features, each one true to the code.
  - How it works: the two workspaces, the server and client boundary, how search works, how plans work, and the offline ingestion pipeline.
  - Repository layout.
  - Tech stack, as it actually is.
  - Quick start for the web app and the Studio.
  - Environment variables: the full list from `.env.example`, marking which are server-only.
  - Scripts: the web scripts and the Studio scripts.
  - The About film, briefly.
  - The credit line to JavaScript Mastery stays.
- **Style:** plain and specific, with no claims the code doesn't back.

## Files

- `README.md`
- `public/readme/*.webp`: new screenshots, and the two tutorial images removed

## Security

- No keys, tokens or the demo user's sign-in ticket go into the README or the screenshots.
- Screenshots show public catalog data and the temporary demo account only.

## Checks

- Every route, script and env var named in the README exists in the repo.
- The images render on GitHub, via relative paths.
- Commit authored as Eternal128, with no co-author trailer. Then a PR and a merge.
