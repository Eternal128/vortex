"use client";

import { useEffect } from "react";
import { LessonQuiz, type QuizQuestion } from "@/components/lesson/lesson-quiz";
import { LESSON_COMPLETE_EVENT } from "@/lib/progress/client";

interface PlanLessonClientProps {
  planKey: string;
  lessonKey: string;
  /** Matches the id LessonVideo reports completion with. */
  eventId: string;
  initialQuestions: QuizQuestion[] | null;
  bestScore: number | null;
  /** The lesson is already done, so its quiz starts unlocked. */
  completed: boolean;
  nextHref: string | null;
}

function post(url: string, body: unknown) {
  return fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

/** The plan lesson's quiz: the stored one, or written from the video's transcript on first request. */
async function requestQuiz(planKey: string, lessonKey: string): Promise<QuizQuestion[]> {
  const response = await post(`/api/plans/${planKey}/quiz`, { lessonKey });
  const data = await response.json();
  if (!response.ok || !data.quiz?.questions?.length) throw new Error("quiz unavailable");
  return data.quiz.questions;
}

/**
 * The plan lesson's live parts: completion is saved to the plan when the video ends, and the quiz
 * appears then, being written from the transcript the first time it is opened.
 */
export function PlanLessonClient({ planKey, lessonKey, eventId, initialQuestions, bestScore, completed, nextHref }: PlanLessonClientProps) {
  useEffect(() => {
    function onComplete(event: Event) {
      if ((event as CustomEvent<{ lessonId: string }>).detail?.lessonId !== eventId) return;
      void post(`/api/plans/${planKey}/progress`, { type: "complete", lessonKey }).catch(() => undefined);
    }
    window.addEventListener(LESSON_COMPLETE_EVENT, onComplete);
    return () => window.removeEventListener(LESSON_COMPLETE_EVENT, onComplete);
  }, [eventId, planKey, lessonKey]);

  return (
    <LessonQuiz
      lessonId={eventId}
      questions={initialQuestions}
      loadQuestions={() => requestQuiz(planKey, lessonKey)}
      saveProgress
      bestScore={bestScore}
      unlocked={completed}
      nextHref={nextHref}
      onFinish={async (answers, attemptId) => {
        await post(`/api/plans/${planKey}/progress`, { type: "quiz", lessonKey, answers, attemptId }).catch(() => undefined);
      }}
    />
  );
}
