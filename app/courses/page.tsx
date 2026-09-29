import type { Metadata } from "next";
import Link from "next/link";
import { ViewTracker } from "@/components/analytics/view-tracker";
import { CategoryFilter } from "@/components/catalog/category-filter";
import { CourseGrid } from "@/components/cards/course-grid";
import { PageFrame } from "@/components/layout/page-frame";
import { SectionHeading } from "@/components/layout/section-heading";
import { SiteHeader } from "@/components/layout/site-header";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { pluralize } from "@/lib/format";
import { container } from "@/lib/layout";
import { CATEGORY_PARAM, coursesHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import { CATEGORIES_LIST_QUERY, COURSES_LIST_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "All Courses",
  description: "Every course on Vortex, from first principles to production.",
};

export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const [allCourses, categories] = await Promise.all([
    sanityFetch({
      query: COURSES_LIST_QUERY,
      tags: [CACHE_TAGS.course, CACHE_TAGS.lesson],
    }),
    sanityFetch({
      query: CATEGORIES_LIST_QUERY,
      tags: [CACHE_TAGS.category, CACHE_TAGS.course],
    }),
  ]);

  const requested = (await searchParams)[CATEGORY_PARAM];
  const raw = Array.isArray(requested) ? requested[0] : requested;
  // An unknown slug falls back to the full catalog rather than an empty page.
  const active = categories.some((c) => c.slug === raw) ? (raw ?? null) : null;

  const courses = active
    ? allCourses.filter((course) => course.category?.slug === active)
    : allCourses;

  return (
    <PageFrame>
      <SiteHeader activeHref={coursesHref} />

      <ViewTracker
        event={ANALYTICS_EVENTS.catalogViewed}
        properties={{ course_count: courses.length }}
      />

      <main id="main" className={cn(container, "flex flex-1 flex-col pt-16 pb-20")}>
        <SectionHeading
          as="h1"
          eyebrow="Pick your path"
          title="All courses"
          description="Sequenced paths from first principles to production. Every lesson is searchable to the second."
          action={
            courses.length > 0 ? (
              <p className="eyebrow text-neutral-500">{pluralize(courses.length, "course")}</p>
            ) : null
          }
        />

        {categories.length > 0 && (
          <div className="mt-10">
            <CategoryFilter categories={categories} active={active} total={allCourses.length} />
          </div>
        )}

        {courses.length > 0 ? (
          <div className="mt-10">
            <CourseGrid courses={courses} headingLevel="h2" />
          </div>
        ) : (
          <p className="mt-10 text-[17px] leading-7 text-neutral-500">
            No courses are published yet.{" "}
            <Link
              href="/"
              className="rounded-xs text-neutral-900 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Back to the home page
            </Link>
            .
          </p>
        )}
      </main>
    </PageFrame>
  );
}
