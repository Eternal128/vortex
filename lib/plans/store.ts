import "server-only";

import { randomBytes } from "node:crypto";

import { compareAndSet } from "@/sanity/lib/cas";
import { writeClient } from "@/sanity/lib/write-client";

import type { PlanQuiz } from "./quiz";
import type { PlanVideo } from "./youtube";

export interface PlanLesson extends PlanVideo {
  _key: string;
  title: string;
  objective: string;
  completedAt: string | null;
  quizScore: number | null;
  quizTotal: number | null;
  quiz: PlanQuiz | null;
}

export interface PlanModule {
  _key: string;
  title: string;
  lessons: PlanLesson[];
}

export interface Plan {
  key: string;
  goal: string;
  level: string;
  pace: string;
  title: string;
  summary: string;
  createdAt: string;
  modules: PlanModule[];
}

/**
 * The owner is part of the id, so a plan can only ever be addressed through its owner's session:
 * another learner's key resolves to a different, nonexistent document. The dot keeps it private.
 */
function planId(userId: string, key: string) {
  return `plan.${userId}.${key}`;
}

const PLAN_LESSON_FIELDS = `
  _key, title, objective, videoId, videoUrl, videoTitle, channel, durationSeconds, thumbnailUrl,
  completedAt, quizScore, quizTotal, quiz
`;

const PLAN_FIELDS = `
  "key": string::split(_id, ".")[2], goal, level, pace, title, summary, createdAt,
  modules[]{_key, title, lessons[]{${PLAN_LESSON_FIELDS}}}
`;

/** Saves a newly built plan for its owner and returns its key. */
export async function createPlan(
  userId: string,
  plan: Omit<Plan, "key" | "createdAt">,
): Promise<string> {
  const key = randomBytes(5).toString("hex");
  await writeClient.create({
    _id: planId(userId, key),
    _type: "plan",
    userId,
    goal: plan.goal,
    level: plan.level,
    pace: plan.pace,
    title: plan.title,
    summary: plan.summary,
    createdAt: new Date().toISOString(),
    modules: plan.modules.map((module) => ({
      _key: module._key,
      _type: "planModule",
      title: module.title,
      lessons: module.lessons.map((lesson) => ({ ...lesson, _type: "planLesson", quiz: undefined })),
    })),
  });
  return key;
}

/** Owner-only by construction; null for a missing plan or someone else's key. */
export async function getPlan(userId: string, key: string): Promise<Plan | null> {
  if (!/^[a-f0-9]{10}$/.test(key)) return null;
  return writeClient.fetch<Plan | null>(`*[_id == $id && userId == $userId][0]{${PLAN_FIELDS}}`, {
    id: planId(userId, key),
    userId,
  }, { cache: "no-store" });
}

/** The learner's plans, newest first. */
export async function listPlans(userId: string): Promise<Plan[]> {
  return writeClient.fetch<Plan[]>(
    `*[_type == "plan" && userId == $userId] | order(createdAt desc){${PLAN_FIELDS}}`,
    { userId },
    { cache: "no-store" },
  );
}

/** Deletes one of the learner's plans (a key belonging to someone else addresses nothing). */
export async function deletePlan(userId: string, key: string) {
  await writeClient.delete(planId(userId, key));
}

type LessonFields = Partial<Pick<PlanLesson, "completedAt" | "quizScore" | "quizTotal" | "quiz">>;

/**
 * Race-safe change to one lesson of the learner's own plan: reads the plan with its revision, lets
 * `change` compute the new fields from the lesson as stored, and commits only if nothing wrote in
 * between (retrying otherwise). `change` returns `fields: null` to write nothing. Resolves to null
 * when the plan or lesson does not exist for this owner. The module is addressed by key: a
 * wildcard over modules is silently ignored by the API.
 */
export async function changePlanLesson<Result>(
  userId: string,
  key: string,
  lessonKey: string,
  change: (lesson: PlanLesson) => { fields: LessonFields | null; result: Result },
): Promise<Result | null> {
  if (!/^[a-f0-9]{10}$/.test(key)) return null;
  const id = planId(userId, key);
  return compareAndSet(
    id,
    async () =>
      (await writeClient.fetch<{ _rev: string; modules: PlanModule[] } | null>(
        `*[_id == $id && userId == $userId][0]{_rev, modules[]{_key, lessons[]{${PLAN_LESSON_FIELDS}}}}`,
        { id, userId },
        { cache: "no-store" },
      )) ?? { _rev: "", modules: [] },
    (doc) => {
      const planModule = doc.modules.find((item) => item.lessons.some((lesson) => lesson._key === lessonKey));
      const lesson = planModule?.lessons.find((item) => item._key === lessonKey);
      if (!planModule || !lesson) return { patch: null, result: null };
      const { fields, result } = change(lesson);
      if (!fields) return { patch: null, result };
      const path = `modules[_key=="${planModule._key}"].lessons[_key=="${lessonKey}"]`;
      const set = Object.fromEntries(Object.entries(fields).map(([name, value]) => [`${path}.${name}`, value]));
      return { patch: (patch) => patch.set(set), result };
    },
  );
}

/** A lesson of a loaded plan, with its position and the keys a later update addresses it by. */
export function findLesson(plan: Plan, lessonKey: string) {
  const flat = plan.modules.flatMap((module) => module.lessons);
  const index = flat.findIndex((lesson) => lesson._key === lessonKey);
  if (index < 0) return null;
  const moduleKey = plan.modules.find((module) => module.lessons.some((lesson) => lesson._key === lessonKey))!._key;
  return { lesson: flat[index], index, flat, target: { moduleKey, lessonKey } };
}
