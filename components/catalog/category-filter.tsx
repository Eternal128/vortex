import Link from "next/link";
import { catalogHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface Category {
  _id: string;
  title: string | null;
  slug: string | null;
  courseCount: number | null;
}

interface CategoryFilterProps {
  categories: Category[];
  /** Slug of the active category, or null for "All courses". */
  active: string | null;
  total: number;
}

/**
 * Capsule filter chips. The radius is deliberate: commit-actions (buttons) stay rectangular while
 * filters are fully rounded, so the two action classes read apart at a glance.
 */
export function CategoryFilter({ categories, active, total }: CategoryFilterProps) {
  const options = [
    { key: "all", label: "All courses", slug: null, count: total },
    ...categories
      .filter((c) => c.slug && c.courseCount)
      .map((c) => ({ key: c._id, label: c.title ?? "", slug: c.slug, count: c.courseCount ?? 0 })),
  ];

  return (
    <nav aria-label="Filter courses by category">
      <ul className="flex flex-wrap gap-2">
        {options.map(({ key, label, slug, count }) => {
          const selected = active === slug;
          return (
            <li key={key}>
              <Link
                href={catalogHref(slug)}
                aria-current={selected ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[14px] leading-5",
                  "transition-colors duration-200 ease-out-soft focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                  "focus-visible:ring-offset-background",
                  selected
                    ? "bg-neutral-200/70 font-medium text-neutral-900"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
                )}
              >
                {label}
                <span
                  className={cn(
                    "tabular font-mono text-[12px]",
                    selected ? "text-neutral-700" : "text-neutral-500",
                  )}
                >
                  {count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
