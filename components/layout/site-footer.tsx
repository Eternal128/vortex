import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

/**
 * The site footer: one About section on a light band, with the mission in a line and a link to
 * the About page, then the credit line. Static, so it costs no data fetch.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto bg-neutral-100">
      <div className="mx-auto max-w-360 px-6 pt-14 pb-10 sm:px-10 xl:px-12">
        <section
          aria-labelledby="footer-about"
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-2xl">
            <Logo size={28} />
            <h2 id="footer-about" className="mt-5 text-heading-2 text-neutral-900">
              About Vortex
            </h2>
            <p className="mt-2 text-body-lg text-neutral-700">
              YouTube holds some of the best teaching in the world. Vortex gives it the order,
              progress and quizzes of a real course, and keeps every creator credited.
            </p>
          </div>
          <Link
            href="/about"
            className="group inline-flex items-center gap-2 self-start rounded-xs text-action text-primary-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:self-auto"
          >
            How Vortex works
            <ArrowRight
              className="size-4 transition-transform duration-200 ease-out-soft group-hover:translate-x-0.5"
              strokeWidth={2}
              aria-hidden
            />
          </Link>
        </section>
        <p className="mt-12 border-t border-neutral-200 pt-6 text-body text-neutral-500">
          © {new Date().getFullYear()} Vortex. Videos belong to their YouTube creators.
        </p>
      </div>
    </footer>
  );
}
