import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Makes the Clerk session available to every route. Browsing stays public (AGENTS.md §7); the
 * per-learner surfaces check the session where the data is read, as Clerk recommends: My Learning
 * redirects to sign-in in the page, and the Ideas write routes answer 401 in the route handler.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
