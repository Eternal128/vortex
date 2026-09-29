import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseGrid } from "@/components/cards/course-grid";
import { PageFrame } from "@/components/layout/page-frame";
import { SiteHeader } from "@/components/layout/site-header";
import { LessonNotes } from "@/components/lesson/lesson-notes";
import { container } from "@/lib/layout";
import { firstParagraph, truncate } from "@/lib/portable-text";
import { instructorsHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import { INSTRUCTOR_BY_SLUG_QUERY, INSTRUCTOR_SLUGS_QUERY } from "@/sanity/lib/queries";

const tags = [CACHE_TAGS.instructor, CACHE_TAGS.course, CACHE_TAGS.lesson];

async function getInstructor(slug: string) {
  return sanityFetch({ query: INSTRUCTOR_BY_SLUG_QUERY, params: { slug }, tags });
}

export async function generateStaticParams() {
  const instructors = await sanityFetch({ query: INSTRUCTOR_SLUGS_QUERY, tags: [CACHE_TAGS.instructor] });
  return instructors.filter((i) => i.slug !== null).map((i) => ({ slug: i.slug as string }));
}

export async function generateMetadata({ params }: PageProps<"/instructors/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const instructor = await getInstructor(slug);
  if (!instructor) return {};
  const bio = firstParagraph(instructor.bio);
  return { title: instructor.name ?? "Instructor", description: bio ? truncate(bio, 155) : undefined };
}

export default async function InstructorPage({ params }: PageProps<"/instructors/[slug]">) {
  const { slug } = await params;
  const instructor = await getInstructor(slug);
  if (!instructor) notFound();

  const courses = instructor.courses ?? [];

  return (
    <PageFrame>
      <SiteHeader activeHref={instructorsHref} />

      <main id="main" className={cn(container, "flex flex-1 flex-col pt-12 pb-24")}>
        <Link
          href={instructorsHref}
          className="inline-flex w-fit items-center gap-2 rounded-xs text-[14px] text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
          All instructors
        </Link>

        <div className="mt-12 grid gap-10 md:grid-cols-[auto_1fr] md:gap-14">
          {instructor.photo?.asset ? (
            <Image
              src={urlFor(instructor.photo).width(480).height(560).fit("crop").url()}
              alt={instructor.photo.alt ?? instructor.name ?? ""}
              width={240}
              height={280}
              priority
              className="h-70 w-60 rounded-xl border border-canvas-line object-cover shadow-md"
            />
          ) : null}
          <div className="min-w-0">
            <p className="eyebrow text-neutral-500">Instructor</p>
            <h1 className="mt-3 text-[40px] leading-[1.02] font-semibold tracking-[-0.05em] text-neutral-900 sm:text-[56px]">
              {instructor.name}
            </h1>
            {instructor.expertise?.length ? (
              <ul className="mt-6 flex flex-wrap gap-1.5">
                {instructor.expertise.map((skill) => (
                  <li key={skill} className="rounded-xs bg-neutral-100 px-2 py-1 font-mono text-[12px] text-neutral-700">
                    {skill}
                  </li>
                ))}
              </ul>
            ) : null}
            {instructor.bio ? (
              <div className="mt-8 max-w-[64ch]">
                <LessonNotes notes={instructor.bio} />
              </div>
            ) : null}
          </div>
        </div>

        {courses.length > 0 ? (
          <section aria-labelledby="instructor-courses" className="mt-20">
            <p className="eyebrow text-neutral-500">Teaches</p>
            <h2 id="instructor-courses" className="mt-3 text-[28px] leading-[1.1] font-semibold tracking-[-0.04em] text-neutral-900 sm:text-[34px]">
              Courses by {instructor.name}
            </h2>
            <CourseGrid courses={courses} className="mt-10" />
          </section>
        ) : null}
      </main>
    </PageFrame>
  );
}
