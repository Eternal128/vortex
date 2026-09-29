import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CourseGrid } from "@/components/cards/course-grid";
import { BeyondTiles } from "@/components/home/beyond-tiles";
import { Faq } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { PageFrame } from "@/components/layout/page-frame";
import { SectionHeading } from "@/components/layout/section-heading";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonClasses } from "@/components/ui/button";
import { container } from "@/lib/layout";
import { coursesHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import {
  COURSES_LIST_QUERY,
  HOME_NOTE_LESSON_QUERY,
  NEWEST_COURSE_QUERY,
} from "@/sanity/lib/queries";

/** Two rows of paths on the home page; the catalog has the rest. */
const FEATURED_COURSE_COUNT = 6;

export default async function Home() {
  const [courses, newest, note] = await Promise.all([
    sanityFetch({ query: COURSES_LIST_QUERY, tags: [CACHE_TAGS.course, CACHE_TAGS.lesson] }),
    sanityFetch({ query: NEWEST_COURSE_QUERY, tags: [CACHE_TAGS.course] }),
    sanityFetch({ query: HOME_NOTE_LESSON_QUERY, tags: [CACHE_TAGS.lesson, CACHE_TAGS.course] }),
  ]);

  return (
    <PageFrame>
      <SiteHeader activeHref="/" />

      <main id="main" className="flex flex-1 flex-col">
        <Hero newest={newest} showcase={courses.slice(0, 3)} note={note} />

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
            <CourseGrid courses={courses} limit={FEATURED_COURSE_COUNT} showPopular={false} />
          </div>
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
