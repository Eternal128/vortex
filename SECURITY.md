# Security notes

How Vortex handles secrets, learner state, and shared quotas, plus the risks it currently accepts.

## Secrets

- **Browser-safe:** `NEXT_PUBLIC_*` values only, meaning the Sanity project and dataset ids, the
  Clerk publishable key, and the PostHog project key.
- **Server-only:** everything else in `.env.example`:
  - the Clerk secret
  - the Sanity read and write tokens
  - the Context MCP URL
  - the Groq, OpenAI, and YouTube keys

  None of these is ever `NEXT_PUBLIC_`, and none reaches the client.
- **The Sanity dataset is private.** Content and learner state are read on the server only.
- **Rotate a key immediately** if it is ever pasted into a chat, a ticket, or a commit.

## Learner state

- **Who can write.** Progress, enrollments, plans, and plan quotas are written only by server
  routes (`/api/progress`, `/api/enroll`, `/api/plans/**`). Each one authenticates with Clerk and
  derives the document id from the Clerk user id. The request body never names a user.
- **Private ids.** Documents carry the owner in a dotted id (`progress.<userId>`,
  `plan.<userId>.<key>`, `planQuota.<userId>`), which keeps them out of public reads.
- **Quiz grades are computed on the server** from the submitted answers, against the stored
  quiz. A client cannot store a score its answers did not earn.
- **Writes are compare-and-set** (`ifRevisionID`, `sanity/lib/cas.ts`). Merges are monotonic:
  - completion is kept once set
  - the best grade is kept
  - quiz submissions carry an `attemptId`, so a retry is not counted twice
- **Plan builds are admitted before any model or YouTube call.** A slot is reserved on
  `planQuota.<userId>` (5 per rolling 24 hours), and it counts refused and failed builds.
- **`/api/learners` returns aggregate counts only.** It never returns ids or documents.

## Accepted risk: the Sanity write token is project-wide

`SANITY_API_WRITE_TOKEN` is an **Editor** robot token.

- **The gap.** Sanity robot tokens apply to the whole project. Roles limited to specific document
  types or datasets need the Enterprise plan. A compromise of the web server's environment would
  therefore give write access to course content as well as learner state.
- **Why it is accepted for now:**
  - the token is server-only
  - every route that uses it authenticates the caller and derives the owner on the server
  - no route writes content
- **Before a production launch:** move learner state (progress, plans, quotas) into a
  **separate Sanity project** and give the web app that project's Editor token. The content
  project's token can then be read-only (Viewer), so a server compromise cannot alter courses.
- **Rotate the write token** whenever a deployment's environment may have been exposed. Rotate it
  at least every 90 days.

## Reporting

Report a suspected vulnerability privately to the repository owner. Do not open a public issue.
