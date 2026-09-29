import Link from "next/link";
import { toHomeCourses } from "@/components/home/home-course";
import { catalogHref, coursesHref } from "@/lib/routes";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import { CATEGORIES_LIST_QUERY, COURSES_LIST_QUERY } from "@/sanity/lib/queries";

const COLUMN_SIZE = 6;

interface FooterLink {
  label: string;
  href: string;
}

/**
 * The site footer, laid out like Coursera's: four columns of plain links on a light band. Every
 * link is a real Vortex page, from the same cached queries the header uses.
 */
export async function SiteFooter() {
  const [courses, categories] = await Promise.all([
    sanityFetch({ query: COURSES_LIST_QUERY, tags: [CACHE_TAGS.course, CACHE_TAGS.lesson] }),
    sanityFetch({ query: CATEGORIES_LIST_QUERY, tags: [CACHE_TAGS.category, CACHE_TAGS.course] }),
  ]);
  const ranked = toHomeCourses(courses);
  const asLink = (course: (typeof ranked)[number]) => ({ label: course.title, href: course.href });

  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: "Categories",
      links: categories.flatMap((category) =>
        category.slug && category.courseCount ? [{ label: category.title ?? category.slug, href: catalogHref(category.slug) }] : [],
      ),
    },
    { title: "Popular courses", links: ranked.slice(0, COLUMN_SIZE).map(asLink) },
    { title: "Go deeper", links: ranked.filter((course) => course.level === "advanced").slice(0, COLUMN_SIZE).map(asLink) },
    {
      title: "Vortex",
      links: [
        { label: "All courses", href: coursesHref },
        { label: "Build your own plan", href: "/plans/new" },
        { label: "Search", href: "/search" },
        { label: "My Learning", href: "/my-learning" },
      ],
    },
  ].filter((column) => column.links.length > 0);

  return (
    <footer className="mt-auto bg-neutral-100">
      <div className="mx-auto max-w-360 px-6 pt-14 pb-10 sm:px-10 xl:px-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-heading-2 text-neutral-900">{column.title}</h2>
              <ul className="mt-2 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-xs text-body-lg text-neutral-700 underline-offset-4 hover:text-neutral-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="mt-12 border-t border-neutral-200 pt-6 text-body text-neutral-500">
          © {new Date().getFullYear()} Vortex. Videos belong to their YouTube creators.
        </p>
      </div>
    </footer>
  );
}
