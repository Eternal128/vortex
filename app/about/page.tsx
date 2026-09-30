import { ArrowRight, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StepLoop } from "@/components/about/step-loop";
import { LogoMark } from "@/components/brand/logo";
import { PageFrame } from "@/components/layout/page-frame";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonClasses } from "@/components/ui/button";
import { container } from "@/lib/layout";
import { aboutHref, coursesHref, newPlanHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About",
  description: "Why Vortex exists, and how it turns YouTube lessons into courses with progress and quizzes.",
};

const VIDEO = {
  src: "/about/vortex-explainer.mp4",
  captions: "/about/vortex-explainer.vtt",
  poster: "/about/vortex-explainer-poster.jpg",
};

interface Step {
  title: string;
  body: string;
  /** The loop's name in public/about: `<name>.mp4`, with `<name>.jpg` as its still. */
  loop: string;
  alt: string;
  /** Column span at desktop, so the four steps sit in an uneven two-by-two. */
  span: string;
  cta?: { label: string; href: string };
}

/** What Vortex promises, each true of every course. */
const PROMISES = ["Lessons in order", "Saved to the second", "A quiz per video"];

const steps: Step[] = [
  {
    title: "Find what to learn",
    body: "Browse courses by category, or ask search a question in plain English and get the lessons that teach it.",
    loop: "step-find",
    alt: "Animation: a plain English question typed into search, and the lessons that teach it ranked below",
    span: "lg:col-span-7",
  },
  {
    title: "Watch, and pick up where you stopped",
    body: "Videos play here, in YouTube's own player. Your place saves to the second, and your course progress moves as you watch.",
    loop: "step-watch",
    alt: "Animation: tapping Continue on an enrolled course, and the lesson resuming at 5:46",
    span: "lg:col-span-5",
  },
  {
    title: "Check you've got it",
    body: "When a video ends, a short quiz unlocks. Submit to see your grade and what you missed, then retake it until you pass.",
    loop: "step-quiz",
    alt: "Animation: a quiz graded 33%, the missed answers shown, then a retake that passes",
    span: "lg:col-span-5",
  },
  {
    title: "Build a plan for anything else",
    body: "Describe a goal, like baking bread, and Vortex designs a syllabus and picks a YouTube video for every lesson.",
    loop: "step-plan",
    alt: "Animation: a goal typed in, and a plan of modules with a video for each lesson",
    span: "lg:col-span-7",
    cta: { label: "Build your own plan", href: "/plans/new" },
  },
];

/**
 * About Vortex: why it exists and how it works, told first by a short narrated video and then in
 * four steps, each looping its scene from that video. Nothing downloads until the learner presses
 * play or scrolls a step into view.
 */
