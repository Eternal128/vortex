"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { exploreItems } from "@/lib/explore";
import { cn } from "@/lib/utils";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

interface ExploreMenuProps {
  /** Marks the trigger as current when the page is one of the Explore destinations. */
  active?: boolean;
}

/**
 * The header's Explore dropdown, as in the fanout reference: a small white card with an icon and a
 * label per destination. Opens on click; Escape, an outside click, or following a link closes it,
 * and Escape returns focus to the trigger.
 */
export function ExploreMenu({ active = false }: ExploreMenuProps) {
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

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex items-center gap-1 rounded-sm px-2.5 py-1.5 text-nav transition-colors",
          focusRing,
          open || active ? "text-neutral-900" : "font-normal text-neutral-500 hover:text-neutral-900",
        )}
      >
        Explore
        <ChevronDown
          className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      <div
        ref={panelRef}
        id={panelId}
        hidden={!open}
        className="absolute top-full left-0 z-50 mt-2 w-52 rounded-lg border border-canvas-line bg-surface p-1.5 shadow-lg"
      >
        <nav aria-label="Explore">
          <ul className="flex flex-col">
            {exploreItems.map(({ label, href, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-body text-neutral-900 transition-colors hover:bg-neutral-50",
                    focusRing,
                  )}
                >
                  <Icon className="size-4 text-neutral-500" strokeWidth={1.75} aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
