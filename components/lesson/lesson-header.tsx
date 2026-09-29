import { BarChart3, Clock, type LucideIcon, Users } from "lucide-react";
import { LiveLearners } from "@/components/learners/learner-counts";
import { LessonBookmarkButton } from "@/components/lesson/lesson-bookmark-button";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatLevel } from "@/lib/format";

interface LessonHeaderProps {
  /** "5.1", derived from curriculum order. */
  label: string | null;
  title: string | null;
  /** First paragraph of the lesson notes; the schema has no summary field. */
  summary: string | null;
  durationSeconds: number | null;
  /** Level is a course-level field, surfaced here as the design shows it. */
  level: string | null;
  /** For the live learner count. */
  lessonId: string;
  lessonSlug: string;
}

/** The lesson's label, title, lead paragraph, and meta row (length, level, live learners). */
export function LessonHeader({
  label,
  title,
  summary,
  durationSeconds,
  level,
  lessonId,
  lessonSlug,
}: LessonHeaderProps) {
  const duration = formatDuration(durationSeconds);
  const levelLabel = formatLevel(level);

  const meta: { icon: LucideIcon; label: string }[] = [];
  if (duration) meta.push({ icon: Clock, label: duration });
  if (levelLabel) meta.push({ icon: BarChart3, label: levelLabel });

  return (
    <header>
      {label && <Badge variant="video">Lesson {label}</Badge>}

      <div className="mt-5 flex items-start justify-between gap-6">
        <h1 className="text-heading-1 text-neutral-900">
          {title}
        </h1>
        <LessonBookmarkButton lessonSlug={lessonSlug} />
      </div>

      {summary && (
        <p className="mt-4 max-w-[520px] text-body-lg text-neutral-500">{summary}</p>
      )}

      <ul className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3">
        {meta.map(({ icon: Icon, label: item }) => (
          <li
            key={item}
            className="inline-flex items-center gap-2 text-body whitespace-nowrap text-neutral-500"
          >
            <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            {item}
          </li>
        ))}
        <LiveLearners
          kind="lesson"
          id={lessonId}
          className="inline-flex items-center gap-2 text-body whitespace-nowrap text-neutral-500"
          icon={<Users className="size-4 shrink-0" strokeWidth={2} aria-hidden />}
          as="li"
        />
      </ul>
    </header>
  );
}
