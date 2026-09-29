import { auth } from "@clerk/nextjs/server";
import { ArrowRight, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/layout/page-frame";
import { SiteHeader } from "@/components/layout/site-header";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { DeletePlanButton } from "@/components/plans/delete-plan-button";
import { buttonClasses } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatDuration, pluralize } from "@/lib/format";
import { LEVEL_LABELS, PACE_LABELS, planHref } from "@/lib/plans/labels";
import { getPlan } from "@/lib/plans/store";

export const metadata: Metadata = { title: "Your plan" };

/** The learner's own plan: syllabus, progress and a way back in. Owner-only by construction. */
export default async function PlanPage({ params }: PageProps<"/plans/[key]">) {
  const { userId } = await auth();
  if (!userId) notFound();
  const { key } = await params;
  const plan = await getPlan(userId, key);
  if (!plan) notFound();

  const flat = plan.modules.flatMap((module) => module.lessons);
  const done = flat.filter((lesson) => lesson.completedAt).length;
  const percent = flat.length ? Math.round((done / flat.length) * 100) : 0;
  const next = flat.find((lesson) => !lesson.completedAt) ?? flat[0];
  const totalSeconds = flat.reduce((sum, lesson) => sum + (lesson.durationSeconds ?? 0), 0);

  return (
    <PageFrame header={<SiteHeader activeHref="/my-learning" />}>
      <main id="main" className="flex flex-1 flex-col gap-10 px-6 pt-10 pb-20 sm:px-10 xl:px-12">
        <Breadcrumbs items={[{ label: "My Learning", href: "/my-learning" }, { label: plan.title }]} />

        <section className="grid gap-8 rounded-lg bg-callout p-8 text-white lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:p-10">
          <div>
            <p className="text-action text-primary-300">Your plan · {plan.goal}</p>
            <h1 className="mt-3 text-display-1 text-white">{plan.title}</h1>
            <p className="mt-4 max-w-2xl text-body-lg text-white/80">{plan.summary}</p>
            <p className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-body text-white/70">
              <span>{pluralize(flat.length, "video")}</span>
              {totalSeconds > 0 && <span>{formatDuration(totalSeconds)} of video</span>}
              <span>{LEVEL_LABELS[plan.level] ?? plan.level}</span>
              <span>{PACE_LABELS[plan.pace] ?? plan.pace}</span>
            </p>
          </div>
          <div className="flex flex-col justify-center gap-4 rounded-md bg-white/5 p-6">
            <p className="text-body text-white/70">
              {done} of {flat.length} lessons done
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Plan progress">
              <div className="h-full rounded-full bg-primary-300" style={{ width: `${percent}%` }} />
            </div>
            {next && (
              <Link
                href={planHref(plan.key, next._key)}
                className={buttonClasses({ size: "xl", className: "w-full focus-visible:ring-offset-callout" })}
              >
                {done === 0 ? "Start the plan" : done === flat.length ? "Review the plan" : "Continue"}
                <ArrowRight className="size-5" strokeWidth={2} aria-hidden />
              </Link>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          {plan.modules.map((module, m) => (
            <section key={module._key} aria-labelledby={`module-${module._key}`} className="rounded-lg border border-neutral-200 bg-surface p-5 sm:p-6">
              <p className="text-small font-semibold text-neutral-500">Module {m + 1}</p>
              <h2 id={`module-${module._key}`} className="mt-1 text-heading-2 text-neutral-900">
                {module.title}
              </h2>
              <ol className="mt-4 divide-y divide-canvas-line">
                {module.lessons.map((lesson, l) => (
                  <li key={lesson._key}>
                    <Link
                      href={planHref(plan.key, lesson._key)}
                      className="group flex items-start gap-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <span className="relative block aspect-video w-32 shrink-0 overflow-hidden rounded-md bg-neutral-100 sm:w-40">
                        {lesson.thumbnailUrl && (
                          <Image src={lesson.thumbnailUrl} alt="" fill sizes="160px" className="object-cover" />
                        )}
                        <PlayCircle className="absolute right-2 bottom-2 size-6 text-white drop-shadow" strokeWidth={1.75} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-small font-semibold text-neutral-500">
                          Lesson {m + 1}.{l + 1}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 text-heading-3 text-neutral-900 underline-offset-4 group-hover:underline">
                          {lesson.title}
                          {lesson.completedAt && (
                            <CheckCircle2 className="size-4 shrink-0 text-success" strokeWidth={2.25} aria-label="Completed" />
                          )}
                        </span>
                        <span className="mt-1 block text-body text-neutral-700">{lesson.objective}</span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 text-small text-neutral-500">
                          <span>Video by {lesson.channel}</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3.5" strokeWidth={2} aria-hidden />
                            {formatDuration(lesson.durationSeconds)}
                          </span>
                          {lesson.quizTotal ? <span>Quiz {lesson.quizScore}/{lesson.quizTotal}</span> : null}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-canvas-line pt-6">
          <ProgressBar value={percent} className="max-w-md flex-1" />
          <DeletePlanButton planKey={plan.key} title={plan.title} />
        </div>
      </main>
    </PageFrame>
  );
}
