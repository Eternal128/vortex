import { ArrowRight, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageFrame } from "@/components/layout/page-frame";
import { SiteHeader } from "@/components/layout/site-header";
import {
  NODE_COLORS,
  NODE_SHAPES,
  NodeMark,
  RoadmapGraph,
  type RoadmapCourse,
} from "@/components/roadmap/roadmap-graph";
import { buttonClasses } from "@/components/ui/button";
import { pluralize } from "@/lib/format";
import { container } from "@/lib/layout";
import {
  ROADMAP_CATEGORY_PARAM,
  catalogHref,
  courseHref,
  lessonHref,
  roadmapCategoryHref,
  roadmapHref,
} from "@/lib/routes";
import { cn } from "@/lib/utils";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import { ROADMAP_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Every learning path on Vortex at a glance: each category mapped to its courses and modules.",
};

export default async function RoadmapPage({ searchParams }: PageProps<"/roadmap">) {
  const categories = (
    await sanityFetch({
      query: ROADMAP_QUERY,
      tags: [CACHE_TAGS.category, CACHE_TAGS.course, CACHE_TAGS.lesson],
    })
  ).filter((category) => category.slug && category.courses.length > 0);

  const requested = (await searchParams)[ROADMAP_CATEGORY_PARAM];
  const slug = Array.isArray(requested) ? requested[0] : requested;
  const active = categories.find((category) => category.slug === slug) ?? categories[0];

  return (
    <PageFrame header={<SiteHeader activeHref={roadmapHref} />}>
      <main id="main" className={cn(container, "flex flex-1 flex-col pt-16 pb-24")}>
        <p className="eyebrow text-neutral-500">Learning paths</p>
        <h1 className="mt-4 font-pixel text-[52px] leading-none tracking-[-0.02em] text-neutral-900 sm:text-[80px]">
          Roadmap
        </h1>

        {active ? (
          <>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-5">
              <nav
                aria-label="Learning paths"
                className="-mx-1 max-w-full overflow-x-auto rounded-full border border-canvas-line bg-surface p-1 shadow-sm"
              >
                <ul className="flex gap-1">
                  {categories.map((category, index) => {
                    const selected = category._id === active._id;
                    return (
                      <li key={category._id}>
                        <Link
                          href={roadmapCategoryHref(index === 0 ? null : category.slug)}
                          aria-current={selected ? "page" : undefined}
                          scroll={false}
                          className={cn(
                            "block rounded-full px-4 py-2 text-body whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                            selected ? "bg-neutral-100 font-medium text-neutral-900" : "text-neutral-500 hover:text-neutral-900",
                          )}
                        >
                          {category.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <Link href={catalogHref(active.slug)} className={buttonClasses({ size: "lg" })}>
                Explore {active.title}
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </Link>
            </div>

            {active.description ? (
              <p className="mt-6 max-w-[64ch] text-body-lg text-neutral-500">{active.description}</p>
            ) : null}

            <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="rounded-xl border border-canvas-line bg-[radial-gradient(var(--color-neutral-200)_1px,transparent_1px)] [background-size:22px_22px]">
                <RoadmapGraph
                  category={{
                    title: active.title ?? "",
                    courseCount: active.courses.length,
                    lessonCount: active.courses.reduce((sum, course) => sum + (course.lessonCount ?? 0), 0),
                  }}
                  courses={active.courses}
                />
              </div>

              <RoadmapIndex category={active.title ?? ""} courses={active.courses} />
            </div>
          </>
        ) : (
          <p className="mt-10 text-body-lg text-neutral-500">No learning paths are published yet.</p>
        )}
      </main>
    </PageFrame>
  );
}

/** The index beside the graph: every module of the path, grouped by course, with the same marks. */
function RoadmapIndex({ category, courses }: { category: string; courses: RoadmapCourse[] }) {
  let moduleIndex = 0;
  return (
    <aside
      aria-label={`${category} index`}
      className="h-fit rounded-xl border border-canvas-line bg-surface p-5 shadow-sm xl:sticky xl:top-24"
    >
      <p className="flex items-center gap-2.5 border-b border-dashed border-canvas-line pb-4 font-mono text-[12px] tracking-[0.12em] text-neutral-500 uppercase">
        <span className="size-2 rounded-full bg-brand-500" aria-hidden />
        Index · {category}
      </p>
      {courses.map((course) => (
        <section key={course._id} className="mt-5">
          <h2 className="font-mono text-[12px] tracking-[0.12em] text-neutral-500 uppercase">
            {course.slug ? (
              <Link href={courseHref(course.slug)} className="hover:text-neutral-900">
                {course.title}
              </Link>
            ) : (
              course.title
            )}
          </h2>
          <ul className="mt-2">
            {(course.modules ?? []).slice(0, 6).map((module, j) => {
              const index = moduleIndex++;
              const href = module.firstLessonSlug
                ? lessonHref(module.firstLessonSlug)
                : course.slug
                  ? courseHref(course.slug)
                  : null;
              const row = (
                <>
                  <svg viewBox="0 0 36 36" className="size-5 shrink-0" aria-hidden>
                    <NodeMark
                      shape={NODE_SHAPES[index % NODE_SHAPES.length]}
                      color={NODE_COLORS[index % NODE_COLORS.length]}
                      x={18}
                      y={18}
                      r={10}
                      filled={index % 2 === 0}
                      number={j + 1}
                    />
                  </svg>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body text-neutral-900">{module.title}</span>
                    <span className="block font-mono text-[11px] text-neutral-500">
                      {pluralize(module.lessonCount ?? 0, "lesson")}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-neutral-300" strokeWidth={2} aria-hidden />
                </>
              );
              return (
                <li key={module._key}>
                  {href ? (
                    <Link
                      href={href}
                      className="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      {row}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 px-2 py-2.5">{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </aside>
  );
}
