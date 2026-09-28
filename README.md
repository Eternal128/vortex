<div align="center">
  <br />
    <img src="public/readme/readme-hero.webp" alt="Project Banner">
  <br />

  <div>
    <img src="https://img.shields.io/badge/-Next.js-black?style=for-the-badge&logo=nextdotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/-Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" /><br/>
    <img src="https://img.shields.io/badge/-Sanity-F03E2F?style=for-the-badge&logo=sanity&logoColor=white" />
    <img src="https://img.shields.io/badge/-Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" />
    <img src="https://img.shields.io/badge/-PostHog-8B4513?style=for-the-badge&logo=posthog&logoColor=white" />
  </div>

  <h3 align="center">Vortex | AI-Powered Learning Platform</h3>
</div>

## 📋 Table of Contents

1. ✨ [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🤸 [Quick Start](#quick-start)

## <a name="introduction">✨ Introduction</a>

Vortex is a full-stack learning platform for video content discovery and course administration. On the learner side, users can search video lessons using natural language queries and jump straight to the exact second where a topic is explained. On the administrative side, authors get a management dashboard to curate courses, structure modules, and publish instructor profiles.

## <a name="tech-stack">⚙️ Tech Stack</a>

- **[Next.js](https://nextjs.org/)** — full-stack React framework powering both the learner-facing app and the admin dashboard.
- **[TypeScript](https://www.typescriptlang.org/)** — end-to-end type safety across the codebase.
- **[Tailwind CSS](https://tailwindcss.com/)** — utility-first styling for all components.
- **[Sanity](https://www.sanity.io/)** — headless CMS storing course content, module hierarchies, video metadata, and instructor profiles.
- **[Clerk](https://clerk.com/)** — authentication and role-based access, separating admin workflows from learner accounts.
- **[PostHog](https://posthog.com/)** — product analytics tracking search queries and learner engagement.

## <a name="features">🔋 Features</a>

👉 **Intelligent Video Search**: Search video content using plain-English queries and jump directly to the exact second a topic is discussed.

👉 **Author Admin Dashboard**: Management interface for course creators to build modules, arrange lessons, and manage instructor profiles.

👉 **Role-Based Authentication**: Secure auth via Clerk, with route protection separating student and admin areas.

👉 **Headless CMS Integration**: Real-time content management via Sanity for catalog and video metadata updates.

👉 **Product Analytics**: User tracking and event telemetry via PostHog.

## <a name="quick-start">🤸 Quick Start</a>

**Prerequisites**

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/)

**Installation**

```bash
npm install
```

**Environment Variables**

Copy `.env.example` to `.env.local` and fill in your own credentials:

```env
NEXT_PUBLIC_SANITY_DATASET=
NEXT_PUBLIC_SANITY_PROJECT_ID=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

SANITY_API_READ_TOKEN=
SANITY_CONTEXT_MCP_URL=
OPENAI_API_KEY=
```

Get credentials at [Clerk](https://dashboard.clerk.com), [Sanity](https://sanity.io/manage), and [OpenAI](https://platform.openai.com).

**Running the Project**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

_Originally built by following a [JavaScript Mastery](https://www.youtube.com/@javascriptmastery) tutorial; adapted and maintained here as Vortex._
