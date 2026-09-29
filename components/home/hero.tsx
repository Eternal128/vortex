import { ArrowRight, NotebookPen } from "lucide-react";
import Link from "next/link";
import { CourseStackArt } from "@/components/brand/course-stack-art";
import { SearchForm } from "@/components/search/search-form";
import { buttonClasses } from "@/components/ui/button";
import { container } from "@/lib/layout";
import { artLabelFor, paletteFor } from "@/lib/palette";
import { blogHref, courseHref, coursesHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface HeroCourse {
  title: string | null;
  slug: string | null;
  accent?: string | null;
  artLabel?: string | null;
  category?: { title: string | null } | null;
}

interface HeroProps {
  /** The newest course, announced in the pill above the headline. */
  newest: { title: string | null; slug: string | null } | null;
  /** Real courses drawn as the floating, tilted decoration. */
  showcase: HeroCourse[];
  /** One real lesson and its first key point, drawn as a floating "note" card. */
  note: {
    title: string | null;
    keyPoint: string | null;
    course: { title: string | null } | null;
  } | null;
}

export function Hero({ newest, showcase, note }: HeroProps) {
  const [first, second, third] = showcase;

  return (
    <section className="relative isolate overflow-hidden">
      {/* Soft light pooled behind the headline; no imagery, as in the reference. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_50%_42%,var(--color-surface)_0%,transparent_100%)]"
      />

      <FloatingDecor first={first} second={second} third={third} note={note} />

      <div className={cn(container, "flex flex-col items-center pt-20 pb-20 text-center sm:pt-28 lg:pt-32 lg:pb-28")}>
        {newest?.slug && newest.title ? (
          <Link
            href={courseHref(newest.slug)}
            className="group inline-flex max-w-full items-center gap-2.5 rounded-md border border-canvas-line bg-surface py-1.5 pr-3 pl-1.5 text-[13px] leading-5 shadow-sm transition-colors hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <span className="inline-flex items-center gap-1.5 rounded-xs bg-brand-500 px-1.5 py-0.5 font-mono text-[10px] leading-3.5 font-medium tracking-[0.12em] text-white uppercase">
              <span className="size-1.5 rounded-full bg-white motion-safe:animate-pulse" aria-hidden />
              New
            </span>
            <span className="truncate font-medium text-neutral-900">{newest.title} is live</span>
            <span className="hidden text-neutral-500 sm:inline">Open course</span>
            <ArrowRight
              className="size-3.5 shrink-0 text-neutral-500 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2}
              aria-hidden
            />
          </Link>
        ) : null}

        <h1 className="mt-10 max-w-[13ch] text-[48px] leading-[0.98] font-semibold tracking-display text-balance text-neutral-900 sm:text-[72px] lg:text-[92px]">
          Search every lesson.{" "}
          <span className="font-pixel font-normal tracking-[-0.02em]">Found.</span>
        </h1>

        <p className="mt-8 max-w-[52ch] text-[17px] leading-7 text-balance text-neutral-700 sm:text-[19px] sm:leading-8">
          Sequenced courses for developers. Ask in plain English and land on the exact second of the
          lesson where it is taught.
        </p>

        <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
          <Link href={coursesHref} className={buttonClasses({ size: "xl" })}>
            Explore courses
            <ArrowRight className="size-4.5" strokeWidth={2} aria-hidden />
          </Link>
          <Link
            href={blogHref}
            className="group inline-flex items-center gap-2 rounded-xs text-[16px] text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <NotebookPen className="size-4.5 text-neutral-500" strokeWidth={1.75} aria-hidden />
            <span className="border-b border-neutral-300 pb-0.5 transition-colors group-hover:border-neutral-900">
              Read field notes
            </span>
          </Link>
        </div>

        <SearchForm
          id="home-search"
          size="lg"
          label="Ask anything about your learning"
          placeholder="Ask anything… “how does caching work in the App Router?”"
          className="mt-14 w-full max-w-180"
        />
      </div>
    </section>
  );
}

function FloatingDecor({
  first,
  second,
  third,
  note,
}: {
  first?: HeroCourse;
  second?: HeroCourse;
  third?: HeroCourse;
  note: HeroProps["note"];
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden xl:block">
      {first ? (
        <div className="absolute top-24 left-[max(1.5rem,calc(50%-44rem))] -rotate-8 rounded-[20px] p-4 shadow-xl" style={{ backgroundColor: paletteFor(first.accent, first.slug).card }}>
          <CourseStackArt
            palette={paletteFor(first.accent, first.slug)}
            label={artLabelFor(first.artLabel, first.title)}
            size="sm"
            className="h-40 w-52"
          />
        </div>
      ) : null}

      {second ? (
        <div className="absolute bottom-10 left-[max(2rem,calc(50%-42rem))] w-64 rotate-6 rounded-lg border border-canvas-line bg-surface p-5 shadow-lg">
          <p className="eyebrow text-[10px] text-neutral-500">
            Path · {second.category?.title ?? "Course"}
          </p>
          <p className="mt-3 font-pixel text-[20px] leading-6 text-neutral-900">{second.title}</p>
          <div className="mt-4 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-neutral-100" />
            <div className="h-1.5 w-4/5 rounded-full bg-neutral-100" />
            <div className="h-1.5 w-3/5 rounded-full bg-neutral-100" />
          </div>
        </div>
      ) : null}

      {note?.title ? (
        <div className="absolute top-32 right-[max(1.5rem,calc(50%-44rem))] w-72 rotate-3 rounded-lg border border-canvas-line bg-surface p-6 text-left shadow-lg">
          <p className="eyebrow text-[10px] text-neutral-500">Lesson note · {note.course?.title ?? "Vortex"}</p>
          <p className="mt-3 text-[20px] leading-6 font-semibold tracking-[-0.03em] text-neutral-900">
            {note.title}
          </p>
          {note.keyPoint ? (
            <p className="mt-3 line-clamp-3 text-[13px] leading-5 text-neutral-500">{note.keyPoint}</p>
          ) : null}
        </div>
      ) : null}

      {third ? (
        <div className="absolute right-[max(2rem,calc(50%-42rem))] bottom-12 -rotate-6 rounded-[20px] p-4 opacity-90 shadow-xl" style={{ backgroundColor: paletteFor(third.accent, third.slug).card }}>
          <CourseStackArt
            palette={paletteFor(third.accent, third.slug)}
            label={artLabelFor(third.artLabel, third.title)}
            size="sm"
            className="h-36 w-48"
          />
        </div>
      ) : null}
    </div>
  );
}
