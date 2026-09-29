import "server-only";

import { revalidateTag } from "next/cache";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import { LEARNER_COUNTS_QUERY } from "@/sanity/lib/queries";

/** How many people are learning each course and lesson. Aggregates only: no ids of people. */
export interface LearnerCounts {
  courses: Record<string, number>;
  lessons: Record<string, number>;
  /** People with any enrollment or lesson progress. */
  total: number;
}

/**
 * Counts learners from their progress records: a course's learners enrolled in it or have progress
 * on one of its lessons; a lesson's learners have progress on it. Cached under one tag that every
 * progress or enrollment write expires, so the next read is fresh.
 */
export async function getLearnerCounts(): Promise<LearnerCounts> {
  // Writes through the app expire the tag at once; the minute is a backstop for changes made
  // outside it (a record deleted in the Studio).
  const { progress, courses } = await sanityFetch({
    query: LEARNER_COUNTS_QUERY,
    tags: [CACHE_TAGS.learners],
    revalidate: 60,
  });

  const courseOfLesson = new Map<string, string>();
  for (const course of courses) {
    for (const lessonId of course.lessonIds ?? []) if (lessonId) courseOfLesson.set(lessonId, course._id);
  }

  const counts: LearnerCounts = { courses: {}, lessons: {}, total: 0 };
  for (const learner of progress) {
    const lessons = new Set((learner.lessons ?? []).filter((id): id is string => Boolean(id)));
    const inCourses = new Set((learner.courses ?? []).filter((id): id is string => Boolean(id)));
    for (const lessonId of lessons) {
      counts.lessons[lessonId] = (counts.lessons[lessonId] ?? 0) + 1;
      const courseId = courseOfLesson.get(lessonId);
      if (courseId) inCourses.add(courseId);
    }
    for (const courseId of inCourses) counts.courses[courseId] = (counts.courses[courseId] ?? 0) + 1;
    if (lessons.size || inCourses.size) counts.total += 1;
  }
  return counts;
}

/** Call after any progress or enrollment write, so the counts everyone sees update at once. */
export function expireLearnerCounts() {
  revalidateTag(CACHE_TAGS.learners, { expire: 0 });
}
