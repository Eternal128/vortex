import { Library } from "lucide-react";
import { PathCard, type PathCardCourse } from "@/components/cards/path-card";
import { cn } from "@/lib/utils";

interface CourseGridProps {
  courses: PathCardCourse[];
  /** Show only the first n courses — the home page previews a single row. */
  limit?: number;
  /**
   * The list is sorted popular-first, so a truncated preview is all-popular and the badge marks
   * nothing. Only the full catalog has the mix that makes it meaningful.
   */
  showPopular?: boolean;
  /** Heading level of each card title, so the outline stays correct under the section heading. */
  headingLevel?: "h2" | "h3";
  className?: string;
}

/** The colored path-card grid, shared by the home page, the catalog, and instructor pages. */
export function CourseGrid({
  courses,
  limit,
  showPopular = true,
  headingLevel = "h3",
  className,
}: CourseGridProps) {
  const visible = courses.filter((course) => course.slug !== null).slice(0, limit);

  if (visible.length === 0) return <CourseGridEmpty />;

  return (
    <ul className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6", className)}>
      {visible.map((course) => (
        <li key={course._id} className="flex min-w-0 flex-col">
          <PathCard course={course} showPopular={showPopular} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Shown when the dataset has no published courses — a new Sanity project reads
 * as a broken page otherwise, since the grid is the whole section.
 */
function CourseGridEmpty() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-neutral-300 bg-surface px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900">
        <Library className="size-7" strokeWidth={1.75} aria-hidden />
      </span>
      <h3 className="mt-6 text-heading-2 text-neutral-900">
        No courses published yet
      </h3>
      <p className="mt-3 max-w-[48ch] text-[15px] leading-6.5 text-neutral-500">
        Courses added in Sanity Studio appear here as soon as they are published. Run the studio
        locally with <code className="text-neutral-700">npm run dev</code> inside{" "}
        <code className="text-neutral-700">studio/</code> to create the first one.
      </p>
    </div>
  );
}
