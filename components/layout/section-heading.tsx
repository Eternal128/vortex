import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  /** Right-aligned action, e.g. "View all courses →". */
  action?: ReactNode;
  as?: "h1" | "h2";
  description?: ReactNode;
  className?: string;
}

/** The reference's section opener: a spaced mono eyebrow over a tight grotesk heading. */
export function SectionHeading({
  eyebrow,
  title,
  action,
  as: Heading = "h2",
  description,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-8 gap-y-5", className)}>
      <div className="max-w-2xl">
        <p className="eyebrow text-neutral-500">{eyebrow}</p>
        <Heading
          className={cn(
            "mt-3 font-semibold text-balance text-neutral-900",
            Heading === "h1"
              ? "text-[40px] leading-[1.02] tracking-[-0.05em] sm:text-[56px]"
              : "text-[28px] leading-[1.1] tracking-[-0.04em] sm:text-[34px]",
          )}
        >
          {title}
        </Heading>
        {description ? (
          <p className="mt-4 text-[16px] leading-7 text-neutral-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
