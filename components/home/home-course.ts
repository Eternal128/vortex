import type { COURSES_LIST_QUERY_RESULT } from "@/sanity.types";
import { type Creator, creatorsLabel, toCreators } from "@/lib/creators";
import { formatLevel } from "@/lib/format";
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
  /** "Intermediate". Learner counts render live beside it. */
  meta: string;
  categorySlug: string | null;
  /** The real YouTube channels behind the course's videos, most-used first. */
  creators: Creator[];
  /** "IBM Technology and 9 more". */
  creatorsLabel: string;
  /** Square thumbnail for list rows. */
  thumb: string | null;
  /** Landscape crop for carousel slides and cards. */
  cover: string | null;
}

/**
 * Courses with a slug, most learners first (live counts from progress records), then the editorial
 * "popular" flag, then title.
 */
export function toHomeCourses(courses: Course[], learners: Record<string, number> = {}): HomeCourse[] {
  return courses
    .flatMap((course) => {
      if (!course.slug) return [];
      const creators = toCreators(course.creators, 56);
      return [
        {
          course,
          home: {
            id: course._id,
            title: course.title ?? "",
            href: courseHref(course.slug),
            summary: course.summary ?? "",
            level: course.level ?? null,
            meta: formatLevel(course.level) ?? "",
            categorySlug: course.category?.slug ?? null,
            creators,
            creatorsLabel: creatorsLabel(creators),
            thumb: course.coverImage?.asset
              ? urlFor(course.coverImage).width(128).height(128).fit("crop").url()
              : null,
            cover: course.coverImage?.asset
              ? urlFor(course.coverImage).width(640).height(480).fit("crop").url()
              : null,
          },
        },
      ];
    })
    .sort(
      (a, b) =>
        (learners[b.course._id] ?? 0) - (learners[a.course._id] ?? 0) ||
        Number(b.course.popular ?? false) - Number(a.course.popular ?? false) ||
        a.home.title.localeCompare(b.home.title),
    )
    .map(({ home }) => home);
}
