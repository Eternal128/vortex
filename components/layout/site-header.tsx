import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { ArrowRight, Bell, Menu, Search } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Navbar } from "@/components/nav/navbar";
import { Button, buttonClasses } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { wideContainer } from "@/lib/layout";
import { courseHref, searchPageHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import { NEWEST_COURSE_QUERY } from "@/sanity/lib/queries";

interface SiteHeaderProps {
  /** href of the nav link to mark as current. */
  activeHref?: string;
  className?: string;
}

export async function SiteHeader({ activeHref, className }: SiteHeaderProps) {
  const newest = await sanityFetch({ query: NEWEST_COURSE_QUERY, tags: [CACHE_TAGS.course] });

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-canvas-line bg-canvas/85 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/75",
        className,
      )}
    >
      <div className={cn(wideContainer, "flex h-16 items-center gap-4 lg:gap-6")}>
        <Link
          href="/"
          aria-label="Vortex home"
          className="shrink-0 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <Logo size={22} />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <Navbar activeHref={activeHref} />
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {newest?.slug && newest.title ? (
            <Link
              href={courseHref(newest.slug)}
              className={buttonClasses({
                variant: "pill",
                size: "md",
                className: "hidden max-w-72 gap-2 xl:inline-flex",
              })}
            >
              <span className="size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
              <span className="truncate">New: {newest.title}</span>
              <ArrowRight className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
            </Link>
          ) : null}

          <Link
            href={searchPageHref}
            aria-label="Search lessons"
            className={buttonClasses({ variant: "tertiary", size: "icon" })}
          >
            <Search className="size-4" strokeWidth={2} aria-hidden />
          </Link>

          <ThemeToggle className="hidden sm:flex" />

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
          </Show>

          {/* Mobile menu: a native disclosure, so it works before hydration and without JS. */}
          <details className="group relative lg:hidden">
            <summary
              aria-label="Menu"
              className={cn(buttonClasses({ variant: "tertiary", size: "icon" }), "list-none cursor-pointer")}
            >
              <Menu className="size-4" strokeWidth={2} aria-hidden />
            </summary>
            <div className="absolute right-0 mt-2 w-60 rounded-lg border border-canvas-line bg-surface p-2 shadow-lg">
              <nav aria-label="Main">
                <Navbar activeHref={activeHref} layout="column" />
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
