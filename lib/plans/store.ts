import "server-only";

import { randomBytes } from "node:crypto";

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

const PLAN_FIELDS = `
  "key": string::split(_id, ".")[2], goal, level, pace, title, summary, createdAt,
  modules[]{_key, title, lessons[]{
    _key, title, objective, videoId, videoUrl, videoTitle, channel, durationSeconds, thumbnailUrl,
    completedAt, quizScore, quizTotal, quiz
  }}
`;

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

export async function listPlans(userId: string): Promise<Plan[]> {
  return writeClient.fetch<Plan[]>(
    `*[_type == "plan" && userId == $userId] | order(createdAt desc){${PLAN_FIELDS}}`,
    { userId },
    { cache: "no-store" },
  );
}

/** For the daily limit. */
export async function countPlansSince(userId: string, since: Date): Promise<number> {
  return writeClient.fetch<number>(
    `count(*[_type == "plan" && userId == $userId && createdAt > $since])`,
    { userId, since: since.toISOString() },
    { cache: "no-store" },
  );
}

export async function deletePlan(userId: string, key: string) {
  await writeClient.delete(planId(userId, key));
}

/**
 * Sets fields on one lesson. Both keys come from `findLesson` on the stored plan, never from input
 * directly. The module is addressed by key: a wildcard over modules is silently ignored by the API.
 */
export async function updatePlanLesson(
  userId: string,
  key: string,
  target: { moduleKey: string; lessonKey: string },
  fields: Partial<Pick<PlanLesson, "completedAt" | "quizScore" | "quizTotal" | "quiz">>,
) {
  const path = `modules[_key=="${target.moduleKey}"].lessons[_key=="${target.lessonKey}"]`;
  const set = Object.fromEntries(Object.entries(fields).map(([name, value]) => [`${path}.${name}`, value]));
  await writeClient.patch(planId(userId, key)).set(set).commit();
}

export function findLesson(plan: Plan, lessonKey: string) {
  const flat = plan.modules.flatMap((module) => module.lessons);
  const index = flat.findIndex((lesson) => lesson._key === lessonKey);
  if (index < 0) return null;
  const moduleKey = plan.modules.find((module) => module.lessons.some((lesson) => lesson._key === lessonKey))!._key;
  return { lesson: flat[index], index, flat, target: { moduleKey, lessonKey } };
}
