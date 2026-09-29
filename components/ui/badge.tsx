import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "video" | "lesson" | "popular" | "neutral" | "ink" | "outline";

const variants: Record<BadgeVariant, string> = {
  video: "bg-brand-100 text-brand-600",
  lesson: "bg-lesson-bg text-lesson-fg",
  popular: "bg-neutral-900 text-canvas",
  /** Quiet gray tag (`PLANNED`, `CONTENT`). */
  neutral: "bg-neutral-100 text-neutral-700",
  /** Solid ink tag (`TEAM`). */
  ink: "bg-neutral-900 text-canvas",
  outline: "border border-neutral-200 bg-surface text-neutral-700",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

/** Small mono tag, as the reference labels its cards (`TEAM`, `PLANNED`, `SOON`). */
export function Badge({ variant = "video", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-xs px-2 py-1 font-mono text-[11px] leading-3.5 font-medium tracking-[0.08em] uppercase",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
