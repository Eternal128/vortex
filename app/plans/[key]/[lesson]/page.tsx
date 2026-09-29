import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/layout/page-frame";
import { SiteHeader } from "@/components/layout/site-header";
import { LessonVideo } from "@/components/lesson/lesson-video";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { PlanLessonClient } from "@/components/plans/plan-lesson-client";
import { buttonClasses } from "@/components/ui/button";
import { planHref } from "@/lib/plans/labels";
import { findLesson, getPlan } from "@/lib/plans/store";
import { cn } from "@/lib/utils";
import { parseVideoUrl } from "@/lib/video";

export const metadata: Metadata = { title: "Plan lesson" };

/** One lesson of the learner's plan: the video on-site, its creator credited, and the quiz. */
export default async function PlanLessonPage({ params }: PageProps<"/plans/[key]/[lesson]">) {
  const { userId } = await auth();
  if (!userId) notFound();
  const { key, lesson: lessonKey } = await params;
  const plan = await getPlan(userId, key);
  const found = plan && findLesson(plan, lessonKey);
  if (!plan || !found) notFound();

  const { lesson, index, flat } = found;
  const previous = flat[index - 1] ?? null;
  const next = flat[index + 1] ?? null;
  const moduleIndex = plan.modules.findIndex((module) => module.lessons.some((entry) => entry._key === lesson._key));
  const label = `${moduleIndex + 1}.${plan.modules[moduleIndex].lessons.findIndex((entry) => entry._key === lesson._key) + 1}`;
  const eventId = `plan:${key}:${lesson._key}`;

  return (
    <PageFrame header={<SiteHeader activeHref="/my-learning" />}>
      <div className="flex flex-1 flex-col lg:flex-row">
        <nav aria-label="Plan lessons" className="border-b border-canvas-line lg:w-72 lg:shrink-0 lg:border-r lg:border-b-0">
          <Link
            href={planHref(key)}
            className="flex items-center gap-2 px-5 pt-6 text-action text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
            Back to plan
          </Link>
          <p className="px-5 pt-3 text-heading-3 text-neutral-900">{plan.title}</p>
          <ol className="mt-3 pb-4">
            {plan.modules.map((module, m) => (
              <li key={module._key}>
                <p className="px-5 pt-3 pb-1 text-small font-semibold text-neutral-500">
                  {m + 1}. {module.title}
                </p>
                <ol>
                  {module.lessons.map((entry) => {
                    const current = entry._key === lesson._key;
                    return (
                      <li key={entry._key}>
                        <Link
                          href={planHref(key, entry._key)}
                          aria-current={current ? "page" : undefined}
                          className={cn(
                            "flex items-start gap-2 px-5 py-2 text-body transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset",
                            current ? "bg-primary-50 font-semibold text-neutral-900" : "text-neutral-700",
                          )}
                        >
                          {entry.completedAt ? (
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.25} aria-label="Completed" />
                          ) : (
                            <span className="mt-1.5 size-2 shrink-0 rounded-full border border-neutral-300" aria-hidden />
                          )}
                          {entry.title}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </li>
            ))}
          </ol>
        </nav>

        <main id="main" className="flex min-w-0 flex-1 flex-col gap-8 px-6 pt-8 pb-12 sm:px-8">
          <Breadcrumbs
            items={[
              { label: "My Learning", href: "/my-learning" },
              { label: plan.title, href: planHref(key) },
              { label: lesson.title },
            ]}
          />
          <header>
            <p className="text-small font-semibold text-neutral-500">Lesson {label}</p>
            <h1 className="mt-1 text-heading-1 text-neutral-900">{lesson.title}</h1>
            <p className="mt-3 max-w-3xl text-body-lg text-neutral-700">{lesson.objective}</p>
          </header>

          <LessonVideo
            lessonId={eventId}
            saveProgress={false}
            lessonTitle={lesson.title}
            lessonSlug={`plan-${key}-${lesson._key}`}
            courseSlug={null}
            lessonLabel={label}
            video={parseVideoUrl(lesson.videoUrl)}
            posterUrl={lesson.thumbnailUrl}
            posterAlt=""
            startSeconds={0}
            durationSeconds={lesson.durationSeconds}
            hasQuiz
            nextHref={next ? planHref(key, next._key) : null}
          />
          <p className="-mt-4 text-body text-neutral-500">
            Video by <span className="font-semibold text-neutral-700">{lesson.channel}</span> · YouTube · &ldquo;{lesson.videoTitle}&rdquo;
          </p>

          <PlanLessonClient
            planKey={key}
            lessonKey={lesson._key}
            eventId={eventId}
            initialQuestions={lesson.quiz?.questions?.length ? (lesson.quiz.questions as never) : null}
            bestScore={lesson.quizScore}
            completed={Boolean(lesson.completedAt)}
            nextHref={next ? planHref(key, next._key) : null}
          />

          <nav aria-label="Lesson navigation" className="flex flex-wrap justify-between gap-4 border-t border-canvas-line pt-6">
            {previous ? (
              <Link href={planHref(key, previous._key)} className={buttonClasses({ variant: "tertiary", size: "md" })}>
                <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
                {previous.title}
              </Link>
            ) : <span />}
            {next ? (
              <Link href={planHref(key, next._key)} className={buttonClasses({ size: "md" })}>
                Next: {next.title}
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </Link>
            ) : (
              <Link href={planHref(key)} className={buttonClasses({ size: "md" })}>
                Back to your plan
              </Link>
            )}
          </nav>
        </main>
      </div>
    </PageFrame>
  );
}
