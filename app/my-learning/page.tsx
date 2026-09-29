import { auth, currentUser } from "@clerk/nextjs/server";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CourseGrid } from "@/components/cards/course-grid";
import { MapArt } from "@/components/illustrations/line-art";
import { PageFrame } from "@/components/layout/page-frame";
import { SectionHeading } from "@/components/layout/section-heading";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonClasses } from "@/components/ui/button";
import { container } from "@/lib/layout";
import { coursesHref, myLearningHref, searchPageHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import { COURSES_LIST_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "My Learning",
  robots: { index: false },
};

/**
 * Presentational (AGENTS.md §7) and signed-in only: the session is checked here. Learner progress
 * records are not built yet, so "continue" is an honest empty state rather than invented data.
 */
export default async function MyLearningPage() {
  const { userId } = await auth();
  if (!userId) {
    const signIn = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in";
    redirect(`${signIn}?redirect_url=${encodeURIComponent(myLearningHref)}`);
  }

  const [user, courses] = await Promise.all([
    currentUser(),
    sanityFetch({ query: COURSES_LIST_QUERY, tags: [CACHE_TAGS.course, CACHE_TAGS.lesson] }),
  ]);

  const name = user?.firstName?.trim();

  return (
    <PageFrame>
      <SiteHeader activeHref={myLearningHref} />

      <main id="main" className={cn(container, "flex flex-1 flex-col pt-16 pb-24")}>
        <SectionHeading
          as="h1"
          eyebrow="My Learning"
          title={name ? `Welcome back, ${name}.` : "Welcome back."}
        />

        <section
          aria-labelledby="continue-heading"
          className="mt-12 flex flex-col items-start gap-8 rounded-xl border border-canvas-line bg-surface p-8 shadow-sm sm:flex-row sm:items-center sm:p-10"
        >
          <MapArt className="w-40 shrink-0 text-neutral-900" />
          <div className="flex-1">
            <p className="eyebrow text-neutral-500">Continue where you left off</p>
            <h2 id="continue-heading" className="mt-3 text-[24px] leading-7 font-semibold tracking-[-0.03em] text-neutral-900">
              Your in-progress lessons will show up here.
            </h2>
            <p className="mt-3 max-w-[56ch] text-[15px] leading-6 text-neutral-500">
              Pick a path to begin, or search for the exact moment a topic is taught.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={coursesHref} className={buttonClasses({ size: "lg" })}>
                Browse courses <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </Link>
              <Link href={searchPageHref} className={buttonClasses({ variant: "tertiary", size: "lg" })}>
                Search lessons
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="all-paths" className="mt-20">
          <p className="eyebrow text-neutral-500">Pick your path</p>
          <h2 id="all-paths" className="mt-3 text-[28px] leading-[1.1] font-semibold tracking-[-0.04em] text-neutral-900 sm:text-[34px]">
            All courses
          </h2>
          <CourseGrid courses={courses} className="mt-10" />
        </section>
      </main>
    </PageFrame>
  );
}
