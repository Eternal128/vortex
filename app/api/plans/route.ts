import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { designPlan, LEVELS, PACES } from "@/lib/plans/design";
import { pickVideos } from "@/lib/plans/pick";
import { PLANS_PER_DAY, reservePlanBuild } from "@/lib/plans/quota";
import { createPlan, type PlanModule } from "@/lib/plans/store";
import { videoCandidates, YouTubeQuotaError, type PlanVideo } from "@/lib/plans/youtube";

/** One LLM call plus ~12 YouTube lookups. */
export const maxDuration = 60;

const MIN_LESSONS = 6;

const bodySchema = z.object({
  goal: z.string().trim().min(3).max(120),
  level: z.enum(LEVELS),
  pace: z.enum(PACES),
});

/**
 * Test hook for the admission check: with PLAN_BUILD_STUB=1 outside production, an admitted
 * request returns before any model or YouTube call, so the limit can be tested without spending
 * quota. Never honoured in production.
 */
const STUB_BUILDS = process.env.NODE_ENV !== "production" && process.env.PLAN_BUILD_STUB === "1";

/**
 * Builds a learner's plan: syllabus from the LLM (which may refuse), then one YouTube video per
 * lesson. The learner comes from Clerk, never from the body; nothing is saved on refusal or failure.
 * A build slot is reserved before any upstream call, so the daily limit bounds real work, including
 * refused, failed and parallel builds.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in to build a plan." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Tell us what you want to learn (3–120 characters)." }, { status: 400 });

  if (!(await reservePlanBuild(userId))) {
    return Response.json({ error: `You can build ${PLANS_PER_DAY} plans a day. Try again tomorrow.` }, { status: 429 });
  }
  if (STUB_BUILDS) return Response.json({ admitted: true }, { status: 202 });

  let outline;
  try {
    outline = await designPlan(parsed.data);
  } catch {
    return Response.json({ error: "We couldn't design a plan just now. Please try again." }, { status: 502 });
  }
  if (!outline.allowed) {
    return Response.json({ refusal: outline.refusal || "That isn't something we can build a plan for." }, { status: 422 });
  }

  // Candidates for every lesson in parallel, then assigned in order so no video repeats.
  const lessons = outline.modules.flatMap((module, m) => module.lessons.map((lesson, l) => ({ ...lesson, m, l })));
  let candidates: PlanVideo[][];
  try {
    candidates = await Promise.all(lessons.map((lesson) => videoCandidates(lesson.query).catch((error) => {
      if (error instanceof YouTubeQuotaError) throw error;
      return [];
    })));
  } catch (error) {
    if (error instanceof YouTubeQuotaError) {
      return Response.json({ error: "Plan building has reached today's YouTube limit. Please try again tomorrow." }, { status: 503 });
    }
    return Response.json({ error: "We couldn't reach YouTube just now. Please try again." }, { status: 502 });
  }

  // Relevance, not just search rank: the LLM picks per lesson from the candidates' titles.
  const chosen = await pickVideos(outline.title, lessons, candidates);
  const modules: PlanModule[] = outline.modules.map((module, m) => ({
    _key: `m${m}`,
    title: module.title,
    lessons: lessons.flatMap((lesson, index) => {
      if (lesson.m !== m) return [];
      const video = chosen[index];
      if (!video) return [];
      return [{
        _key: `${m}-${lesson.l}`,
        title: lesson.title,
        objective: lesson.objective,
        ...video,
        completedAt: null,
        quizScore: null,
        quizTotal: null,
        quiz: null,
      }];
    }),
  })).filter((module) => module.lessons.length > 0);

  if (modules.flatMap((module) => module.lessons).length < MIN_LESSONS) {
    return Response.json({ error: "We couldn't find enough good videos for that goal. Try wording it differently." }, { status: 422 });
  }

  const key = await createPlan(userId, {
    goal: parsed.data.goal,
    level: parsed.data.level,
    pace: parsed.data.pace,
    title: outline.title,
    summary: outline.summary,
    modules,
  });
  return Response.json({ key }, { status: 201 });
}
