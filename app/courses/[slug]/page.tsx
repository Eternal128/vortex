import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ViewTracker } from "@/components/analytics/view-tracker";
import { CourseContent } from "@/components/course/course-content";
import { CourseHero } from "@/components/course/course-hero";
import { CourseProgressBar } from "@/components/course/course-progress-bar";
import { LearningOutcomes } from "@/components/course/learning-outcomes";
import { PageFrame } from "@/components/layout/page-frame";
import { SiteHeader } from "@/components/layout/site-header";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { container } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { coursesHref, lessonHref, postHref } from "@/lib/routes";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import { COURSE_BY_SLUG_QUERY, COURSE_SLUGS_QUERY } from "@/sanity/lib/queries";

async function getCourse(slug: string) {
  return sanityFetch({
    query: COURSE_BY_SLUG_QUERY,
    params: { slug },
    tags: [CACHE_TAGS.course, CACHE_TAGS.lesson],
  });
}

export async function generateStaticParams() {
  const courses = await sanityFetch({ query: COURSE_SLUGS_QUERY, tags: [CACHE_TAGS.course] });

  return courses
    .filter((course) => course.slug !== null)
    .map((course) => ({ slug: course.slug as string }));
}

export async function generateMetadata({
  params,
}: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);

  if (!course) return {};

  return {
    title: course.title ?? "Course",
    description: course.summary ?? undefined,
  };
}

export default async function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  const { slug } = await params;
  const course = await getCourse(slug);

  if (!course) notFound();

  const modules = course.modules ?? [];
  const outcomes = course.learningOutcomes ?? [];
  const relatedPosts = course.relatedPosts ?? [];

  // Progress is not tracked yet (AGENTS.md §7), so "continue" means the first lesson.
  const firstLessonSlug = modules.flatMap((module) => module.lessons ?? [])[0]?.slug ?? null;
  const continueHref = firstLessonSlug ? lessonHref(firstLessonSlug) : null;

  return (
    <PageFrame>
      <SiteHeader activeHref={coursesHref} />

      <ViewTracker
        event={ANALYTICS_EVENTS.courseViewed}
        viewKey={slug}
        properties={{
          course_slug: slug,
          module_count: modules.length,
          lesson_count: modules.reduce((total, module) => total + (module.lessons?.length ?? 0), 0),
          level: course.level ?? null,
        }}
      />

      <main id="main" className={cn(container, "relative flex flex-1 flex-col pt-10 pb-16")}>
        <Breadcrumbs
          items={[
            { label: "All Courses", href: coursesHref },
            { label: course.title ?? "Course" },
          ]}
        />

        <div className="mt-10 flex flex-col gap-16">
          <CourseHero course={course} continueHref={continueHref} />

          {outcomes.length > 0 && <LearningOutcomes outcomes={outcomes} />}

          {modules.length > 0 && (
            <CourseContent modules={modules} durationSeconds={course.durationSeconds} />
          )}

          {relatedPosts.length > 0 && (
            <section aria-labelledby="course-field-notes">
              <p className="eyebrow text-neutral-500">Field notes</p>
              <h2
                id="course-field-notes"
                className="mt-3 text-[26px] leading-8 font-semibold tracking-[-0.04em] text-neutral-900"
              >
                Read alongside this course
              </h2>
              <ul className="mt-6 grid gap-4 md:grid-cols-3">
                {relatedPosts.map((post) =>
                  post.slug ? (
                    <li key={post._id}>
                      <Link
                        href={postHref(post.slug)}
                        className="group flex h-full flex-col rounded-lg border border-canvas-line bg-surface p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        <span className="text-[17px] leading-6 font-semibold tracking-[-0.02em] text-neutral-900">
                          {post.title}
                        </span>
                        {post.excerpt && (
                          <span className="mt-2 line-clamp-2 text-[14px] leading-6 text-neutral-500">
                            {post.excerpt}
                          </span>
                        )}
                        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 font-mono text-[12px] text-neutral-500 group-hover:text-neutral-900">
                          Read article <ArrowRight className="size-3.5" strokeWidth={2} aria-hidden />
                        </span>
                      </Link>
                    </li>
                  ) : null,
                )}
              </ul>
            </section>
          )}
        </div>

        <CourseProgressBar
          percentComplete={0}
          continueHref={continueHref}
          courseSlug={slug}
          className="mt-14"
        />
      </main>

    </PageFrame>
  );
}
