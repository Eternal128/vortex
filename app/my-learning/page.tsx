import { auth, currentUser } from "@clerk/nextjs/server";
import { ArrowRight, CheckCircle2, ListChecks, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageFrame } from "@/components/layout/page-frame";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonClasses } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { creatorsLabel, toCreators } from "@/lib/creators";
import { pluralize } from "@/lib/format";
import { planHref } from "@/lib/plans/labels";
import { listPlans, type Plan } from "@/lib/plans/store";
import { resumeFor, type CourseResume } from "@/lib/progress/resume";
import { courseHref, coursesHref, lessonHref } from "@/lib/routes";
import type { MY_LEARNING_COURSES_QUERY_RESULT } from "@/sanity.types";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import { getLearnerProgress } from "@/sanity/lib/progress";
import { MY_LEARNING_COURSES_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = { title: "My Learning" };

const MY_LEARNING_HREF = "/my-learning";

type Course = MY_LEARNING_COURSES_QUERY_RESULT[number];

interface CourseState {
  course: Course;
  resume: CourseResume;
  /** Most recent activity in the course, for ordering. */
  lastActive: string;
}

/**
 * The learner's own page, behind sign-in (proxy.ts). Everything here is read from their progress
 * record: courses in progress with a resume point, courses finished, and quiz results.
 */
export default async function MyLearningPage() {
  const { userId } = await auth();
  const [user, learner, courses, plans] = await Promise.all([
    currentUser(),
    getLearnerProgress(),
    sanityFetch({ query: MY_LEARNING_COURSES_QUERY, tags: [CACHE_TAGS.course, CACHE_TAGS.lesson] }),
    userId ? listPlans(userId) : Promise.resolve([] as Plan[]),
  ]);

  const states: CourseState[] = courses.flatMap((course) => {
    const lessons = (course.lessons ?? []).filter((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson));
    const resume = resumeFor(lessons, learner);
    const enrolled = learner?.enrolled.has(course._id) ?? false;
    if (!resume.started && !enrolled) return [];
    const lastActive = lessons
      .map((lesson) => learner?.lessons.get(lesson._id)?.updatedAt ?? "")
      .sort()
      .at(-1) ?? "";
    return [{ course, resume, lastActive }];
  });
  states.sort((a, b) => b.lastActive.localeCompare(a.lastActive));

  const inProgress = states.filter((state) => !state.resume.finished);
  const completed = states.filter((state) => state.resume.finished);

  const lessonTitles = new Map(
    courses.flatMap((course) =>
      (course.lessons ?? []).flatMap((lesson) =>
        lesson ? [[lesson._id, { title: lesson.title, slug: lesson.slug, course: course.title }] as const] : [],
      ),
    ),
  );
  const quizzes = [...(learner?.lessons.values() ?? [])]
    .filter((entry) => entry.quizTotal)
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  const lessonsDone = [...(learner?.lessons.values() ?? [])].filter((entry) => entry.completedAt).length;

  return (
    <PageFrame header={<SiteHeader activeHref={MY_LEARNING_HREF} />}>
      <main id="main" className="flex flex-1 flex-col gap-12 px-6 pt-10 pb-20 sm:px-10 xl:px-12">
        <div>
          <h1 className="text-heading-1 text-neutral-900">
            {user?.firstName ? `Welcome back, ${user.firstName}` : "My Learning"}
          </h1>
          <p className="mt-2 text-body-lg text-neutral-500">
            {states.length || plans.length
              ? "Pick up where you left off."
              : "Your courses, plans, progress and quiz results will show up here."}
          </p>
          {states.length > 0 && (
            <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
              <Stat label="In progress" value={inProgress.length} />
              <Stat label="Completed" value={completed.length} />
              <Stat label={lessonsDone === 1 ? "Lesson finished" : "Lessons finished"} value={lessonsDone} />
              <Stat label={quizzes.length === 1 ? "Quiz taken" : "Quizzes taken"} value={quizzes.length} />
            </dl>
          )}
        </div>

        <section aria-labelledby="my-plans">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="my-plans" className="text-heading-2 text-neutral-900">
              Your plans
            </h2>
            <Link href="/plans/new" className={buttonClasses({ variant: "outline", size: "md" })}>
              <Sparkles className="size-4" strokeWidth={2} aria-hidden />
              Build a plan
            </Link>
          </div>
          {plans.length === 0 ? (
            <p className="mt-3 max-w-2xl text-body-lg text-neutral-500">
              Want to learn something we don&rsquo;t teach yet, like cooking, a language or an instrument?
              Tell Vortex your goal and it builds a course from the best YouTube videos.
            </p>
          ) : (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <PlanCard key={plan.key} plan={plan} />
              ))}
            </ul>
          )}
        </section>

        {states.length === 0 ? (
          <div className="flex flex-col items-start rounded-lg bg-primary-100 p-8">
            <h2 className="text-heading-2 text-neutral-900">You have not started a course yet</h2>
            <p className="mt-2 max-w-xl text-body-lg text-neutral-700">
              Every course is a curated playlist of YouTube lessons with notes and quizzes. Start one
              and it will be waiting here, right where you stopped.
            </p>
            <Link href={coursesHref} className={buttonClasses({ className: "mt-6" })}>
              Browse courses
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
            </Link>
          </div>
        ) : (
          <>
            {inProgress.length > 0 && (
              <Section title="In progress">
                {inProgress.map((state) => (
                  <CourseRow key={state.course._id} state={state} />
                ))}
              </Section>
            )}
            {completed.length > 0 && (
              <Section title="Completed">
                {completed.map((state) => (
                  <CourseRow key={state.course._id} state={state} />
                ))}
              </Section>
            )}
          </>
        )}

        {quizzes.length > 0 && (
          <section aria-labelledby="quiz-results">
            <h2 id="quiz-results" className="flex items-center gap-2 text-heading-2 text-neutral-900">
              <ListChecks className="size-5 text-primary-600" strokeWidth={2} aria-hidden />
              Quiz results
            </h2>
            <ul className="mt-4 divide-y divide-canvas-line rounded-lg border border-neutral-200">
              {quizzes.map((entry) => {
                const lesson = lessonTitles.get(entry.lessonId);
                if (!lesson) return null;
                const perfect = entry.quizScore === entry.quizTotal;
                return (
                  <li key={entry.lessonId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <span className="min-w-0">
                      {lesson.slug ? (
                        <Link
                          href={lessonHref(lesson.slug)}
                          className="rounded-xs text-heading-3 text-neutral-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        >
                          {lesson.title}
                        </Link>
                      ) : (
                        <span className="text-heading-3 text-neutral-900">{lesson.title}</span>
                      )}
                      <span className="block text-body text-neutral-500">{lesson.course}</span>
                    </span>
                    <span
                      className={
                        perfect
                          ? "inline-flex items-center gap-1.5 text-subtitle text-success"
                          : "text-subtitle text-neutral-700"
                      }
                    >
                      {perfect && <CheckCircle2 className="size-4" strokeWidth={2} aria-hidden />}
                      {entry.quizScore} of {entry.quizTotal} correct
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </PageFrame>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const flat = plan.modules.flatMap((module) => module.lessons);
  const done = flat.filter((lesson) => lesson.completedAt).length;
  const percent = flat.length ? Math.round((done / flat.length) * 100) : 0;
  const next = flat.find((lesson) => !lesson.completedAt) ?? flat[0];
  return (
    <li className="lift flex flex-col rounded-lg border border-neutral-200 bg-surface p-5">
      <p className="line-clamp-1 text-small font-semibold text-neutral-500">Your plan · {plan.goal}</p>
      <h3 className="mt-1">
        <Link
          href={planHref(plan.key)}
          className="rounded-xs text-heading-2 text-neutral-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          {plan.title}
        </Link>
      </h3>
      <p className="mt-1 text-body text-neutral-500">
        {done} of {pluralize(flat.length, "lesson")} done
      </p>
      <ProgressBar value={percent} showLabel={false} className="mt-3" />
      {next && (
        <Link href={planHref(plan.key, next._key)} className={buttonClasses({ size: "md", className: "mt-4 w-fit" })}>
          {done === 0 ? "Start" : done === flat.length ? "Review" : "Continue"}
          <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
        </Link>
      )}
    </li>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-body text-neutral-500">{label}</dt>
      <dd className="text-display-2 text-neutral-900 tabular">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const id = `my-learning-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-heading-2 text-neutral-900">
        {title}
      </h2>
      <ul className="mt-4 flex flex-col gap-4">{children}</ul>
    </section>
  );
}

function CourseRow({ state }: { state: CourseState }) {
  const { course, resume } = state;
  const lessonCount = course.lessonCount ?? 0;
  const creators = creatorsLabel(toCreators(course.creators));
  return (
    <li className="lift flex flex-col gap-5 rounded-lg border border-neutral-200 bg-surface p-4 sm:flex-row sm:items-center">
      <span className="relative block aspect-4/3 w-full shrink-0 overflow-hidden rounded-md bg-neutral-100 sm:w-36">
        {course.coverImage?.asset && (
          <Image
            src={urlFor(course.coverImage).width(288).height(216).fit("crop").url()}
            alt=""
            fill
            sizes="144px"
            className="object-cover"
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        {course.category?.title && <p className="text-small font-semibold text-neutral-500">{course.category.title}</p>}
        <h3 className="mt-0.5">
          {course.slug ? (
            <Link
              href={courseHref(course.slug)}
              className="rounded-xs text-heading-2 text-neutral-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {course.title}
            </Link>
          ) : (
            <span className="text-heading-2 text-neutral-900">{course.title}</span>
          )}
        </h3>
        <p className="mt-1 text-body text-neutral-500">
          {[creators && `Videos by ${creators}`, lessonCount && pluralize(lessonCount, "video")]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <ProgressBar value={resume.percent} className="mt-3 max-w-md" />
      </div>
      <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
        {resume.finished ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-subtitle text-success">
              <CheckCircle2 className="size-4" strokeWidth={2} aria-hidden />
              Completed
            </span>
            {course.slug && (
              <Link href={courseHref(course.slug)} className={buttonClasses({ variant: "tertiary", size: "md" })}>
                Review course
              </Link>
            )}
          </>
        ) : (
          resume.href && (
            <>
              <Link href={resume.href} className={buttonClasses({ size: "md" })}>
                {resume.started ? "Continue" : "Start course"}
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </Link>
              {resume.lesson?.title && (
                <span className="max-w-60 truncate text-small text-neutral-500">Next: {resume.lesson.title}</span>
              )}
            </>
          )
        )}
      </div>
    </li>
  );
}
