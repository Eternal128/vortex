"use client";

import { ArrowUp, Check, ChevronDown, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { LogoMark } from "@/components/brand/logo";
import { VortexLoader } from "@/components/ui/vortex-loader";
import { GOAL_MAX, GOAL_MIN } from "@/lib/plans/limits";
import { cn } from "@/lib/utils";

/** Written the way people actually describe a goal, so the examples teach the input. */
const EXAMPLES = [
  "Cook healthy dinners for two in under 30 minutes",
  "Hold a simple conversation in Spanish before my trip",
  "Go from the couch to running a 5K",
  "Draw realistic portraits with just a pencil",
];

const LEVELS = [
  { value: "new", label: "New to it" },
  { value: "some", label: "Some experience" },
  { value: "advanced", label: "Advanced" },
] as const;

const PACES = [
  { value: "15", label: "15 min a day" },
  { value: "30", label: "30 min a day" },
  { value: "60", label: "1 hour a day" },
] as const;

/** What the server is doing, in order. The request is one call, so these advance on a timer. */
const STEPS = ["Designing your syllabus", "Finding the best videos on YouTube", "Checking every video", "Building your playlist"];

/** Tallest the composer grows before it scrolls, in px. */
const MAX_FIELD_HEIGHT = 240;

type Level = (typeof LEVELS)[number]["value"];
type Pace = (typeof PACES)[number]["value"];

const noSubscribe = () => () => {};

/** Time-of-day greeting, read from the learner's own clock. The server renders the neutral one. */
function useGreeting() {
  return useSyncExternalStore(
    noSubscribe,
    () => {
      const hour = new Date().getHours();
      return hour < 5 ? "Hello" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    },
    () => "Hello",
  );
}

/**
 * The personal plan composer: describe a goal, pick a level and pace, and Vortex builds the plan.
 * While it builds, the goal stays on screen as a message and the steps tick through below it.
 */
export function PlanBuilderForm({ initialGoal = "", firstName }: { initialGoal?: string; firstName: string | null }) {
  const router = useRouter();
  const id = useId();
  const greeting = useGreeting();
  const field = useRef<HTMLTextAreaElement>(null);
  const [goal, setGoal] = useState(initialGoal);
  const [level, setLevel] = useState<Level>("new");
  const [pace, setPace] = useState<Pace>("30");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ready = goal.trim().length >= GOAL_MIN;

  // Grow with the text, like a chat composer, up to a ceiling.
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_FIELD_HEIGHT)}px`;
  }, [goal, busy]);

  // Focus the composer on arrival and after an error, with the caret after any prefilled goal.
  useEffect(() => {
    if (busy) return;
    const el = field.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [busy]);

  useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(() => setStep((current) => Math.min(current + 1, STEPS.length - 1)), 4500);
    return () => window.clearInterval(timer);
  }, [busy]);

  function pickExample(example: string) {
    setGoal(example);
    field.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!ready) {
      setError("Tell us what you want to learn.");
      field.current?.focus();
      return;
    }
    setBusy(true);
    setStep(0);
    setError(null);
    setRefusal(null);
    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ goal: goal.trim(), level, pace }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.key) {
        router.push(`/plans/${data.key}`);
        return;
      }
      if (data.refusal) setRefusal(data.refusal);
      else setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("We couldn't reach Vortex. Check your connection and try again.");
    }
    setBusy(false);
  }

  if (busy) {
    return (
      <div className="compose-in w-full max-w-180" aria-busy>
        <div className="flex justify-end">
          <p className="max-w-[85%] rounded-2xl rounded-br-md bg-neutral-100 px-5 py-3.5 text-body-lg break-words whitespace-pre-line text-neutral-900">
            {goal.trim()}
          </p>
        </div>

        <div className="mt-10 flex gap-4 sm:gap-5">
          <VortexLoader size={36} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-heading-3 text-neutral-900">Building your plan</p>
            <ol className="mt-4 flex flex-col gap-3">
              {STEPS.map((label, i) => {
                const state = i < step ? "done" : i === step ? "current" : "next";
                return (
                  <li
                    key={label}
                    className={cn(
                      "flex items-center gap-3 text-body transition-colors duration-500",
                      state === "next" ? "text-neutral-400" : "text-neutral-900",
                    )}
                    aria-current={state === "current" ? "step" : undefined}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-500",
                        state === "done" && "border-neutral-900 bg-neutral-900 text-canvas",
                        state === "current" && "border-brand-500",
                        state === "next" && "border-neutral-300",
                      )}
                    >
                      {state === "done" ? <Check className="size-3" strokeWidth={3} /> : null}
                      {state === "current" ? <span className="size-2 animate-pulse rounded-full bg-brand-500" /> : null}
                    </span>
                    {label}
                  </li>
                );
              })}
            </ol>
            <p className="sr-only" aria-live="polite">
              {STEPS[step]}
            </p>
            <p className="mt-6 text-small text-neutral-500">This usually takes 10 to 25 seconds. Your plan opens when it&rsquo;s ready.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-180">
      <div className="compose-in flex flex-col items-center text-center">
        <p className="eyebrow flex items-center gap-2 text-neutral-500">
          <Sparkles className="size-3.5 text-brand-600" strokeWidth={2} aria-hidden />
          Build your own plan
        </p>
        <h1 className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[34px] leading-[1.1] font-semibold tracking-display text-balance text-neutral-900 sm:text-[48px]">
          <LogoMark size={40} className="hidden sm:block" />
          {greeting}
          {firstName ? (
            <>
              , <span className="font-pixel font-normal tracking-[-0.02em]">{firstName}</span>
            </>
          ) : null}
        </h1>
        <p className="mt-3 text-body-lg text-neutral-500">
          Describe what you want to learn. Vortex designs the syllabus and finds a video for every lesson.
        </p>
      </div>

      <form onSubmit={onSubmit} className="compose-in mt-10 [animation-delay:80ms]">
        {(refusal || error) && (
          <p role="alert" className="mb-4 rounded-md border-l-4 border-error bg-error-soft px-4 py-3 text-body text-neutral-900">
            {refusal ?? error}
          </p>
        )}

        <div className="rounded-2xl border border-canvas-line bg-surface shadow-md transition-[border-color,box-shadow] focus-within:border-neutral-400 focus-within:shadow-lg">
          <label htmlFor={`${id}-goal`} className="sr-only">
            What do you want to learn?
          </label>
          <textarea
            ref={field}
            id={`${id}-goal`}
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            onKeyDown={onKeyDown}
            maxLength={GOAL_MAX}
            rows={3}
            enterKeyHint="send"
            placeholder="I want to learn how to…"
            className="block w-full resize-none bg-transparent px-5 pt-5 pb-2 text-body-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-2 px-3 pt-1 pb-3 sm:px-4">
            <PillSelect label="Your level" value={level} options={LEVELS} onChange={setLevel} />
            <PillSelect label="Your pace" value={pace} options={PACES} onChange={setPace} />
            <div className="ml-auto flex items-center gap-3">
              {goal.length > GOAL_MAX - 60 ? (
                <span className="font-mono text-caption text-neutral-500 tabular">
                  {goal.length}/{GOAL_MAX}
                </span>
              ) : null}
              <button
                type="submit"
                disabled={!ready}
                aria-label="Build my plan"
                className={cn(
                  "flex size-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                  ready ? "bg-neutral-900 text-canvas shadow-press hover:bg-neutral-700" : "cursor-not-allowed bg-neutral-100 text-neutral-400",
                )}
              >
                <ArrowUp className="size-5" strokeWidth={2.25} aria-hidden />
              </button>
            </div>
          </div>
        </div>
        <p className="mt-3 hidden text-center text-caption text-neutral-500 sm:block">
          <kbd className="font-mono">Enter</kbd> to build · <kbd className="font-mono">Shift</kbd> + <kbd className="font-mono">Enter</kbd> for a new line · up to 5 plans a day
        </p>
      </form>

      <div className="compose-in mt-8 [animation-delay:160ms]">
        <p className="eyebrow text-center text-neutral-500">Or try one of these</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => pickExample(example)}
              className="rounded-full border border-canvas-line bg-surface px-4 py-2 text-small text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A native select dressed as a pill, so it stays accessible and opens the platform picker on mobile. */
function PillSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-9 cursor-pointer appearance-none rounded-full border border-neutral-200 bg-surface pr-8 pl-3.5 text-small text-neutral-700 transition-colors hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 size-4 text-neutral-500" strokeWidth={2} aria-hidden />
    </label>
  );
}
