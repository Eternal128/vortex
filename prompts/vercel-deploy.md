# Implementation prompt: A public Vercel link for recruiters

## Goal

A stable, public `*.vercel.app` URL where a recruiter can:

- browse Vortex, search, and watch lessons without an account
- sign up in a minute to try enroll, progress, quizzes, and personal plans

Every future push should redeploy it.

## Skills and docs read

- AGENTS.md §5 (boundaries), §6, and §12 (keys, private dataset, Clerk).
- `node_modules/next/dist/docs/` for deployment. Next 16 on Vercel needs no adapter or config.

## Code and config inspected

- **The app is at the repo root, and `studio/` is a separate workspace.**
  - `tsconfig.json` already excludes `studio`.
  - No web code imports from `studio/`.
  - The Studio deploys on its own (`vortex-learning.sanity.studio`), not on Vercel.
- **`package.json`:** `next build`, Node 20 types. There is no `vercel.json`, and none is needed.
- **Env (`.env.example`):** every variable has a role, and there is nothing to change.
  - Browser-safe: 2 Sanity, 5 Clerk (the publishable key and 4 URLs), and PostHog.
  - Server-only: the Clerk secret, the Sanity read and write tokens, the Context MCP URL, Groq,
    YouTube, and (optionally) OpenAI.
- **Long routes:** `/api/search`, `/api/plans`, and plan quiz generation set `maxDuration = 60`.
  That is within Vercel Hobby limits.
- **Git:**
  - `restyle/coursera-design` is pushed, and PR #1 into `main` is open.
  - `main` is still the pre-redesign baseline, so importing the repo as-is would put the **old**
    app on the production URL.
- **`public/Assets.zip` (7MB, committed)** holds the course brief, prompts, and the seed file.
  Anything in `public/` is served, so it would be downloadable at `/Assets.zip`.
- **Unfinished About page work** (the footer change, `app/about`, and the explainer scripts) is
  uncommitted, so it cannot reach a Git-based deploy. It ships later, once the video is done.

## Decisions and assumptions

1. **Deploy through Vercel's GitHub integration** (recommended):
   - Every push redeploys, and PRs get preview links. It is the standard setup for a portfolio
     link.
   - Only you can do the one-time steps: sign in to Vercel with GitHub, grant access to the
     private repo, and paste the env vars. I give exact steps and verify the result.
   - **The alternative is the Vercel CLI:**
     - I install it, you run `vercel login` once, and I link the project, push the env vars
       (piped through stdin, never printed), and deploy.
     - I would deploy from a clean Git worktree so the unfinished About work is not included.
2. **Merge PR #1 into `main` first** (recommended), so the production URL shows the current app.
   - The alternative is to set Vercel's production branch to `restyle/coursera-design`.
3. **Clerk stays on its development instance.** Clerk production instances need a domain you own,
   so they cannot run on `*.vercel.app`.
   - Dev keys work on any domain. The trade-offs are a small "Development mode" badge and
     development user limits.
   - That is fine for recruiter testing. A custom domain later makes a production instance
     possible.
4. **`.vercelignore`** excludes `studio/` (the web build never uses it) and `public/Assets.zip`,
   so the brief and seed are not published.
5. **A short "Live demo" section in `README.md`:** the URL, what works without an account, and
   what needs sign-up. The steps to redeploy go in this prompt, not the README.

## Files

- New `.vercelignore`.
- `README.md` gets a Live demo section, added after the URL exists.
- No app code changes.

## Your one-time steps (GitHub path)

1. vercel.com → **Sign up with GitHub** (Hobby is free).
2. **Add New → Project** → **Adjust GitHub App Permissions** → grant access to
   `Eternal128/vortex` → **Import**.
3. **Framework:** Next.js (auto-detected). **Root directory:** `./`. Leave the build settings at
   their defaults.
4. **Environment Variables:** paste the contents of `.env.local` into the first field. Vercel
   splits it into variables. Then **Deploy**.
5. Send me the URL, and I will verify it.

## Security considerations

- **Rotate the two keys pasted into this chat before the link goes public:** the Groq key and
  the YouTube key.
  - In Google Cloud, restrict the YouTube key to "YouTube Data API v3". It is server-side, so it
    cannot take a referrer restriction.
- **Server-only variables stay server-only on Vercel.** Only `NEXT_PUBLIC_*` reach the browser,
  the same as locally.
- **The Sanity dataset stays private.** The tokens live only in Vercel's encrypted env, and no
  CORS origin is needed because every fetch is server-side.
- **Writes stay behind Clerk:** progress, enroll, and plans (`proxy.ts`).
- **Public traffic draws on free tiers:**
  - Groq: about 200k tokens a day per model, with the fallback chain.
  - YouTube: 10k quota units a day. One `search.list` call costs 100 units, so roughly 10–15
    plans a day across everyone.
  - Plans are already capped at 5 a day per user.
  - Recruiter-level traffic fits. A spike would show "try again later", not an outage.

## Acceptance criteria

- `https://<project>.vercel.app` serves the redesigned app on the production branch.
- **Signed out:**
  - home, catalog, course, lesson (video plays), search (results render), instructor, and 404
    all work
  - no console errors
- **Sign-up works:** the Clerk modal opens and a new account can sign in.
- **Signed in:**
  - enroll
  - progress saves
  - the quiz grades
  - a plan builds (the live Groq and YouTube keys work)
- `/Assets.zip` returns 404.

## Checks to run

- **Before the deploy:**
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - a `next start` smoke test on the committed tree, in a clean worktree without the About work
- **After the deploy:**
  - the Playwright route matrix against the live URL
  - a live search
  - the Clerk modal loads
  - `/Assets.zip` returns 404
  - a signed-in pass with the temporary demo user: enroll, progress, quiz, and plan, then the
    user's data is deleted

## Manual test (for you, then for recruiters)

1. Open the URL in a private window. Browse a course, play a lesson, and search "context
   window".
2. Sign up with an email. Enroll, watch a minute, let a video end, and take the quiz.
3. Click **Create plan**, type "Bake sourdough bread", and open the plan.
