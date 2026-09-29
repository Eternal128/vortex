import { BarChart3, Clock, FileText, type LucideIcon, Users } from "lucide-react";
import Link from "next/link";
import type { COURSE_BY_SLUG_QUERY_RESULT } from "@/sanity.types";
import { CourseStackArt } from "@/components/brand/course-stack-art";
import { Badge } from "@/components/ui/badge";
import { CourseHeroActions } from "@/components/course/course-hero-actions";
import { formatCount, formatDuration, formatLevel, pluralize } from "@/lib/format";
import { artLabelFor, paletteFor } from "@/lib/palette";
import { instructorHref } from "@/lib/routes";

type Course = NonNullable<COURSE_BY_SLUG_QUERY_RESULT>;

interface CourseHeroProps {
  course: Course;
  /** First lesson of the course, or null when the curriculum is empty. */
  continueHref: string | null;
}

/** Cover art, marketing copy, the derived meta row, and the two calls to action. */
export function CourseHero({ course, continueHref }: CourseHeroProps) {
  const level = formatLevel(course.level);
  const duration = formatDuration(course.durationSeconds);
  const modules = course.moduleCount ? pluralize(course.moduleCount, "module") : null;
  const students = formatCount(course.studentCount);

  const meta: { icon: LucideIcon; label: string }[] = [];
  if (level) meta.push({ icon: BarChart3, label: level });
  if (duration) meta.push({ icon: Clock, label: duration });
  if (modules) meta.push({ icon: FileText, label: modules });
  if (students) meta.push({ icon: Users, label: `${students} students` });

  const palette = paletteFor(course.accent, course.slug);
  const instructor = course.instructor;

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          {course.category?.title && (
            <p className="eyebrow text-neutral-500">{course.category.title}</p>
          )}
          {course.popular && <Badge variant="popular">Popular</Badge>}
        </div>

        <h1 className="mt-5 text-[40px] leading-[1.02] font-semibold tracking-[-0.05em] text-balance text-neutral-900 sm:text-[56px]">
          {course.title}
        </h1>

        {course.summary && (
          <p className="mt-6 max-w-[52ch] text-[17px] leading-7 text-neutral-500">{course.summary}</p>
        )}

        {instructor?.name && (
          <p className="mt-6 text-[14px] text-neutral-500">
            Taught by{" "}
            {instructor.slug ? (
              <Link
                href={instructorHref(instructor.slug)}
                className="rounded-xs font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                {instructor.name}
              </Link>
            ) : (
              <span className="font-medium text-neutral-900">{instructor.name}</span>
            )}
          </p>
        )}

        {meta.length > 0 && (
          <ul className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-canvas-line pt-6">
            {meta.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 font-mono text-[12px] leading-5 tracking-[0.06em] whitespace-nowrap text-neutral-500 uppercase"
              >
                <Icon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        )}

        <CourseHeroActions
          continueHref={continueHref}
          courseSlug={course.slug ?? ""}
        />
      </div>

      <div
        className="flex h-80 items-center justify-center overflow-hidden rounded-[24px] shadow-sm sm:h-96"
        style={{ backgroundColor: palette.card }}
      >
        <CourseStackArt
          palette={palette}
          label={artLabelFor(course.artLabel, course.title)}
          size="lg"
          className="h-full w-full px-6 pt-6"
        />
      </div>
    </div>
  );
}
