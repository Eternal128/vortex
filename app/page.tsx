import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CourseGrid } from "@/components/cards/course-grid";
import { BeyondTiles } from "@/components/home/beyond-tiles";
import { Faq } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { toHomeCourses } from "@/components/home/home-course";
import { NewAndPopular } from "@/components/home/new-and-popular";
import { PlanTeaser } from "@/components/home/plan-teaser";
import { PageFrame } from "@/components/layout/page-frame";
import { SectionHeading } from "@/components/layout/section-heading";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonClasses } from "@/components/ui/button";
import { container } from "@/lib/layout";
import { getLearnerCounts } from "@/lib/learners";
import { coursesHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import {
  CATEGORIES_LIST_QUERY,
  COURSES_LIST_QUERY,
  HOME_NOTE_LESSON_QUERY,
  NEWEST_COURSE_QUERY,
} from "@/sanity/lib/queries";

/** Two rows of path cards on the home page; the catalog has the rest. */
const FEATURED_COURSE_COUNT = 6;

/**
 * The home page: the hero with search, paths to pick from, what is popular right now, the plan
 * builder, everything else on Vortex, and the FAQ.
 */
export default async function Home() {
  const [courses, categories, learners, newest, note] = await Promise.all([
    sanityFetch({ query: COURSES_LIST_QUERY, tags: [CACHE_TAGS.course, CACHE_TAGS.lesson] }),
    sanityFetch({ query: CATEGORIES_LIST_QUERY, tags: [CACHE_TAGS.category, CACHE_TAGS.course] }),
    getLearnerCounts(),
    sanityFetch({ query: NEWEST_COURSE_QUERY, tags: [CACHE_TAGS.course] }),
    sanityFetch({ query: HOME_NOTE_LESSON_QUERY, tags: [CACHE_TAGS.lesson, CACHE_TAGS.course] }),
  ]);

  const homeCourses = toHomeCourses(courses, learners.courses);
  // Path cards follow the same live ranking as the rows: most learners first.
  const rank = new Map(homeCourses.map((course, index) => [course.id, index]));
  const ranked = [...courses].sort(
    (a, b) => (rank.get(a._id) ?? Infinity) - (rank.get(b._id) ?? Infinity),
  );

  const topCategory = categories
    .flatMap((category) =>
      category.slug && category.courseCount
        ? [{ title: category.title ?? category.slug, slug: category.slug, courseCount: category.courseCount }]
        : [],
    )
    .sort((a, b) => b.courseCount - a.courseCount)[0];

  return (
    <PageFrame header={<SiteHeader activeHref="/" />}>
      <main id="main" className="flex flex-1 flex-col">
        <Hero newest={newest} showcase={ranked.slice(0, 3)} note={note} />

        <section aria-labelledby="paths-heading" className={cn(container, "py-20 lg:py-24")}>
          <SectionHeading
            eyebrow="Pick your path"
            title={<span id="paths-heading">Choose where to start</span>}
            action={
              <Link href={coursesHref} className={buttonClasses({ variant: "tertiary", size: "lg" })}>
                View all courses
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </Link>
            }
          />
          <div className="mt-12">
            <CourseGrid courses={ranked} limit={FEATURED_COURSE_COUNT} showPopular={false} />
          </div>
        </section>

        <section className={cn(container, "py-12")}>
          <NewAndPopular courses={homeCourses} topCategory={topCategory ?? null} />
        </section>

        <section className={cn(container, "py-12")}>
          <PlanTeaser />
        </section>

        <section aria-labelledby="beyond-heading" className={cn(container, "py-20 lg:py-24")}>
          <SectionHeading
            eyebrow="Beyond the courses"
            title={
              <span id="beyond-heading">
                Everything else on <span className="font-pixel font-normal tracking-normal">vortex</span>.
              </span>
            }
          />
          <BeyondTiles className="mt-12" />
        </section>

        <section className={cn(container, "py-20 lg:py-28")}>
          <Faq />
        </section>
      </main>
    </PageFrame>
  );
}
