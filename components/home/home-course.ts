import type { COURSES_LIST_QUERY_RESULT } from "@/sanity.types";
import { formatCount, formatLevel } from "@/lib/format";
import { courseHref } from "@/lib/routes";
import { urlFor } from "@/sanity/lib/image";

type Course = COURSES_LIST_QUERY_RESULT[number];

/**
 * A course reduced to what the home page and the Explore menu render. Plain values only — image
 * URLs are built on the server — so it can be handed to client components.
 */
export interface HomeCourse {
  id: string;
  title: string;
  href: string;
  summary: string;
  /** Raw level value, e.g. `beginner`. */
  level: string | null;
  /** "Intermediate · 26k learners" — only the parts the data has. */
  meta: string;
  studentCount: number;
  categorySlug: string | null;
  instructorName: string | null;
  instructorPhoto: string | null;
  /** Square thumbnail for list rows. */
  thumb: string | null;
  /** Landscape crop for carousel slides and cards. */
  cover: string | null;
}

/** Courses with a slug, most-enrolled first. */
export function toHomeCourses(courses: Course[]): HomeCourse[] {
  return courses
    .flatMap((course) => {
      if (!course.slug) return [];
      const learners = course.studentCount ? `${formatCount(course.studentCount)} learners` : null;
      return [
        {
          id: course._id,
          title: course.title ?? "",
          href: courseHref(course.slug),
          summary: course.summary ?? "",
          level: course.level ?? null,
          meta: [formatLevel(course.level), learners].filter(Boolean).join(" · "),
          studentCount: course.studentCount ?? 0,
          categorySlug: course.category?.slug ?? null,
          instructorName: course.instructor?.name ?? null,
          instructorPhoto: course.instructor?.photo?.asset
            ? urlFor(course.instructor.photo).width(56).height(56).fit("crop").url()
            : null,
          thumb: course.coverImage?.asset
            ? urlFor(course.coverImage).width(128).height(128).fit("crop").url()
            : null,
          cover: course.coverImage?.asset
            ? urlFor(course.coverImage).width(640).height(480).fit("crop").url()
            : null,
        },
      ];
    })
    .sort((a, b) => b.studentCount - a.studentCount);
}
