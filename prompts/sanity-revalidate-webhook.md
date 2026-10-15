# Sanity publish webhook: refresh cached content on Vercel

## Goal

New or edited content in Sanity (posts, courses, lessons, categories) shows on the live site within
seconds of publishing or importing, without a redeploy.

## Why it is broken today

`sanity/lib/fetch.ts` caches every tagged query with `revalidate: false`, which means the result is
kept until someone calls `revalidateTag`. Its comment says "Cache tags a Sanity webhook can
invalidate", but no webhook route exists. On Vercel the Data Cache survives redeploys, so the blog
index cached before the 10 new posts were imported keeps being served. Importing, deploying the
Studio and redeploying the site do not clear it.

## Skills and docs read

- AGENTS.md: §5 boundaries (writes only through server routes, and secrets stay on the server) and §12.
- sanity-best-practices (webhooks, `next-sanity/webhook`'s `parseBody` signature check).
- `node_modules/next/dist/docs/` for `revalidateTag` in Next 16. It takes a profile argument, and
  `lib/learners.ts` already uses `revalidateTag(tag, { expire: 0 })`.

## Code inspected

- `sanity/lib/fetch.ts`: `CACHE_TAGS` = course, lesson, category, post, learners.
- `app/blog/page.tsx` and `app/blog/[slug]/page.tsx`: tags post, course and category.
- `lib/learners.ts`: the existing `revalidateTag` pattern.
- `.env.example`: the canonical env list.

## Plan

- New `app/api/revalidate/route.ts` (POST only, Node runtime):
  - `parseBody<{ _type?: string }>(request, process.env.SANITY_REVALIDATE_SECRET)` from
    `next-sanity/webhook`. Missing secret → 500 (misconfigured). Invalid signature → 401. Unknown or
    missing `_type` → 400.
  - Map `_type` to tags: post → post; course → course; lesson → lesson and course (course pages
    embed lessons); category → category, course and post; instructor → course and lesson (they
    render instructors). Anything else → 200 with `revalidated: []`.
  - Call `revalidateTag(tag, { expire: 0 })` for each tag, and return `{ revalidated: [...tags] }`.
- `.env.example`: add `SANITY_REVALIDATE_SECRET=` with a comment. It is server-only and never
  `NEXT_PUBLIC_`.
- `proxy.ts`: make sure `/api/revalidate` is not behind Clerk auth. The webhook has no session,
  and it is protected by the signature instead.
- README or setup note: how to create the webhook in sanity.io/manage (URL
  `https://<domain>/api/revalidate`, dataset production, trigger on create/update/delete, filter
  `_type in ["post","course","lesson","category","instructor"]`, projection `{_type}`, and a
  secret matching the Vercel env var).

## Security

- The route only expires caches. It reads no content and writes nothing.
- Requests must carry a valid HMAC signature for the shared secret. Without the secret the route
  refuses to act, so it cannot be used to force cache misses.
- No token or secret reaches the browser.

## Acceptance criteria

- An unsigned POST returns 401. A signed `{ "_type": "post" }` returns 200 and
  `{ revalidated: ["post"] }`.
- After the webhook is configured, publishing a post in Studio makes it appear on `/blog` on the
  next request.

## Checks

- `npx tsc --noEmit`, `npx eslint .`, and `npx next build`.
- Locally: POST without a signature → 401. With a signature made by `@sanity/webhook`'s
  `encodeSignatureHeader` → 200.

## Manual test

1. Add `SANITY_REVALIDATE_SECRET` in Vercel (Production), then redeploy.
2. Create the webhook in sanity.io/manage with the same secret.
3. Edit a post title in Studio and publish it. Reload `/blog`, and the new title shows.
