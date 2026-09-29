import { BarChart3, Clock, FileText, type LucideIcon, Users } from "lucide-react";
import type { COURSE_BY_SLUG_QUERY_RESULT } from "@/sanity.types";
import { CourseStackArt } from "@/components/brand/course-stack-art";
import { Badge } from "@/components/ui/badge";
import { CourseHeroActions, type EnrollState } from "@/components/course/course-hero-actions";
import { CreatorAvatars } from "@/components/creators/creator-avatars";
import { LiveLearners } from "@/components/learners/learner-counts";
import { creatorsLabel, toCreators } from "@/lib/creators";
import { formatDuration, formatLevel, pluralize } from "@/lib/format";
import { artLabelFor, paletteFor } from "@/lib/palette";

type Course = NonNullable<COURSE_BY_SLUG_QUERY_RESULT>;

interface CourseHeroProps {
  course: Course;
  /** Resume point (or the first lesson), or null when the curriculum is empty. */
  continueHref: string | null;
  enrollState: EnrollState;
  percentComplete: number;
  started: boolean;
}

/** Marketing copy, the derived meta row and the calls to action, beside the course's stack art. */
export function CourseHero({ course, continueHref, enrollState, percentComplete, started }: CourseHeroProps) {
  const level = formatLevel(course.level);
  const duration = formatDuration(course.durationSeconds);
  const modules = course.moduleCount ? pluralize(course.moduleCount, "module") : null;
  const creators = toCreators(course.creators, 64);

  const meta: { icon: LucideIcon; label: string }[] = [];
  if (level) meta.push({ icon: BarChart3, label: level });
  if (duration) meta.push({ icon: Clock, label: duration });
  if (modules) meta.push({ icon: FileText, label: modules });

  const palette = paletteFor(course.accent, course.slug);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          {course.category?.title && <p className="eyebrow text-neutral-500">{course.category.title}</p>}
          {course.popular && <Badge variant="popular">Popular</Badge>}
        </div>

        <h1 className="mt-5 text-[40px] leading-[1.02] font-semibold tracking-[-0.05em] text-balance text-neutral-900 sm:text-[56px]">
          {course.title}
        </h1>

        {course.summary && (
          <p className="mt-6 max-w-[52ch] text-[17px] leading-7 text-neutral-500">
            {course.summary}
          </p>
        )}

        {creators.length > 0 && (
          <p className="mt-5 flex items-center gap-3 text-body-lg text-neutral-700">
            <CreatorAvatars creators={creators} max={4} size={32} />
            <span className="min-w-0">Videos by {creatorsLabel(creators, 2)}</span>
          </p>
        )}

        <ul className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-canvas-line pt-6">
          {meta.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 font-mono text-[12px] tracking-[0.06em] whitespace-nowrap text-neutral-500 uppercase"
            >
              <Icon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
              {label}
            </li>
          ))}
          <li className="inline-flex items-center gap-2 font-mono text-[12px] tracking-[0.06em] whitespace-nowrap text-neutral-500 uppercase">
            <Users className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
            <LiveLearners kind="course" id={course._id} zero="Be the first to enroll" />
          </li>
        </ul>

        <CourseHeroActions
          continueHref={continueHref}
          courseSlug={course.slug ?? ""}
          courseId={course._id}
          enrollState={enrollState}
          percentComplete={percentComplete}
          started={started}
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
