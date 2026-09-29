import "server-only";

import { auth } from "@clerk/nextjs/server";

import { writeClient } from "./write-client";

/** One lesson's state for one learner. */
export interface LessonProgress {
  lessonId: string;
  positionSeconds: number | null;
  completedAt: string | null;
  quizScore: number | null;
  quizTotal: number | null;
  quizAttempts: number;
  updatedAt: string | null;
}

export interface LearnerProgress {
  /** Keyed by lesson document id. */
  lessons: Map<string, LessonProgress>;
  lastLessonId: string | null;
  /** Course ids the learner has enrolled in. */
  enrolled: Set<string>;
}

export type ProgressUpdate =
  | { type: "position"; lessonId: string; seconds: number }
  | { type: "complete"; lessonId: string }
  | { type: "quiz"; lessonId: string; score: number; total: number };

/** The dot keeps the document out of public reads; the id is derived, never supplied. */
function progressId(userId: string) {
  return `progress.${userId}`;
}

/** Array keys must be simple strings; lesson ids carry dots. */
function lessonKey(lessonId: string) {
  return lessonId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

interface StoredLesson {
  _key: string;
  lesson?: { _ref: string };
  positionSeconds?: number;
  completedAt?: string;
  quizScore?: number;
  quizTotal?: number;
  quizAttempts?: number;
  updatedAt?: string;
}

const PROGRESS_QUERY = `*[_id == $id][0]{ lessons, "lastLessonId": lastLesson._ref, "enrolled": enrollments[].course._ref }`;

/** Per-user and always fresh — never through the shared, tag-cached `sanityFetch`. */
async function readProgress(userId: string): Promise<LearnerProgress> {
  const doc = await writeClient.fetch<{ lessons?: StoredLesson[]; lastLessonId?: string; enrolled?: string[] } | null>(
    PROGRESS_QUERY,
    { id: progressId(userId) },
    { cache: "no-store" },
  );

  const lessons = new Map<string, LessonProgress>();
  for (const entry of doc?.lessons ?? []) {
    const lessonId = entry.lesson?._ref;
    if (!lessonId) continue;
    lessons.set(lessonId, {
      lessonId,
      positionSeconds: entry.positionSeconds ?? null,
      completedAt: entry.completedAt ?? null,
      quizScore: entry.quizScore ?? null,
      quizTotal: entry.quizTotal ?? null,
      quizAttempts: entry.quizAttempts ?? 0,
      updatedAt: entry.updatedAt ?? null,
    });
  }
  return { lessons, lastLessonId: doc?.lastLessonId ?? null, enrolled: new Set((doc?.enrolled ?? []).filter(Boolean)) };
}

/** The signed-in learner's progress, or null when signed out. */
export async function getLearnerProgress(): Promise<LearnerProgress | null> {
  const { userId } = await auth();
  return userId ? readProgress(userId) : null;
}

/** Enrolls `userId` in a course. Idempotent: enrolling twice keeps the first date. */
export async function enrollCourse(userId: string, courseId: string) {
  const id = progressId(userId);
  const key = lessonKey(courseId);
  await writeClient.createIfNotExists({ _id: id, _type: "progress", userId, lessons: [] });
  const already = await writeClient.fetch<boolean>(`count(*[_id == $id][0].enrollments[_key == $key]) > 0`, { id, key }, { cache: "no-store" });
  if (already) return;
  await writeClient
    .patch(id)
    .setIfMissing({ enrollments: [] })
    .append("enrollments", [{ _key: key, _type: "enrollment", course: { _type: "reference", _ref: courseId, _weak: true }, enrolledAt: new Date().toISOString() }])
    .commit();
}

/** Applies one update for `userId`. The caller has already authenticated and validated it. */
export async function recordProgress(userId: string, update: ProgressUpdate) {
  const id = progressId(userId);
  const key = lessonKey(update.lessonId);
  const now = new Date().toISOString();

  await writeClient.createIfNotExists({ _id: id, _type: "progress", userId, lessons: [] });
  const current = await writeClient.fetch<StoredLesson | null>(
    `*[_id == $id][0].lessons[_key == $key][0]`,
    { id, key },
    { cache: "no-store" },
  );

  const next: StoredLesson = {
    ...(current ?? {}),
    _key: key,
    lesson: { _type: "reference", _ref: update.lessonId, _weak: true } as StoredLesson["lesson"],
    updatedAt: now,
  };

  if (update.type === "position") next.positionSeconds = Math.max(0, Math.round(update.seconds));
  if (update.type === "complete") next.completedAt = current?.completedAt ?? now;
  if (update.type === "quiz") {
    // Keep the best attempt, and finishing the quiz counts as finishing the lesson.
    next.quizScore = Math.max(current?.quizScore ?? 0, update.score);
    next.quizTotal = update.total;
    next.quizAttempts = (current?.quizAttempts ?? 0) + 1;
    next.completedAt = current?.completedAt ?? now;
  }

  const lastLesson = { _type: "reference", _ref: update.lessonId, _weak: true };
  const patch = writeClient.patch(id).set({ lastLesson });
  await (current
    ? patch.set({ [`lessons[_key=="${key}"]`]: next })
    : patch.setIfMissing({ lessons: [] }).append("lessons", [next])
  ).commit();
}
