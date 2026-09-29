import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/** Private surfaces (AGENTS.md §5): learner pages, plans, and their write routes. Browsing stays public. */
const isPrivate = createRouteMatcher([
  "/my-learning(.*)",
  "/plans(.*)",
  "/api/progress(.*)",
  "/api/enroll(.*)",
  "/api/plans(.*)",
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
