import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageFrame } from "@/components/layout/page-frame";
import { SectionHeading } from "@/components/layout/section-heading";
import { SiteHeader } from "@/components/layout/site-header";
import { pluralize } from "@/lib/format";
import { container } from "@/lib/layout";
import { instructorHref, instructorsHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import { INSTRUCTORS_LIST_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "Instructors",
  description: "The people who teach on Vortex, and what each of them teaches.",
};

export default async function InstructorsPage() {
  const instructors = await sanityFetch({
    query: INSTRUCTORS_LIST_QUERY,
    tags: [CACHE_TAGS.instructor, CACHE_TAGS.course],
  });

  return (
    <PageFrame>
      <SiteHeader activeHref={instructorsHref} />

      <main id="main" className={cn(container, "flex flex-1 flex-col pt-16 pb-24")}>
        <SectionHeading as="h1" eyebrow="The people" title="Instructors" description="Practitioners who teach what they do every day." />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {instructors.map((instructor) =>
            instructor.slug ? (
              <li key={instructor._id}>
                <Link
                  href={instructorHref(instructor.slug)}
                  className="group flex h-full flex-col rounded-lg border border-canvas-line bg-surface p-6 shadow-sm transition-[box-shadow,transform] duration-300 ease-out-soft hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <div className="flex items-center gap-4">
                    {instructor.photo?.asset ? (
                      <Image
                        src={urlFor(instructor.photo).width(128).height(128).fit("crop").url()}
                        alt=""
                        width={56}
                        height={56}
                        className="size-14 rounded-full object-cover grayscale transition-[filter] duration-300 group-hover:grayscale-0"
                      />
                    ) : (
                      <span className="flex size-14 items-center justify-center rounded-full bg-neutral-100 font-pixel text-[20px] text-neutral-900">
                        {instructor.name?.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-[19px] leading-6 font-semibold tracking-[-0.03em] text-neutral-900">
                        {instructor.name}
                      </h2>
                      {instructor.courseCount ? (
                        <p className="eyebrow mt-1 text-[11px] text-neutral-500">
                          {pluralize(instructor.courseCount, "course")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {instructor.expertise?.length ? (
                    <ul className="mt-5 flex flex-wrap gap-1.5">
                      {instructor.expertise.slice(0, 4).map((skill) => (
                        <li key={skill} className="rounded-xs bg-neutral-100 px-2 py-1 font-mono text-[11px] text-neutral-700">
                          {skill}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-6 font-mono text-[13px] text-neutral-500 group-hover:text-neutral-900">
                    View profile <ArrowRight className="size-3.5" strokeWidth={2} aria-hidden />
                  </span>
                </Link>
              </li>
            ) : null,
          )}
        </ul>
      </main>
    </PageFrame>
  );
}
