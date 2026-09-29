import type { ReactNode } from "react";
import { BarChart3, Clock, FolderClosed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardFooter } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

export type CourseCardLayout = "row" | "stacked";

interface CourseCardProps {
  title: string;
  description: string;
  level: string;
  duration: string;
  modules: string;
  /** Square brand tile shown with the title. */
  logo?: ReactNode;
  /** `row` puts the logo beside the title; `stacked` puts it above, with a divided meta row. */
  layout?: CourseCardLayout;
  /** Subject the course sits under, shown above the title on the stacked card. */
  category?: string;
  /** The real creators whose videos make up the course: a label, with their avatars beside it. */
  creators?: { label: string; avatars?: ReactNode };
  /** The live learner count, e.g. `<LiveLearners />`; it renders nothing while the count is zero. */
  learners?: ReactNode;
  /** Flags the course with the shared "popular" badge. */
  popular?: boolean;
  /** 0–100 for a signed-in learner who has started the course; the bar is hidden otherwise. */
  percentComplete?: number;
  className?: string;
}

type MetaProps = Pick<CourseCardProps, "level" | "duration" | "modules"> & {
  /** The stacked card spreads the row across a narrow column, so it runs tighter. */
  tight?: boolean;
};

function Meta({ level, duration, modules, tight = false }: MetaProps) {
  // Not cn(): tailwind-merge reads the custom `text-small` utility as a colour class and would
  // drop it in favour of `text-neutral-500`.
  const item = `inline-flex items-center whitespace-nowrap font-sans text-neutral-500 ${
    tight ? "gap-1 text-caption" : "text-small gap-2"
  }`;
  const icon = `text-neutral-500 ${tight ? "size-3.5" : "size-4"}`;

  return (
    <>
      <span className={item}>
        <BarChart3 className={icon} strokeWidth={2} aria-hidden />
        {level}
      </span>
      <span className={item}>
        <Clock className={icon} strokeWidth={2} aria-hidden />
        {duration}
      </span>
      <span className={item}>
        <FolderClosed className={icon} strokeWidth={2} aria-hidden />
        {modules}
      </span>
    </>
  );
}

/** A course summary card: a compact row, or the stacked catalog card with creators and live learners. */
export function CourseCard({
  title,
  description,
  level,
  duration,
  modules,
  logo,
  layout = "row",
  category,
  creators,
  learners,
  popular = false,
  percentComplete,
  className,
}: CourseCardProps) {
  const fallbackLogo = (size: string) => (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md bg-callout leading-none font-bold text-white",
        size,
      )}
    >
      {title.charAt(0)}
    </span>
  );

  if (layout === "stacked") {
    return (
      <Card className={cn("gap-4", className)}>
        <div className="flex items-start justify-between gap-3">
          {logo ?? fallbackLogo("size-18 rounded-lg text-display-2")}
          {popular ? <Badge variant="popular">Popular</Badge> : null}
        </div>

        <div className="min-w-0">
          {category ? (
            <p className="text-small font-semibold text-neutral-500">{category}</p>
          ) : null}
          <h3 className="mt-1.5 text-heading-2 text-neutral-900">
            {title}
          </h3>
          <p className="mt-2 text-body text-neutral-500">{description}</p>
        </div>

        {creators || learners ? (
          <div className="flex min-w-0 items-center justify-between gap-3">
            {creators ? (
              <span className="flex min-w-0 items-center gap-2">
                {creators.avatars}
                <span className="truncate text-body text-neutral-700">
                  {creators.label}
                </span>
              </span>
            ) : (
              <span />
            )}
            {learners ? <span className="shrink-0 text-small text-neutral-500">{learners}</span> : null}
          </div>
        ) : null}

        {percentComplete !== undefined && <ProgressBar value={percentComplete} className="mt-auto" />}

        <CardFooter className="flex-wrap gap-x-1 gap-y-2 border-t border-canvas-line pt-4">
          <Meta level={level} duration={duration} modules={modules} tight />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={cn("gap-5", className)}>
      <div className="flex items-start gap-4">
        {logo ?? fallbackLogo("size-12 rounded-md text-heading-2")}
        <div className="min-w-0">
          <h3 className="text-heading-3 text-neutral-900">{title}</h3>
          <p className="mt-1 text-body text-neutral-500">{description}</p>
        </div>
      </div>
      <CardFooter className="justify-start gap-5 pt-0">
        <Meta level={level} duration={duration} modules={modules} />
      </CardFooter>
    </Card>
  );
}
