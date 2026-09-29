"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { HomeCourse } from "@/components/home/home-course";
import { buttonClasses } from "@/components/ui/button";
import { catalogHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

/** Cards shown per category — one row at desktop width. */
const CARDS = 4;

interface CategoryBrowserProps {
  /** Categories that have at least one course. */
  categories: { title: string; slug: string }[];
  /** Most-enrolled first. */
  courses: HomeCourse[];
}

/** A tinted panel with category tabs; each tab shows that category's top courses. */
export function CategoryBrowser({ categories, courses }: CategoryBrowserProps) {
  const [selected, setSelected] = useState(categories[0]?.slug ?? "");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  if (categories.length === 0) return null;

  const current = categories.find((category) => category.slug === selected) ?? categories[0];
  const visible = courses.filter((course) => course.categorySlug === current.slug).slice(0, CARDS);

  // Arrow keys move between tabs and select as they go (the WAI-ARIA automatic tabs pattern).
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const moves: Record<string, number> = {
      ArrowRight: (index + 1) % categories.length,
      ArrowLeft: (index - 1 + categories.length) % categories.length,
      Home: 0,
      End: categories.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setSelected(categories[next].slug);
    tabs.current[next]?.focus();
  }

  return (
    <section
      aria-labelledby={`${baseId}-title`}
      className="grid gap-8 rounded-lg bg-neutral-100 p-6 sm:p-8 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:items-center"
    >
      <div>
        <h2 id={`${baseId}-title`} className="text-heading-1 text-neutral-900">
          Find the course for what you want to learn
        </h2>
        <p className="mt-3 text-body-lg text-neutral-700">
          Pick a category to see the courses inside it.
        </p>
        <Link
          href={catalogHref(current.slug)}
          className={buttonClasses({ className: "mt-6" })}
        >
          Browse {current.title}
          <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
        </Link>
      </div>

      <div className="min-w-0">
        <div role="tablist" aria-label="Categories" className="flex flex-wrap gap-2">
          {categories.map((category, index) => {
            const isSelected = category.slug === current.slug;
            return (
              <button
                key={category.slug}
                ref={(element) => {
                  tabs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${category.slug}`}
                aria-selected={isSelected}
                aria-controls={`${baseId}-panel`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setSelected(category.slug)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={cn(
                  "h-9 rounded-full border px-4 text-action transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-100",
                  isSelected
                    ? "border-neutral-900 bg-neutral-900 text-canvas"
                    : "border-neutral-200 bg-surface text-neutral-900 hover:border-neutral-500",
                )}
              >
                {category.title}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-tab-${current.slug}`}
          className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {visible.map((course) => (
            <Link
              key={course.id}
              href={course.href}
              className="lift group flex flex-col rounded-lg bg-surface p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <span className="relative block aspect-4/3 overflow-hidden rounded-md bg-neutral-100">
                {course.cover && (
                  <Image src={course.cover} alt="" fill sizes="(min-width: 1280px) 240px, 45vw" className="object-cover" />
                )}
              </span>
              {course.instructorName && (
                <span className="mt-3 flex items-center gap-2 text-body text-neutral-700">
                  {course.instructorPhoto && (
                    <Image
                      src={course.instructorPhoto}
                      alt=""
                      width={20}
                      height={20}
                      className="size-5 shrink-0 rounded-full object-cover"
                    />
                  )}
                  <span className="truncate">{course.instructorName}</span>
                </span>
              )}
              <span className="mt-1 line-clamp-2 text-heading-3 text-neutral-900 underline-offset-4 group-hover:underline">
                {course.title}
              </span>
              {course.meta && <span className="mt-auto pt-2 text-body text-neutral-500">{course.meta}</span>}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
