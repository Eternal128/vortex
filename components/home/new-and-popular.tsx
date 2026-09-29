import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CreatorAvatars } from "@/components/creators/creator-avatars";
import type { HomeCourse } from "@/components/home/home-course";
import { LevelAndLearners } from "@/components/learners/learner-counts";
import { catalogHref, coursesHref } from "@/lib/routes";

/** Rows per column, as in the reference. */
const ROWS = 3;

interface NewAndPopularProps {
  /** Most learners first. */
  courses: HomeCourse[];
  /** The category with the most courses, or null when there are none. */
  topCategory: { title: string; slug: string } | null;
}

/** A level column, preferred in this order; the first with courses left to show is used. */
const LEVEL_COLUMNS = [
  { level: "advanced", title: "Go deeper" },
  { level: "beginner", title: "Beginner friendly" },
];

/** Tailwind needs literal class names, so the column count maps to a fixed set. */
const GRID_COLUMNS: Record<number, string> = { 1: "", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3" };

/**
 * Three tinted columns of compact course rows. Every column is a real ordering of the data:
 * live learners, a level, and the largest category. There is no rating data, so rows show level and
 * learners instead of stars.
 */
export function NewAndPopular({ courses, topCategory }: NewAndPopularProps) {
  const popular = courses.slice(0, ROWS);
  const shown = new Set(popular.map((course) => course.id));
  const byLevel = LEVEL_COLUMNS.map(({ level, title }) => ({
    title,
    courses: courses
      .filter((course) => course.level === level && !shown.has(course.id))
      .slice(0, ROWS),
  })).find((column) => column.courses.length > 0);
  const inCategory = topCategory
    ? courses.filter((course) => course.categorySlug === topCategory.slug).slice(0, ROWS)
    : [];

  const columns = [
    { title: "Most popular", href: coursesHref, courses: popular },
    ...(byLevel ? [{ title: byLevel.title, href: coursesHref, courses: byLevel.courses }] : []),
    ...(topCategory
      ? [{ title: `Top in ${topCategory.title}`, href: catalogHref(topCategory.slug), courses: inCategory }]
      : []),
  ].filter((column) => column.courses.length > 0);

  if (columns.length === 0) return null;

  return (
    <section aria-labelledby="new-and-popular">
      <h2 id="new-and-popular" className="text-heading-1 text-neutral-900">
        New and popular
      </h2>
      <div className={`mt-5 grid grid-cols-1 gap-6 ${GRID_COLUMNS[columns.length]}`}>
        {columns.map((column) => (
          <div key={column.title} className="rounded-lg bg-neutral-100 p-4">
            <h3>
              <Link
                href={column.href}
                className="inline-flex items-center gap-2 rounded-xs text-heading-2 text-neutral-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                {column.title}
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </Link>
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {column.courses.map((course) => (
                <li key={course.id}>
                  <CourseRow course={course} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function CourseRow({ course }: { course: HomeCourse }) {
  return (
    <Link
      href={course.href}
      className="lift group flex items-center gap-4 rounded-md bg-surface p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      {course.thumb ? (
        <Image
          src={course.thumb}
          alt=""
          width={64}
          height={64}
          className="size-16 shrink-0 rounded-md object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-md bg-callout text-heading-2 font-bold text-white"
        >
          {course.title.charAt(0)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        {course.creators.length > 0 && (
          <span className="flex items-center gap-2 text-body-lg text-neutral-700">
            <CreatorAvatars creators={course.creators} size={20} />
            <span className="truncate">{course.creatorsLabel}</span>
          </span>
        )}
        <span className="mt-0.5 block truncate text-heading-3 text-neutral-900 underline-offset-4 group-hover:underline">
          {course.title}
        </span>
        <LevelAndLearners level={course.meta} courseId={course.id} className="mt-1 block text-body text-neutral-500" />
      </span>
    </Link>
  );
}
