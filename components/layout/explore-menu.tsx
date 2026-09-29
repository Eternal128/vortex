"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { coursesHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface MenuLink {
  label: string;
  href: string;
}

export interface ExploreMenuData {
  categories: MenuLink[];
  popular: MenuLink[];
  advanced: MenuLink[];
  /** Shortest courses by total video length. */
  quickStarts: MenuLink[];
}

interface ExploreMenuProps extends ExploreMenuData {
  /** Marks the trigger as the current section, as the Courses link was on catalog pages. */
  active?: boolean;
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

/**
 * The header's Explore mega menu. Opens on click; Escape, an outside click, or following a link
 * closes it. The panel spans the header (the positioned ancestor) and a backdrop dims the page.
 */
export function ExploreMenu({
  categories,
  popular,
  advanced,
  quickStarts,
  active = false,
}: ExploreMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  // Following any link closes the menu — including one that only changes the query string.
  function onPanelClick(event: MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("a")) setOpen(false);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-body-lg transition-colors",
          focusRing,
          open
            ? "bg-primary-50 text-primary-600"
            : active
              ? "font-semibold text-primary-600 hover:bg-neutral-50"
              : "text-neutral-700 hover:bg-neutral-50",
        )}
      >
        Explore
        <ChevronDown
          className={cn("size-4 transition-transform duration-200", open && "rotate-180")}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {open &&
        createPortal(<div aria-hidden className="fixed inset-0 z-30 bg-black/40" />, document.body)}

      <div
        ref={panelRef}
        id={panelId}
        hidden={!open}
        onClick={onPanelClick}
        className="absolute inset-x-0 top-full border-b border-canvas-line bg-canvas shadow-lg"
      >
        <nav
          aria-label="Explore"
          className="mx-auto max-h-[calc(100vh-6rem)] max-w-360 overflow-y-auto px-6 py-10 sm:px-10 xl:px-24"
        >
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <MenuColumn title="Explore categories" links={categories} viewAll={coursesHref} />
            <MenuColumn title="Popular courses" links={popular} viewAll={coursesHref} />
            <MenuColumn title="Go deeper" links={advanced} />
            <MenuColumn title="Quick starts" links={quickStarts} />
          </div>
          <p className="mt-10 border-t border-canvas-line pt-8 text-body-lg text-neutral-700">
            Not sure where to begin?{" "}
            <Link
              href={coursesHref}
              className={cn("rounded-xs text-neutral-900 underline underline-offset-4 hover:text-primary-500", focusRing)}
            >
              Browse all courses
            </Link>
            , search above, or{" "}
            <Link
              href="/plans/new"
              className={cn("rounded-xs text-primary-600 underline underline-offset-4 hover:text-primary-500", focusRing)}
            >
              build your own plan
            </Link>
            .
          </p>
        </nav>
      </div>
    </>
  );
}

function MenuColumn({ title, links, viewAll }: { title: string; links: MenuLink[]; viewAll?: string }) {
  if (links.length === 0) return null;

  return (
    <div>
      <h2 className="text-heading-2 text-neutral-900">{title}</h2>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cn(
                "rounded-xs text-body-lg text-neutral-700 underline-offset-4 hover:text-primary-500 hover:underline",
                focusRing,
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      {viewAll && (
        <Link
          href={viewAll}
          className={cn(
            "mt-4 inline-block rounded-xs text-body-lg text-neutral-900 underline underline-offset-4 hover:text-primary-500",
            focusRing,
          )}
        >
          View all
        </Link>
      )}
    </div>
  );
}
