import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ExploreMenu } from "@/components/layout/explore-menu";
import { exploreItems } from "@/lib/explore";
import { coursesHref, ideasHref, myLearningHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  href: string;
}

interface NavbarProps {
  links?: NavLink[];
  /** href of the link to mark as current. */
  activeHref?: string;
  className?: string;
}

/** The primary links, shared with the header's mobile menu. */
export const primaryLinks: NavLink[] = [
  { label: "Courses", href: coursesHref },
  { label: "Ideas", href: ideasHref },
  { label: "My Learning", href: myLearningHref },
];

/** The header's primary navigation: Courses, the Explore dropdown, then the rest, marking the current section. */
export function Navbar({ links = primaryLinks, activeHref, className }: NavbarProps) {
  const [first, ...rest] = links;
  const exploreActive = exploreItems.some((item) => item.href === activeHref);

  return (
    <nav aria-label="Main" className={cn("flex items-center gap-x-3 sm:gap-x-5", className)}>
      <Link
        href="/"
        className="mr-2 flex items-center rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <Logo size={24} />
      </Link>
      <ul className="hidden items-center gap-1 md:flex">
        {first ? <NavItem link={first} activeHref={activeHref} /> : null}
        <li>
          <ExploreMenu active={exploreActive} />
        </li>
        {rest.map((link) => (
          <NavItem key={link.href} link={link} activeHref={activeHref} />
        ))}
      </ul>
    </nav>
  );
}

function NavItem({ link, activeHref }: { link: NavLink; activeHref?: string }) {
  const isActive = link.href === activeHref;
  return (
    <li>
      <Link
        href={link.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "block rounded-sm px-2.5 py-1.5 text-nav whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
          isActive ? "text-neutral-900" : "font-normal text-neutral-500 hover:text-neutral-900",
        )}
      >
        {link.label}
      </Link>
    </li>
  );
}