export default function AboutPage() {
  return (
    <PageFrame header={<SiteHeader activeHref={aboutHref} />}>
      <main id="main" className="flex flex-col">
        <section aria-labelledby="about-title" className={cn(container, "pt-20 pb-16 text-center sm:pt-28")}>
          <p className="eyebrow text-neutral-500">About Vortex</p>
          <h1
            id="about-title"
            className="mx-auto mt-5 max-w-[16ch] text-[44px] leading-[1] font-semibold tracking-display text-balance text-neutral-900 sm:text-[72px]"
          >
            Learn anything from YouTube,{" "}
            <span className="font-pixel font-normal tracking-[-0.02em]">like a course.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-[52ch] text-[17px] leading-7 text-neutral-500 sm:text-[19px] sm:leading-8">
            Courses built from videos you already trust, with saved progress and a quiz after every
            lesson.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-7">
            <Link href={coursesHref} className={buttonClasses({ size: "xl" })}>
              Browse courses
              <ArrowRight className="size-4.5" strokeWidth={2} aria-hidden />
            </Link>
            <a
              href="#tour"
              className="group inline-flex items-center gap-2 rounded-xs text-[16px] text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <PlayCircle className="size-4.5 text-neutral-500" strokeWidth={1.75} aria-hidden />
              <span className="border-b border-neutral-300 pb-0.5 transition-colors group-hover:border-neutral-900">
                Watch the one-minute tour
              </span>
            </a>
          </div>
        </section>

        <section id="tour" aria-label="Video tour" className={cn(container, "scroll-mt-24 pb-24")}>
          <figure className="mx-auto max-w-260">
            <div className="rounded-[22px] border border-canvas-line bg-surface p-2 shadow-xl sm:p-3">
              <div className="overflow-hidden rounded-[14px] bg-promo-deep">
                <video
                  controls
                  playsInline
                  preload="none"
                  poster={VIDEO.poster}
                  width={1920}
                  height={1080}
                  className="block aspect-video h-auto w-full"
                >
                  <source src={VIDEO.src} type="video/mp4" />
                  <track kind="captions" src={VIDEO.captions} srcLang="en" label="English" default />
                </video>
              </div>
            </div>
            <figcaption className="mt-4 text-center font-mono text-[12px] tracking-[0.08em] text-neutral-500 uppercase">
              Introducing Vortex · a one-minute film · captions on
            </figcaption>
          </figure>
        </section>

        <section aria-labelledby="about-why" className="border-y border-canvas-line bg-surface">
          <div className={cn(container, "grid gap-10 py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:py-28")}>
            <div>
              <p className="eyebrow text-neutral-500">Why we built it</p>
              <h2
                id="about-why"
                className="mt-4 max-w-[14ch] text-[34px] leading-[1.05] font-semibold tracking-[-0.045em] text-neutral-900 sm:text-[44px]"
              >
                Great teaching, finally in order.
              </h2>
              <div className="squiggle mt-8 w-48" aria-hidden />
            </div>
            <div className="flex max-w-[62ch] flex-col gap-6 text-[17px] leading-8 text-neutral-700 sm:text-[18px]">
              <p>
                YouTube holds some of the best teaching in the world, from people who love their subject.
                But it is scattered. There is no order to follow, no checkpoints along the way, and no way
                to know you have really got it.
              </p>
              <p>
                Vortex adds the structure a good course gives you: lessons in order, progress that
                remembers where you stopped, and a short quiz after every video. The videos stay in
                YouTube&rsquo;s own player, and every creator stays credited.
              </p>
              <ul className="mt-2 grid gap-3 sm:grid-cols-3">
                {PROMISES.map((promise) => (
                  <li key={promise} className="rounded-lg border border-canvas-line bg-canvas px-4 py-3 font-mono text-[12px] tracking-[0.06em] text-neutral-700 uppercase">
                    {promise}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="about-how" className={cn(container, "py-20 lg:py-28")}>
          <p className="eyebrow text-neutral-500">How it works</p>
          <h2
            id="about-how"
            className="mt-4 text-[34px] leading-[1.05] font-semibold tracking-[-0.045em] text-neutral-900 sm:text-[44px]"
          >
            Four steps, one habit.
          </h2>
          <ol className="mt-12 grid gap-5 lg:grid-cols-12">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className={cn(
                  "lift flex flex-col overflow-hidden rounded-xl border border-canvas-line bg-surface shadow-sm",
                  step.span,
                )}
              >
                <div className="relative aspect-video overflow-hidden border-b border-canvas-line bg-neutral-100">
                  <StepLoop src={`/about/${step.loop}.mp4`} poster={`/about/${step.loop}.jpg`} label={step.alt} />
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-[24px] leading-7 font-semibold tracking-[-0.04em] text-neutral-900 sm:text-[28px] sm:leading-8">
                      {step.title}
                    </h3>
                    <span className="shrink-0 text-[40px] leading-none font-semibold tracking-[-0.06em] text-neutral-200 tabular">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-3 max-w-[56ch] text-body-lg text-neutral-500">{step.body}</p>
                  {step.cta && (
                    <Link
                      href={step.cta.href}
                      className={buttonClasses({ variant: "tertiary", size: "lg", className: "mt-7 w-fit" })}
                    >
                      {step.cta.label}
                      <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={cn(container, "pb-24")}>
          <div className="flex flex-col items-start justify-between gap-8 rounded-[24px] bg-callout px-8 py-12 text-white sm:flex-row sm:items-center sm:px-12">
            <div>
              <LogoMark size={36} className="[--color-neutral-900:#f2f2f2] [--color-surface:#1f1f1f]" />
              <p className="mt-5 max-w-[22ch] text-[30px] leading-[1.1] font-semibold tracking-[-0.045em] sm:text-[36px]">
                Pick a path and press play.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={coursesHref} className={buttonClasses({ size: "xl", className: "bg-white text-[#1f1f1f] shadow-none hover:bg-neutral-100" })}>
                Browse courses
                <ArrowRight className="size-4.5" strokeWidth={2} aria-hidden />
              </Link>
              <Link
                href={newPlanHref}
                className={buttonClasses({ variant: "secondary", size: "xl", className: "border-white/30 bg-transparent text-white hover:bg-white/10" })}
              >
                Build a plan
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PageFrame>
  );
}
