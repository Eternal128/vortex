import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Bell, Menu, Sparkles } from "lucide-react";
import Link from "next/link";
import { toHomeCourses } from "@/components/home/home-course";
import type { ExploreMenuData } from "@/components/layout/explore-menu";
import { Navbar, primaryLinks } from "@/components/nav/navbar";
import { SearchForm } from "@/components/search/search-form";
import { Button, buttonClasses } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getLearnerCounts } from "@/lib/learners";
import { catalogHref, courseHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import { CATEGORIES_LIST_QUERY, COURSES_LIST_QUERY } from "@/sanity/lib/queries";

/** How many courses each Explore menu column lists. */
const MENU_COLUMN_SIZE = 6;

interface SiteHeaderProps {
  /** href of the nav link to mark as current. */
  activeHref?: string;
  className?: string;
}

/** The Explore menu's links. Same queries and tags as the catalog, so the fetches are shared. */
async function exploreMenuData(): Promise<ExploreMenuData> {
  const [courses, categories, learners] = await Promise.all([
    sanityFetch({ query: COURSES_LIST_QUERY, tags: [CACHE_TAGS.course, CACHE_TAGS.lesson] }),
    sanityFetch({ query: CATEGORIES_LIST_QUERY, tags: [CACHE_TAGS.category, CACHE_TAGS.course] }),
    getLearnerCounts(),
  ]);
  const ranked = toHomeCourses(courses, learners.courses);
  const asLink = (course: (typeof ranked)[number]) => ({ label: course.title, href: course.href });

  return {
    categories: categories.flatMap((category) =>
      category.slug && category.courseCount
        ? [{ label: category.title ?? category.slug, href: catalogHref(category.slug) }]
        : [],
    ),
    popular: ranked.slice(0, MENU_COLUMN_SIZE).map(asLink),
    advanced: ranked
      .filter((course) => course.level === "advanced")
      .slice(0, MENU_COLUMN_SIZE)
      .map(asLink),
    quickStarts: courses
      .filter((course) => course.slug && course.durationSeconds)
      .sort((a, b) => (a.durationSeconds ?? 0) - (b.durationSeconds ?? 0))
      .slice(0, MENU_COLUMN_SIZE)
      .map((course) => ({ label: course.title ?? "", href: courseHref(course.slug ?? "") })),
  };
}

/** The site header: logo, Explore menu, search, theme toggle, Create plan, and account controls. */
export async function SiteHeader({ activeHref, className }: SiteHeaderProps) {
  const explore = await exploreMenuData();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-canvas-line bg-canvas/85 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/75",
        className,
      )}
    >
      <div className="mx-auto flex max-w-360 flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3 sm:px-8 lg:h-16 lg:flex-nowrap lg:py-0 xl:px-12">
      <Navbar activeHref={activeHref} explore={explore} />
      <SearchForm
        id="header-search"
        variant="pill"
        label="Search courses and lessons"
        placeholder="What do you want to learn?"
        className="order-last w-full lg:order-none lg:w-auto lg:max-w-96 lg:min-w-0 lg:flex-1"
      />
      <div className="ml-auto flex items-center gap-2.5 sm:gap-3">
        <ThemeToggle className="hidden sm:flex" />
        <Link
          href="/plans/new"
          aria-label="Create plan"
          className={buttonClasses({ size: "md", className: "gap-1.5 px-3 sm:px-3.5" })}
        >
          <Sparkles className="size-4" strokeWidth={2} aria-hidden />
          <span className="hidden sm:inline">Create plan</span>
        </Link>
        <Show when="signed-in">
          <button
            type="button"
            aria-label="Notifications"
            className="rounded-full p-1.5 text-neutral-700 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Bell className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
          <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button variant="tertiary" size="md">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="text" size="md" className="hidden no-underline sm:inline-flex">
              Sign up
            </Button>
          </SignUpButton>
        </Show>
        {/* Mobile menu: a native disclosure, so it works before hydration and without JS. */}
        <details className="group relative md:hidden">
          <summary
            aria-label="Menu"
            className={cn(buttonClasses({ variant: "tertiary", size: "icon" }), "cursor-pointer list-none")}
          >
            <Menu className="size-4" strokeWidth={2} aria-hidden />
          </summary>
          <div className="absolute right-0 mt-2 w-60 rounded-lg border border-canvas-line bg-surface p-2 shadow-lg">
            <nav aria-label="Main">
              <ul className="flex flex-col gap-1">
                {primaryLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={link.href === activeHref ? "page" : undefined}
                      className="block rounded-sm px-3 py-2.5 text-body-lg text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 aria-[current=page]:font-semibold aria-[current=page]:text-neutral-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-2 flex justify-center border-t border-canvas-line pt-3 sm:hidden">
              <ThemeToggle />
            </div>
          </div>
        </details>
        </div>
      </div>
    </header>
  );
}
