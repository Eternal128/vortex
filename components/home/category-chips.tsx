import Link from "next/link";
import { catalogHref } from "@/lib/routes";

interface CategoryChipsProps {
  categories: { title: string; slug: string; courseCount: number }[];
}

/** "Explore categories": one capsule per category, each opening the filtered catalog. */
export function CategoryChips({ categories }: CategoryChipsProps) {
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="explore-categories">
      <h2 id="explore-categories" className="text-heading-1 text-neutral-900">
        Explore categories
      </h2>
      <ul className="mt-5 flex flex-wrap gap-3">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={catalogHref(category.slug)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-neutral-200 bg-surface px-4 text-action text-neutral-900 transition-colors hover:border-primary-500 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              {category.title}
              <span className="tabular text-small text-neutral-500">{category.courseCount}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
