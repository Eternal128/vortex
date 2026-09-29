import type { Metadata } from "next";
import Link from "next/link";
import { ViewTracker } from "@/components/analytics/view-tracker";
import { CourseGrid } from "@/components/cards/course-grid";
import { PageFrame } from "@/components/layout/page-frame";
import { SectionHeading } from "@/components/layout/section-heading";
import { container } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/layout/site-header";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { pluralize } from "@/lib/format";
import { CategoryFilter } from "@/components/catalog/category-filter";
import { CATEGORY_PARAM, coursesHref } from "@/lib/routes";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import { percentFor } from "@/lib/progress/resume";
import { getLearnerProgress } from "@/sanity/lib/progress";
import { CATEGORIES_LIST_QUERY, COURSES_LIST_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "All Courses",
  description: "Every course on Vortex, from first principles to production.",
};

/** The catalog: every course, filterable by category, with the learner's progress on started courses. */
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

  // Only courses the learner has started carry a bar; signed out, the map is empty.
  const learner = await getLearnerProgress();
  const progress = new Map<string, number>();
  for (const course of allCourses) {
    const lessons = (course.lessonMeta ?? []).filter((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson));
    const started = lessons.some((lesson) => learner?.lessons.has(lesson._id));
    if (!learner || !started) continue;
    progress.set(course._id, percentFor(lessons, learner));
  }

  return (
    <PageFrame header={<SiteHeader activeHref={coursesHref} />}>

      <ViewTracker
        event={ANALYTICS_EVENTS.catalogViewed}
        properties={{ course_count: courses.length }}
      />

      <main id="main" className={cn(container, "flex flex-1 flex-col pt-16 pb-20")}>
        <SectionHeading
          as="h1"
          eyebrow="Pick your path"
          title="All courses"
          description="YouTube's best teaching, sequenced into courses with progress, notes and quizzes."
          action={
            courses.length > 0 ? (
              <p className="eyebrow text-neutral-500">{pluralize(courses.length, "course")}</p>
            ) : null
          }
        />

        {categories.length > 0 && (
          <div className="mt-10">
            <CategoryFilter
              categories={categories}
              active={active}
              total={allCourses.length}
            />
          </div>
        )}

        {courses.length > 0 ? (
          <div className="mt-10">
            <CourseGrid courses={courses} progress={progress} headingLevel="h2" />
          </div>
        ) : (
          <p className="mt-8 text-body-lg text-neutral-500">
            No courses are published yet.{" "}
            <Link
              href="/"
              className="rounded-xs text-primary-600 underline-offset-4 transition-colors hover:text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
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
