import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { wideContainer } from "@/lib/layout";
import {
  blogHref,
  coursesHref,
  ideasHref,
  instructorsHref,
  myLearningHref,
  searchPageHref,
} from "@/lib/routes";
import { cn } from "@/lib/utils";

const columns = [
  {
    title: "Learn",
    links: [
      { label: "All courses", href: coursesHref },
      { label: "Search lessons", href: searchPageHref },
      { label: "Instructors", href: instructorsHref },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Field notes", href: blogHref },
      { label: "Ideas board", href: ideasHref },
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

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-auto border-t border-canvas-line", className)}>
      <div className={cn(wideContainer, "grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]")}>
        <div className="flex flex-col gap-4">
          <Logo size={22} />
          <p className="max-w-[34ch] text-[14px] leading-6 text-neutral-500">
            Sequenced courses you can search to the exact second of every lesson.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="eyebrow text-neutral-500">{column.title}</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-xs text-[14px] leading-5 text-neutral-700 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className={cn(wideContainer, "flex flex-wrap justify-between gap-2 border-t border-canvas-line py-6")}>
        <p className="font-mono text-[12px] text-neutral-500">© {new Date().getFullYear()} Vortex</p>
        <p className="font-mono text-[12px] text-neutral-500">Built with Next.js, Sanity and Clerk</p>
      </div>
    </footer>
  );
}
