"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

const EXAMPLES = ["Cook weeknight dinners", "Learn Spanish basics", "Start running", "Play guitar chords"];

/**
 * "Build your own plan" on home: a goal field that hands off to /plans/new, which asks the learner
 * to sign in first if needed.
 */
export function PlanTeaser() {
  const router = useRouter();
  const [goal, setGoal] = useState("");

  function go(value: string) {
    const trimmed = value.trim();
    router.push(trimmed ? `/plans/new?goal=${encodeURIComponent(trimmed)}` : "/plans/new");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    go(goal);
  }

  return (
    <section aria-labelledby="plan-teaser" className="rounded-lg border border-canvas-line bg-surface p-6 sm:p-10">
      <p className="flex items-center gap-2 text-action text-primary-600">
        <Sparkles className="size-4" strokeWidth={2} aria-hidden />
        Build your own plan
      </p>
      <h2 id="plan-teaser" className="mt-2 max-w-2xl text-display-2 text-neutral-900">
        Learn anything. Vortex builds the course.
      </h2>
      <p className="mt-3 max-w-2xl text-body-lg text-neutral-500">
        Tell us your goal. We design a step-by-step syllabus and find the best YouTube video for every
        lesson, with progress tracking and a quiz after each one.
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="plan-teaser-goal" className="sr-only">
          What do you want to learn?
        </label>
        <input
          id="plan-teaser-goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          maxLength={120}
          placeholder="I want to learn how to…"
          className="h-12 min-w-0 flex-1 rounded-md border border-field-line bg-surface px-4 text-body-lg text-neutral-900 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
        />
        <Button type="submit" size="xl" icon={<ArrowRight className="size-5" strokeWidth={2} aria-hidden />}>
          Build my plan
        </Button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => go(example)}
            className="rounded-full border border-neutral-200 px-3 py-1.5 text-small text-neutral-700 transition-colors hover:border-primary-500 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {example}
          </button>
        ))}
      </div>
    </section>
  );
}
