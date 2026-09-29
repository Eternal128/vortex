import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CourseStackArt } from "@/components/brand/course-stack-art";
import { pluralize } from "@/lib/format";
import { artLabelFor, paletteFor } from "@/lib/palette";
import { courseHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

export interface PathCardCourse {
  _id: string;
  title: string | null;
  slug: string | null;
  accent?: string | null;
  artLabel?: string | null;
  popular?: boolean | null;
  outcomes?: Array<string | null> | null;
  category?: { title: string | null } | null;
  moduleCount?: number | null;
  lessonCount?: number | null;
  freeLessonCount?: number | null;
}

interface PathCardProps {
  course: PathCardCourse;
  showPopular?: boolean;
  /** Headings inside the card; `h3` under a section heading, `h2` as a page's primary list. */
  headingLevel?: "h2" | "h3";
  className?: string;
}

/**
 * The colored course card from the reference ("Pick your path"): stack-art thumbnail, mono category
 * eyebrow, the title in the pixel face, up to three real learning outcomes, and a derived
 * `N MODULES · N LESSONS · N FREE` line. Nothing on it is invented.
 */
export function PathCard({ course, showPopular = false, headingLevel = "h3", className }: PathCardProps) {
  const palette = paletteFor(course.accent, course.slug);
  const Heading = headingLevel;
  const outcomes = (course.outcomes ?? []).filter((o): o is string => !!o).slice(0, 3);
  const meta = [
    course.moduleCount ? pluralize(course.moduleCount, "module") : null,
    course.lessonCount ? pluralize(course.lessonCount, "lesson") : null,
    course.freeLessonCount ? `${course.freeLessonCount} free` : null,
  ].filter(Boolean);

  if (!course.slug) return null;

  return (
    <Link
      href={courseHref(course.slug)}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[20px] shadow-sm transition-[transform,box-shadow] duration-300 ease-out-soft",
        "hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      style={{ backgroundColor: palette.card, color: palette.fg }}
    >
      <CourseStackArt
        palette={palette}
        label={artLabelFor(course.artLabel, course.title)}
        className="h-64 px-6 pt-8 transition-transform duration-500 ease-out-soft group-hover:scale-[1.03]"
      />

      <div className="flex flex-1 flex-col px-6 pt-4 pb-6 sm:px-7">
        <div className="flex flex-wrap items-center gap-2">
          {course.category?.title ? (
            <p className="eyebrow text-[11px]" style={{ color: palette.muted }}>
              {course.category.title}
            </p>
          ) : null}
          {showPopular && course.popular ? (
            <span
              className="rounded-xs px-1.5 py-0.5 font-mono text-[10px] leading-3.5 tracking-[0.08em] uppercase"
              style={{ backgroundColor: palette.fg, color: palette.card }}
            >
              Popular
            </span>
          ) : null}
        </div>

        <Heading className="mt-3 font-pixel text-[28px] leading-[1.12] tracking-[-0.01em] text-balance sm:text-[30px]">
          {course.title}
        </Heading>

        {outcomes.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {outcomes.map((outcome) => (
              <li key={outcome} className="flex gap-2 text-[14px] leading-5">
                <span aria-hidden style={{ color: palette.muted }}>
                  +
                </span>
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {meta.length > 0 ? (
          <p className="eyebrow mt-5 text-[11px]" style={{ color: palette.muted }}>
            {meta.join(" · ")}
          </p>
        ) : null}

        <span className="mt-auto flex items-center justify-between pt-8 text-[15px] font-semibold">
          Open course
          <ArrowRight
            className="size-4 transition-transform duration-300 ease-out-soft group-hover:translate-x-1"
            strokeWidth={2}
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}
