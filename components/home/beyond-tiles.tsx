import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import {
  ChalkboardArt,
  ClipboardArt,
  MagnifierArt,
  MapArt,
  NotebooksArt,
  SproutArt,
} from "@/components/illustrations/line-art";
import {
  blogHref,
  coursesHref,
  ideasHref,
  instructorsHref,
  myLearningHref,
  searchPageHref,
} from "@/lib/routes";
import { cn } from "@/lib/utils";

interface Tile {
  number: string;
  label: string;
  title: string;
  caption: string;
  href: string;
  Art: ComponentType<{ className?: string }>;
  /** Tile fill and ink. Artwork colours, fixed across themes. */
  bg: string;
  fg: string;
  muted: string;
}

const tiles: Tile[] = [
  { number: "01", label: "Sequenced paths", title: "Courses", caption: "Learn in order", href: coursesHref, Art: NotebooksArt, bg: "#f2b3ac", fg: "#1f1f1f", muted: "rgba(31,31,31,0.62)" },
  { number: "02", label: "Exact moments", title: "Search", caption: "Land on the second", href: searchPageHref, Art: MagnifierArt, bg: "#e9832f", fg: "#1f1f1f", muted: "rgba(31,31,31,0.62)" },
  { number: "03", label: "Writing", title: "Field notes", caption: "One idea at a time", href: blogHref, Art: ClipboardArt, bg: "#f6f6f4", fg: "#1f1f1f", muted: "rgba(31,31,31,0.55)" },
  { number: "04", label: "Community signal", title: "Ideas", caption: "Vote on what's next", href: ideasHref, Art: SproutArt, bg: "#3079f2", fg: "#ffffff", muted: "rgba(255,255,255,0.72)" },
  { number: "05", label: "The people", title: "Instructors", caption: "Who teaches what", href: instructorsHref, Art: ChalkboardArt, bg: "#5cc690", fg: "#1f1f1f", muted: "rgba(31,31,31,0.62)" },
  { number: "06", label: "Your shelf", title: "My Learning", caption: "Pick up where you left off", href: myLearningHref, Art: MapArt, bg: "#bfb5e8", fg: "#1f1f1f", muted: "rgba(31,31,31,0.62)" },
];

/** "Beyond the courses": the reference's numbered, colour-blocked tiles, one per part of Vortex. */
export function BeyondTiles({ className }: { className?: string }) {
  return (
    <ul className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {tiles.map(({ number, label, title, caption, href, Art, bg, fg, muted }) => (
        <li key={href}>
          <Link
            href={href}
            className="group relative flex h-88 flex-col overflow-hidden rounded-[18px] p-7 shadow-sm ring-1 ring-black/5 transition-[transform,box-shadow] duration-300 ease-out-soft hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ backgroundColor: bg, color: fg }}
          >
            <div className="absolute top-6 right-7 text-right">
              <p className="text-[52px] leading-none font-semibold tracking-[-0.06em]">{number}</p>
              <p className="eyebrow mt-2 text-[10px] font-semibold" style={{ color: muted }}>
                {label}
              </p>
            </div>

            <Art className="w-36 transition-transform duration-500 ease-out-soft group-hover:-rotate-2" />

            <div className="mt-auto flex items-end justify-between gap-4">
              <div>
                <p className="text-[34px] leading-none font-semibold tracking-[-0.05em]">{title}</p>
                <p className="mt-2 text-[13px]" style={{ color: muted }}>
                  {caption}
                </p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/10 transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
