"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { VortexLoader } from "@/components/ui/vortex-loader";
import { cn } from "@/lib/utils";

const EXAMPLES = ["Cook healthy weeknight dinners", "Learn conversational Spanish", "Start running a 5K", "Draw portraits in pencil"];

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
const STEPS = ["Designing your syllabus…", "Finding the best videos on YouTube…", "Checking every video…", "Building your playlist…"];

export function PlanBuilderForm({ initialGoal = "" }: { initialGoal?: string }) {
  const router = useRouter();
  const id = useId();
  const [goal, setGoal] = useState(initialGoal);
  const [level, setLevel] = useState<(typeof LEVELS)[number]["value"]>("new");
  const [pace, setPace] = useState<(typeof PACES)[number]["value"]>("30");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(() => setStep((current) => Math.min(current + 1, STEPS.length - 1)), 4500);
    return () => window.clearInterval(timer);
  }, [busy]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (goal.trim().length < 3) {
      setError("Tell us what you want to learn.");
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
      <div className="flex flex-col items-center rounded-lg border border-canvas-line bg-surface px-6 py-16 text-center">
        <VortexLoader size={64} />
        <p className="mt-6 text-heading-2 text-neutral-900" aria-live="polite">
          {STEPS[step]}
        </p>
        <p className="mt-2 max-w-md text-body text-neutral-500">
          Building &ldquo;{goal.trim()}&rdquo;. This usually takes 10 to 25 seconds.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-canvas-line bg-surface p-6 sm:p-8">
      <label htmlFor={`${id}-goal`} className="text-heading-2 text-neutral-900">
        What do you want to learn?
      </label>
      <input
        id={`${id}-goal`}
        value={goal}
        onChange={(event) => setGoal(event.target.value)}
        maxLength={120}
        placeholder="e.g. Cook healthy weeknight dinners"
        className="mt-3 h-14 w-full rounded-md border border-field-line bg-surface px-4 text-body-lg text-neutral-900 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setGoal(example)}
            className="rounded-full border border-neutral-200 px-3 py-1.5 text-small text-neutral-700 transition-colors hover:border-primary-500 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {example}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <ChoiceGroup legend="Your level" name={`${id}-level`} options={LEVELS} value={level} onChange={setLevel} />
        <ChoiceGroup legend="Your pace" name={`${id}-pace`} options={PACES} value={pace} onChange={setPace} />
      </div>

      {(refusal || error) && (
        <p role="alert" className="mt-6 rounded-md border-l-4 border-error bg-error-soft px-4 py-3 text-body-lg text-neutral-900">
          {refusal ?? error}
        </p>
      )}

      <Button type="submit" size="xl" className="mt-8" icon={<ArrowRight className="size-5" strokeWidth={2} aria-hidden />}>
        <Sparkles className="size-5" strokeWidth={2} aria-hidden />
        Build my plan
      </Button>
      <p className="mt-3 text-small text-neutral-500">
        Vortex designs the syllabus, then picks one YouTube video per lesson. Up to 5 plans a day.
      </p>
    </form>
  );
}

function ChoiceGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-heading-3 text-neutral-900">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "cursor-pointer rounded-full border px-4 py-2 text-action transition-colors has-focus-visible:ring-2 has-focus-visible:ring-primary-500",
              value === option.value
                ? "border-primary-500 bg-primary-50 text-primary-600"
                : "border-neutral-200 text-neutral-700 hover:border-neutral-500",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
