import { Library } from "lucide-react";
import type { COURSES_LIST_QUERY_RESULT } from "@/sanity.types";
import { PathCard } from "@/components/cards/path-card";
import { CreatorAvatars } from "@/components/creators/creator-avatars";
import { LiveLearners } from "@/components/learners/learner-counts";
import { creatorsLabel, toCreators } from "@/lib/creators";
import { cn } from "@/lib/utils";

type Course = COURSES_LIST_QUERY_RESULT[number];

interface CourseGridProps {
  courses: Course[];
  /** Show only the first n courses — the home page previews two rows. */
  limit?: number;
  /**
   * The list is sorted popular-first, so a truncated preview is all-popular and the badge marks
   * nothing. Only the full catalog has the mix that makes it meaningful.
   */
  showPopular?: boolean;
  /** Percent complete by course id, for courses the signed-in learner has started. */
  progress?: ReadonlyMap<string, number>;
  /** Heading level of each card title, so the outline stays correct under the section heading. */
  headingLevel?: "h2" | "h3";
  className?: string;
}

/** "IBM Technology and 9 more", with their avatars: the real channels behind the course. */
function creatorsOf(course: Course) {
  const creators = toCreators(course.creators, 56);
  if (creators.length === 0) return undefined;
  return { label: creatorsLabel(creators), avatars: <CreatorAvatars creators={creators} size={24} /> };
}

/** The colored path-card grid, shared by the home page, the catalog and My Learning. */
export function CourseGrid({
  courses,
  limit,
  showPopular = true,
  progress,
  headingLevel = "h3",
  className,
}: CourseGridProps) {
  const visible = courses.filter((course) => course.slug !== null).slice(0, limit);

  if (visible.length === 0) return <CourseGridEmpty />;

  return (
    <ul className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6", className)}>
      {visible.map((course) => (
        <li key={course._id} className="flex min-w-0 flex-col">
          <PathCard
            course={course}
            showPopular={showPopular}
            headingLevel={headingLevel}
            percentComplete={progress?.get(course._id)}
            learners={<LiveLearners kind="course" id={course._id} />}
            creators={creatorsOf(course)}
          />
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
      <h3 className="mt-6 text-heading-2 text-neutral-900">No courses published yet</h3>
      <p className="mt-2 max-w-[48ch] text-body text-neutral-500">
        Courses added in Sanity Studio appear here as soon as they are published. Run the studio
        locally with <code className="text-neutral-700">npm run dev</code> inside{" "}
        <code className="text-neutral-700">studio/</code> to create the first one.
      </p>
    </div>
  );
}
