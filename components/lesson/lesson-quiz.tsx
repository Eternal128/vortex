"use client";

import { ArrowRight, CheckCircle2, ListChecks, Lock, RotateCcw, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { VortexLoader } from "@/components/ui/vortex-loader";
import { LESSON_COMPLETE_EVENT, QUIZ_OPEN_EVENT, sendProgress } from "@/lib/progress/client";
import { cn } from "@/lib/utils";

export interface QuizOption {
  _key: string;
  text: string | null;
  isCorrect: boolean | null;
  feedback: string | null;
}

export interface QuizQuestion {
  _key: string;
  prompt: string | null;
  options: QuizOption[] | null;
}

/** Two of three right is a pass, as a percentage so any quiz length works. */
const PASS_RATIO = 2 / 3;

interface LessonQuizProps {
  lessonId: string;
  /** Null for a plan lesson whose quiz is written on first open; `loadQuestions` supplies it. */
  questions: QuizQuestion[] | null;
  loadQuestions?: () => Promise<QuizQuestion[]>;
  /** Save the score to the learner's record: true only when signed in. */
  saveProgress: boolean;
  /** Best earlier score and attempt count, from the progress record. */
  bestScore: number | null;
  attempts?: number;
  /** The lesson is already finished, so the quiz starts unlocked. */
  unlocked?: boolean;
  /** Where the results screen's "Next lesson" goes. */
  nextHref?: string | null;
  /**
   * Where the answers go instead of the course progress route: plan lessons save to their plan.
   * The server grades them; `attemptId` lets it ignore a retried submission.
   */
  onFinish?: (answers: Record<string, string>, attemptId: string) => void | Promise<void>;
}

type Phase = "locked" | "loading" | "error" | "ready" | "taking" | "results";

/** Generated feedback often opens with its own verdict ("Correct –"); the card already says it. */
function withoutVerdict(feedback: string | null) {
  const text = (feedback ?? "").replace(/^(correct|incorrect|wrong|right|not quite|yes|no)\s*[–—:,.!-]\s+/i, "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const percent = (score: number, total: number) => (total ? Math.round((score / total) * 100) : 0);

/**
 * The end-of-lesson quiz, Coursera-style: it unlocks when the video ends (or on request), every
 * question is answered before one Submit, then the grade, pass or not, and each question's feedback.
 * Retakes are unlimited and the highest grade is kept.
 *
 * Answers ship with the page so grading is instant. That suits self-check practice; it is not an exam.
 */
export function LessonQuiz({
  lessonId,
  questions: initialQuestions,
  loadQuestions,
  saveProgress,
  bestScore: initialBest,
  attempts: initialAttempts = 0,
  unlocked = false,
  nextHref = null,
  onFinish,
}: LessonQuizProps) {
  const router = useRouter();
  const baseId = useId();
  const cardRef = useRef<HTMLElement>(null);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(initialQuestions);
  const [phase, setPhase] = useState<Phase>(unlocked ? "ready" : "locked");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number | null>(initialBest);
  const [attempts, setAttempts] = useState(initialAttempts);

  // Opening needs the questions; a plan lesson writes them now, the first time.
  const openQuiz = useCallback(
    (start: boolean) => {
      const next: Phase = start ? "taking" : "ready";
      if (questions?.length || !loadQuestions) {
        setPhase(next);
        return;
      }
      setPhase("loading");
      loadQuestions().then(
        (loaded) => {
          setQuestions(loaded);
          setPhase(next);
        },
        () => setPhase("error"),
      );
    },
    [questions, loadQuestions],
  );

  // The window listeners read the latest opener and phase without re-subscribing.
  const latest = useRef({ openQuiz, phase });
  useEffect(() => {
    latest.current = { openQuiz, phase };
  });

  useEffect(() => {
    const matches = (event: Event) => (event as CustomEvent<{ lessonId: string }>).detail?.lessonId === lessonId;
    const onComplete = (event: Event) => {
      if (matches(event) && latest.current.phase === "locked") latest.current.openQuiz(false);
    };
    const onOpen = (event: Event) => {
      if (matches(event)) latest.current.openQuiz(true);
    };
    window.addEventListener(LESSON_COMPLETE_EVENT, onComplete);
    window.addEventListener(QUIZ_OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener(LESSON_COMPLETE_EVENT, onComplete);
      window.removeEventListener(QUIZ_OPEN_EVENT, onOpen);
    };
  }, [lessonId]);

  const list = questions ?? [];
  const total = list.length;
  const answered = list.filter((question) => answers[question._key]).length;

  function start() {
    setAnswers({});
    openQuiz(true);
  }

  function submit() {
    const right = list.filter(
      (question) => question.options?.find((option) => option._key === answers[question._key])?.isCorrect === true,
    ).length;
    setScore(right);
    setBest((current) => Math.max(current ?? 0, right));
    setAttempts((current) => current + 1);
    setPhase("results");
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // The grade shown here is for the learner; the stored one is computed by the server from the
    // same answers, so the two always agree.
    const attemptId = crypto.randomUUID();
    const saved = onFinish
      ? Promise.resolve(onFinish(answers, attemptId))
      : saveProgress
        ? sendProgress({ type: "quiz", lessonId, answers, attemptId })
        : Promise.resolve();
    // The sidebar's quiz mark and the course percentage come from the server.
    void saved.then(() => router.refresh());
  }

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id={`${baseId}-title`} className="flex items-center gap-2 text-heading-2 text-neutral-900">
        <ListChecks className="size-5 text-primary-600" strokeWidth={2} aria-hidden />
        Check your understanding
      </h2>
      {phase === "taking" && (
        <p className="text-body text-neutral-500" aria-live="polite">
          {answered} of {total} answered
        </p>
      )}
    </div>
  );

  return (
    <section
      ref={cardRef}
      id="lesson-quiz"
      aria-labelledby={`${baseId}-title`}
      className={cn(
        "scroll-mt-24 rounded-lg border bg-surface p-5 transition-[border-color,box-shadow] duration-300 sm:p-7",
        phase === "locked" ? "border-dashed border-neutral-200" : "border-neutral-200",
      )}
    >
      {header}

      {phase === "locked" && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-body-lg text-neutral-500">
            <Lock className="size-4" strokeWidth={2} aria-hidden />
            {total || loadQuestions ? "3 questions. Unlocks when you finish the video." : "Unlocks when you finish the video."}
          </p>
          <button
            type="button"
            onClick={() => openQuiz(true)}
            className="rounded-xs text-action text-primary-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Take it now
          </button>
        </div>
      )}

      {phase === "loading" && (
        <div className="mt-6 flex flex-col items-center py-6 text-center">
          <VortexLoader size={44} />
          <p className="mt-4 text-heading-3 text-neutral-900" aria-live="polite">
            Writing your quiz from this video…
          </p>
          <p className="mt-1 text-body text-neutral-500">Only the first time. It&rsquo;s saved for next time.</p>
        </div>
      )}

      {phase === "error" && (
        <div className="mt-4">
          <p className="text-body-lg text-neutral-700">We couldn&rsquo;t write a quiz for this video just now.</p>
          <Button variant="tertiary" size="md" className="mt-4" onClick={() => openQuiz(true)}>
            <RotateCcw className="size-4" strokeWidth={2} aria-hidden />
            Try again
          </Button>
        </div>
      )}

      {phase === "ready" && (
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-body-lg text-neutral-700">
              {total} questions. Pass mark 67%. Your highest grade is kept.
            </p>
            {best !== null && total > 0 && (
              <p className="mt-1 text-body text-neutral-500">
                Best so far: <span className="font-semibold text-neutral-900">{percent(best, total)}%</span>
                {best / total >= PASS_RATIO - 1e-9 ? " · Passed" : ""} · {attempts} {attempts === 1 ? "attempt" : "attempts"}
              </p>
            )}
          </div>
          <Button size="md" onClick={start}>
            {best !== null ? "Retake quiz" : "Start quiz"}
          </Button>
        </div>
      )}

      {phase === "taking" && (
        <form
          className="mt-6 flex flex-col gap-7"
          onSubmit={(event) => {
            event.preventDefault();
            if (answered === total) submit();
          }}
        >
          {list.map((question, index) => (
            <fieldset key={question._key}>
              <legend className="text-heading-3 text-neutral-900">
                {index + 1}. {question.prompt}
              </legend>
              <div className="mt-3 flex flex-col gap-2">
                {(question.options ?? []).map((option) => {
                  const chosen = answers[question._key] === option._key;
                  return (
                    <label
                      key={option._key}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 text-body-lg transition-colors hover:border-primary-500",
                        chosen ? "border-primary-500 bg-primary-50 text-neutral-900" : "border-neutral-200 text-neutral-700",
                      )}
                    >
                      <input
                        type="radio"
                        name={`${baseId}-${question._key}`}
                        value={option._key}
                        checked={chosen}
                        onChange={() => setAnswers((current) => ({ ...current, [question._key]: option._key }))}
                        className="mt-1 size-4 shrink-0 accent-primary-500"
                      />
                      <span className="flex-1">{option.text}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" size="lg" disabled={answered < total}>
              Submit
            </Button>
            {answered < total && <p className="text-body text-neutral-500">Answer every question to submit.</p>}
          </div>
        </form>
      )}

      {phase === "results" && (
        <div className="mt-6" aria-live="polite">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
            <div>
              <p className="text-body text-neutral-500">Your grade</p>
              <p className="text-display-1 text-neutral-900 tabular">{percent(score, total)}%</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {score / total >= PASS_RATIO - 1e-9 ? (
                <span className="w-fit rounded-full bg-success-soft px-3 py-1 text-action text-success">Passed</span>
              ) : (
                <span className="w-fit rounded-full bg-error-soft px-3 py-1 text-action text-error">Not passed yet</span>
              )}
              <p className="text-body text-neutral-500">
                {score} of {total} correct · To pass: 67% or higher · Highest grade kept · Attempt {attempts}
              </p>
            </div>
          </div>

          <ol className="mt-6 flex flex-col gap-3">
            {list.map((question, index) => {
              const options = question.options ?? [];
              const chosen = options.find((option) => option._key === answers[question._key]);
              const correct = options.find((option) => option.isCorrect);
              const right = chosen?.isCorrect === true;
              return (
                <li
                  key={question._key}
                  className={cn("rounded-md border-l-4 px-4 py-3", right ? "border-success bg-success-soft" : "border-error bg-error-soft")}
                >
                  <p className="flex items-start gap-2 text-heading-3 text-neutral-900">
                    {right ? (
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" strokeWidth={2} aria-label="Correct" />
                    ) : (
                      <XCircle className="mt-0.5 size-5 shrink-0 text-error" strokeWidth={2} aria-label="Incorrect" />
                    )}
                    {index + 1}. {question.prompt}
                  </p>
                  <p className="mt-1.5 text-body-lg text-neutral-700">
                    {right ? "" : <span className="font-semibold text-neutral-900">Your answer: {chosen?.text}. </span>}
                    {withoutVerdict(chosen?.feedback ?? null)}
                  </p>
                  {!right && correct && (
                    <p className="mt-1.5 text-body-lg text-neutral-700">
                      <span className="font-semibold text-neutral-900">The right answer: </span>
                      {correct.text}. {withoutVerdict(correct.feedback)}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>

          {!saveProgress && !onFinish && (
            <p className="mt-4 text-body text-neutral-500">Sign in to save your grade and progress.</p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="tertiary" size="md" onClick={start}>
              <RotateCcw className="size-4" strokeWidth={2} aria-hidden />
              Retake quiz
            </Button>
            {nextHref && (
              <Link href={nextHref} className={buttonClasses({ size: "md" })}>
                Next lesson
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
