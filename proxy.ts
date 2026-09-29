import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Private surfaces (AGENTS.md §5): learner pages, plans, and their write routes, including the Ideas
 * board's post and vote routes (the page itself is public). Browsing stays public. Each route
 * handler checks the session again itself.
 */
const isPrivate = createRouteMatcher([
  "/my-learning(.*)",
  "/plans(.*)",
  "/api/progress(.*)",
  "/api/enroll(.*)",
  "/api/plans(.*)",
  "/api/ideas(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isPrivate(request)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
