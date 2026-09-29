import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ExploreMenu, type ExploreMenuData } from "@/components/layout/explore-menu";
import { coursesHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  href: string;
}

interface NavbarProps {
  links?: NavLink[];
  /** href of the link to mark as current. */
  activeHref?: string;
  /** When given, an Explore menu stands in for the Courses link. */
  explore?: ExploreMenuData;
  className?: string;
}

const defaultLinks: NavLink[] = [
  { label: "Courses", href: coursesHref },
  { label: "My Learning", href: "/my-learning" },
];

export function Navbar({ links = defaultLinks, activeHref, explore, className }: NavbarProps) {
  const visibleLinks = explore ? links.filter((link) => link.href !== coursesHref) : links;

  return (
    <nav aria-label="Main" className={cn("flex items-center gap-x-4 sm:gap-x-6", className)}>
      <Link
        href="/"
        className="mr-2 flex items-center rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <Logo size={26} />
      </Link>
      {explore && <ExploreMenu {...explore} active={activeHref === coursesHref} />}
      <ul className="flex items-center gap-6">
        {visibleLinks.map((link) => {
          const isActive = link.href === activeHref;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-xs text-body-lg whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                  isActive
                    ? "font-semibold text-primary-600"
                    : "text-neutral-700 hover:text-primary-500",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
