import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StepLoop } from "@/components/about/step-loop";
import { PageFrame } from "@/components/layout/page-frame";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonClasses } from "@/components/ui/button";
import { coursesHref } from "@/lib/routes";
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
    alt: "Animation: enrolling in a course, then the video saving its place at 5:46",
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
    <PageFrame header={<SiteHeader />}>
      <main id="main" className="flex flex-col px-6 pt-12 pb-20 sm:px-12 xl:px-18 xl:pt-16">
        <section
          aria-labelledby="about-title"
          className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14"
        >
          <div>
            <p className="text-action text-primary-600">About Vortex</p>
            <h1 id="about-title" className="mt-3 text-display-1 text-balance text-neutral-900">
              Learn anything from YouTube, the way a course teaches it.
            </h1>
            <p className="mt-4 max-w-md text-body-lg text-neutral-500">
              Courses built from videos you already trust, with saved progress and a quiz after every
              lesson.
            </p>
            <Link href={coursesHref} className={buttonClasses({ size: "xl", className: "mt-8" })}>
              Browse courses
              <ArrowRight className="size-5" strokeWidth={2} aria-hidden />
            </Link>
          </div>

          <figure>
            <div className="overflow-hidden rounded-lg border border-canvas-line bg-promo-deep shadow-lift">
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
            <figcaption className="mt-3 text-body text-neutral-500">
              A 75-second tour of Vortex, with narration and captions.
            </figcaption>
          </figure>
        </section>

        <section
          aria-labelledby="about-why"
          className="mt-20 grid gap-6 border-t border-canvas-line pt-14 lg:mt-28 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:pt-20"
        >
          <h2 id="about-why" className="text-display-2 text-neutral-900">
            Why we built it
          </h2>
          <div className="flex max-w-[62ch] flex-col gap-5 text-body-lg text-neutral-700">
            <p>
              YouTube holds some of the best teaching in the world, from people who love their subject.
              But it is scattered. There is no order to follow, no checkpoints along the way, and no way to
              know you have really got it.
            </p>
            <p>
              Vortex adds the structure a good course gives you: lessons in order, progress that remembers
              where you stopped, and a short quiz after every video. The videos stay in YouTube&rsquo;s own
              player, and every creator stays credited.
            </p>
          </div>
        </section>

        <section aria-labelledby="about-how" className="mt-20 lg:mt-28">
          <h2 id="about-how" className="text-display-2 text-neutral-900">
            How it works
          </h2>
          <ol className="mt-8 grid gap-6 lg:grid-cols-12">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className={cn("flex flex-col overflow-hidden rounded-lg border border-canvas-line bg-surface", step.span)}
              >
                <div className="relative aspect-video overflow-hidden border-b border-canvas-line bg-neutral-100">
                  <StepLoop src={`/about/${step.loop}.mp4`} poster={`/about/${step.loop}.jpg`} label={step.alt} />
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <p className="text-action text-neutral-500 tabular">Step {index + 1}</p>
                  <h3 className="mt-1 text-heading-1 text-neutral-900">{step.title}</h3>
                  <p className="mt-2 max-w-[56ch] text-body-lg text-neutral-700">{step.body}</p>
                  {step.cta && (
                    <Link
                      href={step.cta.href}
                      className={buttonClasses({ variant: "secondary", size: "lg", className: "mt-6 w-fit" })}
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
      </main>
    </PageFrame>
  );
}
