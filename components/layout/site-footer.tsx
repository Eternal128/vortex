import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import {
  aboutHref,
  blogHref,
  coursesHref,
  ideasHref,
  myLearningHref,
  newPlanHref,
  searchPageHref,
} from "@/lib/routes";

const columns = [
  {
    title: "Learn",
    links: [
      { label: "All courses", href: coursesHref },
      { label: "Search lessons", href: searchPageHref },
      { label: "Create a plan", href: newPlanHref },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Field notes", href: blogHref },
      { label: "Ideas board", href: ideasHref },
      { label: "About Vortex", href: aboutHref },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "My Learning", href: myLearningHref },
      { label: "Sign in", href: "/sign-in" },
    ],
  },
];

/**
 * The site footer: the mission and a link to the About page, three link columns, then the credit
 * line. Static, so it costs no data fetch.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-canvas-line">
      <div className="mx-auto grid max-w-360 gap-10 px-5 pt-14 pb-10 sm:px-8 md:grid-cols-[1.6fr_repeat(3,1fr)] xl:px-12">
        <section aria-labelledby="footer-about" className="max-w-md">
          <Logo size={24} />
          <h2 id="footer-about" className="sr-only">
            About Vortex
          </h2>
          <p className="mt-4 text-body text-neutral-500">
            YouTube holds some of the best teaching in the world. Vortex gives it the order,
            progress and quizzes of a real course, and keeps every creator credited.
          </p>
          <Link
            href={aboutHref}
            className="group mt-4 inline-flex items-center gap-1.5 rounded-xs font-mono text-[13px] text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            How Vortex works
            <ArrowRight
              className="size-3.5 transition-transform duration-200 ease-out-soft group-hover:translate-x-0.5"
              strokeWidth={2}
              aria-hidden
            />
          </Link>
        </section>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="eyebrow text-neutral-500">{column.title}</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-xs text-body text-neutral-700 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-360 flex-wrap justify-between gap-2 border-t border-canvas-line px-5 py-6 sm:px-8 xl:px-12">
        <p className="font-mono text-[12px] text-neutral-500">© {new Date().getFullYear()} Vortex</p>
        <p className="font-mono text-[12px] text-neutral-500">Videos belong to their YouTube creators.</p>
      </div>
    </footer>
  );
}
