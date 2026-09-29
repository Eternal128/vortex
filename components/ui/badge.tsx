import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "video" | "lesson" | "popular";

const variants: Record<BadgeVariant, string> = {
  video: "bg-primary-100 text-primary-600 font-semibold",
  lesson: "bg-lesson-bg text-lesson-fg font-semibold",
  popular: "bg-primary-100 text-primary-600 font-semibold",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = "video", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-xs px-2 py-1 text-small",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
