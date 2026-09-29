"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type FormEvent } from "react";
import { SearchInput } from "@/components/ui/search-input";
import { GOAL_MAX, newPlanHrefFor } from "@/lib/plans/limits";

interface PlanPromptFormProps {
  id?: string;
  className?: string;
}

/**
 * The home hero's ⌘K bar: describe what you want to learn and it opens the plan builder with that
 * goal filled in. /plans/new is behind sign-in, and Clerk returns to it with the goal intact.
 */
export function PlanPromptForm({ id = "home-plan", className }: PlanPromptFormProps) {
  const router = useRouter();

  // On the home page ⌘ K belongs to this field. Capturing on window runs before the header search's
  // listener, which then never sees the event.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "k" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      document.getElementById(id)?.focus();
    }

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [id]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const field = new FormData(event.currentTarget).get("goal");
    const goal = typeof field === "string" ? field.trim() : "";
    if (!goal) {
      document.getElementById(id)?.focus();
      return;
    }
    router.push(newPlanHrefFor(goal));
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      <SearchInput
        id={id}
        name="goal"
        size="lg"
        label="Describe what you want to learn, and Vortex builds the plan"
        placeholder="Describe what you want to learn…"
        maxLength={GOAL_MAX}
        enterKeyHint="go"
        autoComplete="off"
        icon={<Sparkles className="size-6 shrink-0 text-brand-600" strokeWidth={1.75} aria-hidden />}
      />
    </form>
  );
}
