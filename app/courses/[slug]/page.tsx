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
import { resumeFor } from "@/lib/progress/resume";
import { coursesHref } from "@/lib/routes";
import { getLearnerProgress } from "@/sanity/lib/progress";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import { COURSE_BY_SLUG_QUERY, COURSE_SLUGS_QUERY } from "@/sanity/lib/queries";

async function getCourse(slug: string) {
  return sanityFetch({
    query: COURSE_BY_SLUG_QUERY,
    params: { slug },
    tags: [CACHE_TAGS.course, CACHE_TAGS.lesson],
  });
}

/** Every course slug, so course pages can be built ahead of time. */
export async function generateStaticParams() {
  const courses = await sanityFetch({ query: COURSE_SLUGS_QUERY, tags: [CACHE_TAGS.course] });

  return courses
    .filter((course) => course.slug !== null)
    .map((course) => ({ slug: course.slug as string }));
}

/** The course's title and summary as the page title and description. */
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

/** A course: hero, what you'll learn, curriculum, and the learner's own progress when signed in. */
export default async function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  const { slug } = await params;
  const course = await getCourse(slug);

  if (!course) notFound();

  const modules = course.modules ?? [];
  const outcomes = course.learningOutcomes ?? [];

  // Signed out, progress is null and "continue" is simply the first lesson.
  const progress = await getLearnerProgress();
  const resume = resumeFor(
    modules.flatMap((module) => module.lessons ?? []),
    progress,
  );
  const continueHref = resume.href;
  // Watching a lesson counts as enrolling: the learner has clearly started the course.
  const enrollState = !progress
    ? "signed-out"
    : progress.enrolled.has(course._id) || resume.started
      ? "enrolled"
      : "not-enrolled";

  return (
    <PageFrame header={<SiteHeader activeHref={coursesHref} />}>

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

      <main id="main" className="relative flex flex-1 flex-col px-6 pt-11 pb-8 sm:px-12 xl:px-18">
        <Breadcrumbs
          items={[
            { label: "All Courses", href: coursesHref },
            { label: course.title ?? "Course" },
          ]}
        />

        <div className="mt-10 flex flex-col gap-14">
          <CourseHero
            course={course}
            continueHref={continueHref}
            enrollState={enrollState}
            percentComplete={resume.percent}
            started={resume.started}
          />

          {outcomes.length > 0 && <LearningOutcomes outcomes={outcomes} />}

          {modules.length > 0 && (
            <CourseContent modules={modules} durationSeconds={course.durationSeconds} />
          )}
        </div>

        <CourseProgressBar
          percentComplete={resume.percent}
          continueHref={continueHref}
          courseSlug={slug}
          className="mt-14"
        />
      </main>

    </PageFrame>
  );
}
