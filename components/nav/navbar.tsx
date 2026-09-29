import Link from "next/link";
import {
  blogHref,
  coursesHref,
  ideasHref,
  myLearningHref,
  searchPageHref,
} from "@/lib/routes";
import { cn } from "@/lib/utils";

export interface NavLink {
  label: string;
  href: string;
}

export const primaryLinks: NavLink[] = [
  { label: "Courses", href: coursesHref },
  { label: "Search", href: searchPageHref },
  { label: "Field notes", href: blogHref },
  { label: "Ideas", href: ideasHref },
  { label: "My Learning", href: myLearningHref },
];

interface NavbarProps {
  links?: NavLink[];
  /** href of the link to mark as current. */
  activeHref?: string;
  /** `row` for the desktop bar, `column` for the mobile menu. */
  layout?: "row" | "column";
  className?: string;
}

export function Navbar({
  links = primaryLinks,
  activeHref,
  layout = "row",
  className,
}: NavbarProps) {
  return (
    <ul
      className={cn(
        layout === "row" ? "flex items-center gap-1" : "flex flex-col gap-1",
        className,
      )}
    >
      {links.map((link) => {
        const isActive = link.href === activeHref;
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "block rounded-sm px-2.5 py-1.5 text-[14px] leading-5 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                layout === "column" && "px-3 py-2.5 text-[16px]",
                isActive
                  ? "font-medium text-neutral-900"
                  : "text-neutral-500 hover:text-neutral-900",
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
