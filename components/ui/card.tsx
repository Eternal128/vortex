import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Shared card surface: 1px hairline border, 16px radius, no shadow. The border carries the
 * elevation so a dense grid stays visually tight; shadows are kept for genuinely floating things.
 */
export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-neutral-200 bg-surface p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Meta row pinned to the bottom of a card, separated from the body. */
export function CardFooter({ children, className }: CardProps) {
  return (
    <div className={cn("mt-auto flex items-center justify-between gap-4 pt-5", className)}>
      {children}
    </div>
  );
}
