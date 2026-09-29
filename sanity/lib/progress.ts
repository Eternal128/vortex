import "server-only";

import { auth } from "@clerk/nextjs/server";

import { compareAndSet } from "./cas";
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
  /** Already graded on the server from the submitted answers; `attemptId` makes retries idempotent. */
  | { type: "quiz"; lessonId: string; score: number; total: number; attemptId: string };

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
  /** The most recent quiz submissions' ids, so a retried submission is not counted twice. */
  attemptIds?: string[];
  updatedAt?: string;
}

/** How many submission ids each lesson remembers for de-duplication. */
const REMEMBERED_ATTEMPTS = 20;

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

/** Creates the learner's empty progress record the first time they write anything. */
async function ensureProgress(userId: string) {
  await writeClient.createIfNotExists({ _id: progressId(userId), _type: "progress", userId, lessons: [] });
}

/**
 * Enrolls `userId` in a course. Idempotent: enrolling twice keeps the first date, and two parallel
 * enrollments cannot append the same course twice (compare-and-set).
 */
export async function enrollCourse(userId: string, courseId: string) {
  const id = progressId(userId);
  const key = lessonKey(courseId);
  await ensureProgress(userId);
  await compareAndSet(
    id,
    () => writeClient.fetch<{ _rev: string; enrolled: boolean } | null>(
      `*[_id == $id][0]{_rev, "enrolled": count(enrollments[_key == $key]) > 0}`,
      { id, key },
      { cache: "no-store" },
    ),
    (doc) =>
      doc.enrolled
        ? { patch: null, result: undefined }
        : {
            patch: (patch) =>
              patch.setIfMissing({ enrollments: [] }).append("enrollments", [
                { _key: key, _type: "enrollment", course: { _type: "reference", _ref: courseId, _weak: true }, enrolledAt: new Date().toISOString() },
              ]),
            result: undefined,
          },
  );
}

/**
 * Applies one update for `userId`; the caller has already authenticated and validated it.
 *
 * Race-safe: the lesson entry is read with the document revision and written back only if nothing
 * changed in between, retrying otherwise, so parallel saves never drop each other. Merges are
 * monotonic: completion is kept once set, the best quiz score is kept, and a quiz `attemptId` seen
 * before is ignored, so a retried submission never counts as another attempt.
 */
export async function recordProgress(userId: string, update: ProgressUpdate) {
  const id = progressId(userId);
  const key = lessonKey(update.lessonId);
  await ensureProgress(userId);

  // The frequent writes (a resume position every 15s, a completion) on a lesson already in the
  // record need no read-modify-write: a keyed `set` of one field, or a `setIfMissing` that can never
  // overwrite an earlier completion, is atomic on the server, so parallel saves cannot contend.
  if (update.type !== "quiz") {
    const exists = await writeClient.fetch<boolean>(`count(*[_id == $id][0].lessons[_key == $key]) > 0`, { id, key }, { cache: "no-store" });
    if (exists) {
      const path = `lessons[_key=="${key}"]`;
      const now = new Date().toISOString();
      const lastLesson = { _type: "reference", _ref: update.lessonId, _weak: true };
      const patch = writeClient.patch(id).set({ lastLesson, [`${path}.updatedAt`]: now });
      await (update.type === "position"
        ? patch.set({ [`${path}.positionSeconds`]: Math.max(0, Math.round(update.seconds)) })
        : patch.setIfMissing({ [`${path}.completedAt`]: now })
      ).commit();
      return { duplicate: false };
    }
  }

  // A lesson's first entry, and quiz grades (best score, de-duplicated attempts), merge with what is
  // stored, so they go through compare-and-set.
  return compareAndSet(
    id,
    () => writeClient.fetch<{ _rev: string; entry: StoredLesson | null } | null>(
      `*[_id == $id][0]{_rev, "entry": lessons[_key == $key][0]}`,
      { id, key },
      { cache: "no-store" },
    ),
    ({ entry: current }) => {
      const now = new Date().toISOString();
      const next: StoredLesson = {
        ...(current ?? {}),
        _key: key,
        lesson: { _type: "reference", _ref: update.lessonId, _weak: true } as StoredLesson["lesson"],
        updatedAt: now,
      };

      if (update.type === "position") next.positionSeconds = Math.max(0, Math.round(update.seconds));
      if (update.type === "complete") next.completedAt = current?.completedAt ?? now;
      if (update.type === "quiz") {
        const seen = current?.attemptIds ?? [];
        if (seen.includes(update.attemptId)) return { patch: null, result: { duplicate: true } };
        // Keep the best attempt, and finishing the quiz counts as finishing the lesson.
        next.quizScore = Math.max(current?.quizScore ?? 0, update.score);
        next.quizTotal = update.total;
        next.quizAttempts = (current?.quizAttempts ?? 0) + 1;
        next.attemptIds = [...seen, update.attemptId].slice(-REMEMBERED_ATTEMPTS);
        next.completedAt = current?.completedAt ?? now;
      }

      const lastLesson = { _type: "reference", _ref: update.lessonId, _weak: true };
      return {
        patch: (patch) =>
          current
            ? patch.set({ lastLesson, [`lessons[_key=="${key}"]`]: next })
            : patch.set({ lastLesson }).setIfMissing({ lessons: [] }).append("lessons", [next]),
        result: { duplicate: false },
      };
    },
  );
}
