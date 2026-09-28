import { Library } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { COURSES_LIST_QUERY_RESULT } from "@/sanity.types";
import { CourseCard } from "@/components/cards/course-card";
import { formatCount, formatDuration, formatLevel, pluralize } from "@/lib/format";
import { courseHref } from "@/lib/routes";
import { urlFor } from "@/sanity/lib/image";

type Course = COURSES_LIST_QUERY_RESULT[number];

interface CourseGridProps {
  courses: Course[];
  /** Show only the first n courses — the home page previews a single row. */
  limit?: number;
  /**
   * The list is sorted popular-first, so a truncated preview is all-popular and the badge marks
   * nothing. Only the full catalog has the mix that makes it meaningful.
   */
  showPopular?: boolean;
}

/** The catalog card grid, shared by the home page preview and the full catalog. */
export function CourseGrid({ courses, limit, showPopular = true }: CourseGridProps) {
  const visible = courses.filter((course) => course.slug !== null).slice(0, limit);

  if (visible.length === 0) return <CourseGridEmpty />;

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((course) => (
        <li key={course._id} className="flex min-w-0">
          <Link
            href={courseHref(course.slug as string)}
            className="flex min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <CourseCard
              layout="stacked"
              title={course.title ?? ""}
              description={course.summary ?? ""}
              level={formatLevel(course.level) ?? ""}
              duration={formatDuration(course.durationSeconds) ?? ""}
              modules={course.moduleCount ? pluralize(course.moduleCount, "module") : ""}
              category={course.category?.title ?? undefined}
              popular={showPopular && (course.popular ?? false)}
              learners={formatCount(course.studentCount) ?? undefined}
              instructor={
                course.instructor?.name
                  ? {
                      name: course.instructor.name,
                      avatar: course.instructor.photo?.asset ? (
                        <Image
                          src={urlFor(course.instructor.photo).width(56).height(56).fit("crop").url()}
                          alt=""
                          width={28}
                          height={28}
                          className="size-7 shrink-0 rounded-full object-cover"
                        />
                      ) : undefined,
                    }
                  : undefined
              }
              logo={
                course.coverImage?.asset ? (
                  <Image
                    src={urlFor(course.coverImage).width(144).height(144).fit("crop").url()}
                    alt={course.coverImage.alt ?? ""}
                    width={72}
                    height={72}
                    className="size-18 shrink-0 rounded-lg object-cover"
                  />
                ) : undefined
              }
              className="min-w-0 flex-1 border-canvas-line transition-[transform,border-color] duration-300 ease-out-soft hover:-translate-y-0.5 hover:border-primary-300"
            />
          </Link>
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
    <div className="flex flex-col items-center rounded-xl border border-dashed border-canvas-line bg-surface/50 px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-lg bg-primary-100 text-primary-500">
        <Library className="size-7" strokeWidth={1.75} aria-hidden />
      </span>
      <h3 className="mt-6 font-display text-[22px] leading-7 font-bold text-neutral-900">
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
