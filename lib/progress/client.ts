/** Client side of `/api/progress`: fire-and-forget, never blocking playback or the quiz. */

export type ProgressUpdate =
  | { type: "position"; lessonId: string; seconds: number }
  | { type: "complete"; lessonId: string }
  | { type: "quiz"; lessonId: string; score: number; total: number };

/** Fired on `window` when a lesson counts as finished, so the quiz card can respond. */
export const LESSON_COMPLETE_EVENT = "vortex:lesson-complete";

/** Fired on `window` when the learner asks for the quiz (the end-of-video prompt, or "take it now"). */
export const QUIZ_OPEN_EVENT = "vortex:quiz-open";

/**
 * `beacon` is for page exit: `sendBeacon` survives unload where a fetch may be cancelled.
 * Failures are swallowed — a missed save costs a resume point, not the lesson.
 */
export function sendProgress(update: ProgressUpdate, { beacon = false } = {}): Promise<void> {
  const body = JSON.stringify(update);
  if (beacon && typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon("/api/progress", new Blob([body], { type: "application/json" }));
    return Promise.resolve();
  }
  return fetch("/api/progress", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).then(
    () => undefined,
    () => undefined,
  );
}
