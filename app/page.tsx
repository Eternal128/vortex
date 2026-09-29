import { CategoryBrowser } from "@/components/home/category-browser";
import { CategoryChips } from "@/components/home/category-chips";
import { toHomeCourses } from "@/components/home/home-course";
import { NewAndPopular } from "@/components/home/new-and-popular";
import { PlanTeaser } from "@/components/home/plan-teaser";
import { PromoBanners } from "@/components/home/promo-banners";
import { PromoCarousel } from "@/components/home/promo-carousel";
import { StatsBand } from "@/components/home/stats-band";
import { PageFrame } from "@/components/layout/page-frame";
import { SiteHeader } from "@/components/layout/site-header";
import { getLearnerCounts } from "@/lib/learners";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import { CATEGORIES_LIST_QUERY, COURSES_LIST_QUERY } from "@/sanity/lib/queries";

/** Course slides after the pitch in the carousel. */
const FEATURED_COURSE_COUNT = 3;

/** The home page: featured courses, rows ranked by live learners, the plan teaser, and categories. */
export default async function Home() {
  const [courses, categories, learners] = await Promise.all([
    sanityFetch({ query: COURSES_LIST_QUERY, tags: [CACHE_TAGS.course, CACHE_TAGS.lesson] }),
    sanityFetch({ query: CATEGORIES_LIST_QUERY, tags: [CACHE_TAGS.category, CACHE_TAGS.course] }),
    getLearnerCounts(),
  ]);

  const homeCourses = toHomeCourses(courses, learners.courses);
  const featured = homeCourses.filter((course) => course.cover).slice(0, FEATURED_COURSE_COUNT);

  const withCourses = categories
    .flatMap((category) =>
      category.slug && category.courseCount
        ? [{ title: category.title ?? category.slug, slug: category.slug, courseCount: category.courseCount }]
        : [],
    )
    .sort((a, b) => b.courseCount - a.courseCount);

  const stats = courses.reduce(
    (totals, course) => ({
      lessonCount: totals.lessonCount + (course.lessonCount ?? 0),
      totalSeconds: totals.totalSeconds + (course.durationSeconds ?? 0),
    }),
    { lessonCount: 0, totalSeconds: 0 },
  );

  return (
    <PageFrame header={<SiteHeader />}>

      <main id="main" className="flex flex-1 flex-col gap-14 px-6 pt-6 pb-20 sm:px-10 xl:px-12">
        <PromoCarousel courses={featured} />
        <NewAndPopular courses={homeCourses} topCategory={withCourses[0] ?? null} />
        <PlanTeaser />
        <PromoBanners />
        <CategoryBrowser categories={withCourses} courses={homeCourses} />
        <CategoryChips categories={withCourses} />
        <StatsBand courseCount={homeCourses.length} {...stats} />
      </main>
    </PageFrame>
  );
}
