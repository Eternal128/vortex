"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { formatCount } from "@/lib/format";
import { LEARNERS_CHANGED_EVENT, LESSON_COMPLETE_EVENT } from "@/lib/progress/client";
import { cn } from "@/lib/utils";

/** Mirrors `LearnerCounts` in lib/learners.ts, which is server-only. */
export interface LearnerCountsData {
  courses: Record<string, number>;
  lessons: Record<string, number>;
  total: number;
}

/** While the tab is visible, counts refresh this often. */
const POLL_MS = 15_000;

const LearnerCountsContext = createContext<LearnerCountsData | null>(null);

/**
 * Keeps learner counts live without a reload: the server renders the first numbers, then this polls
 * the public, aggregate-only `/api/learners` while the tab is visible, and refetches at once when
 * this learner enrolls or saves progress.
 */
export function LearnerCountsProvider({ initial, children }: { initial: LearnerCountsData; children: ReactNode }) {
  const [counts, setCounts] = useState(initial);
  // A server re-render (router.refresh after enrolling) brings newer numbers; take them.
  const [seen, setSeen] = useState(initial);
  if (initial !== seen) {
    setSeen(initial);
    setCounts(initial);
  }

  useEffect(() => {
    let active = true;
    let pending: ReturnType<typeof setTimeout> | undefined;
    let last = Date.now();

    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      last = Date.now();
      fetch("/api/learners", { cache: "no-store" })
        .then((response) => (response.ok ? (response.json() as Promise<LearnerCountsData>) : null))
        .then((next) => {
          if (active && next) setCounts(next);
        })
        .catch(() => {});
    };
    const soon = () => {
      clearTimeout(pending);
      pending = setTimeout(refresh, 400);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - last > POLL_MS) refresh();
    };

    const interval = setInterval(refresh, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(LEARNERS_CHANGED_EVENT, soon);
    window.addEventListener(LESSON_COMPLETE_EVENT, soon);
    return () => {
      active = false;
      clearInterval(interval);
      clearTimeout(pending);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(LEARNERS_CHANGED_EVENT, soon);
      window.removeEventListener(LESSON_COMPLETE_EVENT, soon);
    };
  }, []);

  return <LearnerCountsContext.Provider value={counts}>{children}</LearnerCountsContext.Provider>;
}

interface LiveLearnersProps {
  kind: "course" | "lesson";
  id: string;
  /** Shown instead of the count while it is zero. Nothing by default. */
  zero?: ReactNode;
  /** Rendered before the number, e.g. a people icon. */
  icon?: ReactNode;
  /** `li` for meta lists, so a zero count leaves no empty item behind. */
  as?: "span" | "li";
  className?: string;
}

/** "Intermediate · 12 learners", with the count live and left out while it is zero. */
export function LevelAndLearners({ level, courseId, className }: { level: string; courseId: string; className?: string }) {
  const counts = useContext(LearnerCountsContext);
  const hasLearners = (counts?.courses[courseId] ?? 0) > 0;
  if (!level && !hasLearners) return null;
  return (
    <span className={className}>
      {level}
      {level && hasLearners ? " · " : null}
      <LiveLearners kind="course" id={courseId} />
    </span>
  );
}

/** "12 learners", live. A number that changes on screen briefly highlights (not under reduced motion). */
export function LiveLearners({ kind, id, zero = null, icon, as: Tag = "span", className }: LiveLearnersProps) {
  const counts = useContext(LearnerCountsContext);
  const value = (kind === "course" ? counts?.courses[id] : counts?.lessons[id]) ?? 0;
  const [first] = useState(value);

  if (!value) return <>{zero}</>;
  return (
    <Tag className={cn("tabular", className)}>
      {icon}
      <span>
        <span key={value} className={value !== first ? "learner-tick" : undefined}>
          {formatCount(value)}
        </span>{" "}
        {value === 1 ? "learner" : "learners"}
      </span>
    </Tag>
  );
}
