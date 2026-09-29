import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ExploreMenu, type ExploreMenuData } from "@/components/layout/explore-menu";
import { blogHref, coursesHref, ideasHref, myLearningHref } from "@/lib/routes";
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

/** The primary links, shared with the header's mobile menu. */
export const primaryLinks: NavLink[] = [
  { label: "Courses", href: coursesHref },
  { label: "Field notes", href: blogHref },
  { label: "Ideas", href: ideasHref },
  { label: "My Learning", href: myLearningHref },
];

/** The header's primary navigation, marking the current section. */
export function Navbar({ links = primaryLinks, activeHref, explore, className }: NavbarProps) {
  const visibleLinks = explore ? links.filter((link) => link.href !== coursesHref) : links;

  return (
    <nav aria-label="Main" className={cn("flex items-center gap-x-3 sm:gap-x-5", className)}>
      <Link
        href="/"
        className="mr-2 flex items-center rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <Logo size={24} />
      </Link>
      {explore && <ExploreMenu {...explore} active={activeHref === coursesHref} />}
      <ul className="hidden items-center gap-1 md:flex">
        {visibleLinks.map((link) => {
          const isActive = link.href === activeHref;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "block rounded-sm px-2.5 py-1.5 text-nav whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                  isActive
                    ? "text-neutral-900"
                    : "font-normal text-neutral-500 hover:text-neutral-900",
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
