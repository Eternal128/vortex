import type { LearnerProgress } from "@/sanity/lib/progress";
import { lessonHref } from "@/lib/routes";

interface OrderedLesson {
  _id: string;
  slug: string | null;
  title?: string | null;
  /** Seconds; enables partial credit for a lesson in progress. */
  duration?: number | null;
}

/** An unfinished lesson never counts as more than this, however far the learner scrubbed. */
const PARTIAL_CAP = 0.95;

/**
 * 0–100 across the lessons: a finished lesson counts fully, an unfinished one by how far into it
 * the learner has watched, so the bar moves as soon as they watch rather than only on completion.
 */
export function percentFor(lessons: { _id: string; duration?: number | null }[], progress: LearnerProgress | null) {
  if (lessons.length === 0 || !progress) return 0;
  const credit = lessons.reduce((sum, lesson) => {
    const entry = progress.lessons.get(lesson._id);
    if (!entry) return sum;
    if (entry.completedAt) return sum + 1;
    if (entry.positionSeconds && lesson.duration) return sum + Math.min(PARTIAL_CAP, entry.positionSeconds / lesson.duration);
    return sum;
  }, 0);
  return Math.round((credit / lessons.length) * 100);
}

export interface CourseResume {
  /** Where "Continue" goes, with the saved second as `?t=` when there is one. */
  href: string | null;
  /** 0–100, completed lessons over all lessons. */
  percent: number;
  completedCount: number;
  /** The learner has touched at least one lesson. */
  started: boolean;
  /** Every lesson is complete. */
  finished: boolean;
  /** The lesson "Continue" points at. */
  lesson: OrderedLesson | null;
}

/** Positions this close to the end are not worth resuming into. */
const RESUME_TAIL_SECONDS = 5;

/**
 * The resume point for one course: the most recently touched unfinished lesson at its saved
 * second; else the first unfinished lesson; else — everything done — the first lesson.
 */
export function resumeFor(lessons: OrderedLesson[], progress: LearnerProgress | null): CourseResume {
  const playable = lessons.filter((lesson) => lesson.slug);
  const entries = playable.map((lesson) => ({ lesson, entry: progress?.lessons.get(lesson._id) ?? null }));
  const completedCount = entries.filter(({ entry }) => entry?.completedAt).length;

  const inProgress = entries
    .filter(({ entry }) => entry && !entry.completedAt && entry.updatedAt)
    .sort((a, b) => (b.entry?.updatedAt ?? "").localeCompare(a.entry?.updatedAt ?? ""))[0];
  const firstUnfinished = entries.find(({ entry }) => !entry?.completedAt);
  const target = inProgress ?? firstUnfinished ?? entries[0] ?? null;

  const seconds = inProgress?.entry?.positionSeconds ?? null;
  const href = target?.lesson.slug
    ? lessonHref(target.lesson.slug, seconds && seconds > RESUME_TAIL_SECONDS ? seconds : null)
    : null;

  return {
    href,
    percent: percentFor(playable, progress),
    completedCount,
    started: entries.some(({ entry }) => entry !== null),
    finished: playable.length > 0 && completedCount === playable.length,
    lesson: target?.lesson ?? null,
  };
}
