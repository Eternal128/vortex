import { BarChart3, Clock, FileText, type LucideIcon, Users } from "lucide-react";
import Image from "next/image";
import type { COURSE_BY_SLUG_QUERY_RESULT } from "@/sanity.types";
import { Badge } from "@/components/ui/badge";
import { CourseHeroActions, type EnrollState } from "@/components/course/course-hero-actions";
import { CreatorAvatars } from "@/components/creators/creator-avatars";
import { LiveLearners } from "@/components/learners/learner-counts";
import { creatorsLabel, toCreators } from "@/lib/creators";
import { urlFor } from "@/sanity/lib/image";
import { formatDuration, formatLevel, pluralize } from "@/lib/format";

type Course = NonNullable<COURSE_BY_SLUG_QUERY_RESULT>;

interface CourseHeroProps {
  course: Course;
  /** Resume point (or the first lesson), or null when the curriculum is empty. */
  continueHref: string | null;
  enrollState: EnrollState;
  percentComplete: number;
  started: boolean;
}

/** Cover art, marketing copy, the derived meta row, and the two calls to action. */
export function CourseHero({ course, continueHref, enrollState, percentComplete, started }: CourseHeroProps) {
  const level = formatLevel(course.level);
  const duration = formatDuration(course.durationSeconds);
  const modules = course.moduleCount ? pluralize(course.moduleCount, "module") : null;
  const creators = toCreators(course.creators, 64);

  const meta: { icon: LucideIcon; label: string }[] = [];
  if (level) meta.push({ icon: BarChart3, label: level });
  if (duration) meta.push({ icon: Clock, label: duration });
  if (modules) meta.push({ icon: FileText, label: modules });

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-15">
      {course.coverImage?.asset && (
        <Image
          src={urlFor(course.coverImage).width(560).height(656).fit("crop").url()}
          alt={course.coverImage.alt ?? ""}
          width={280}
          height={328}
          priority
          className="h-[328px] w-full max-w-[280px] shrink-0 rounded-lg object-cover"
        />
      )}

      <div className="min-w-0 flex-1">
        {course.popular && <Badge variant="popular">Popular</Badge>}

        <h1 className="mt-6 text-heading-1 text-neutral-900">
          {course.title}
        </h1>

        {course.summary && (
          <p className="mt-4 max-w-[420px] text-body-lg text-neutral-500">
            {course.summary}
          </p>
        )}

        {creators.length > 0 && (
          <p className="mt-5 flex items-center gap-3 text-body-lg text-neutral-700">
            <CreatorAvatars creators={creators} max={4} size={32} />
            <span className="min-w-0">Videos by {creatorsLabel(creators, 2)}</span>
          </p>
        )}

        <ul className="mt-9 flex flex-wrap items-center gap-x-9 gap-y-3">
          {meta.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-2 text-body whitespace-nowrap text-neutral-500"
            >
              <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              {label}
            </li>
          ))}
          <li className="inline-flex items-center gap-2 text-body whitespace-nowrap text-neutral-500">
            <Users className="size-4 shrink-0" strokeWidth={2} aria-hidden />
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
    </div>
  );
}
