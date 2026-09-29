import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Hand-drawn line illustrations in the reference's style: one ink weight, round caps, no fills.
 * They stroke `currentColor`, so a tile sets the ink colour and dark mode needs no second set.
 */
function LineArt({
  children,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("h-auto w-40", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

type ArtProps = { className?: string };

/** Three stacked notebooks, a ribbon bookmark, a pencil on top. */
export function NotebooksArt({ className }: ArtProps) {
  return (
    <LineArt className={className}>
      <path d="M30 96h92c2 0 3-1 3-3v-9c0-2-1-3-3-3H30c-3 0-5 3-5 7.5S27 96 30 96Z" />
      <path d="M30 81c-2 0-4-2-4-4" />
      <path d="M34 88h84M34 91.5h70" />
      <path d="M38 81h86c2 0 3-1 3-3v-9c0-2-1-3-3-3H38c-3 0-5 3-5 7.5S35 81 38 81Z" />
      <path d="M42 73h80" />
      <path d="M33 66h88c2 0 3-1 3-3V51c0-2-1-3-3-3H33c-3 0-5 4-5 9s2 9 5 9Z" />
      <path d="M37 57h82M37 61h64" />
      <path d="M96 48v27l5-4 5 4V48" />
      <path d="M44 42 116 26l4 5-72 16-6 1 2-6Z" />
      <path d="m46 42 2 5M112 27l3 6" />
      <path d="M40 48c1-1 2-1 3-1" />
    </LineArt>
  );
}

/** A magnifying glass over a strip of film with a play mark. */
export function MagnifierArt({ className }: ArtProps) {
  return (
    <LineArt className={className}>
      <path d="M18 70h96v28H18z" />
      <path d="M18 76h96M18 92h96" />
      <path d="M24 72.5h4M34 72.5h4M44 72.5h4M54 72.5h4M64 72.5h4M74 72.5h4M84 72.5h4M94 72.5h4M104 72.5h4" />
      <path d="M24 95.5h4M34 95.5h4M44 95.5h4M54 95.5h4M64 95.5h4M74 95.5h4M84 95.5h4M94 95.5h4M104 95.5h4" />
      <path d="M40 76v16M66 76v16M92 76v16" />
      <path d="m49 80 9 4-9 4Z" />
      <circle cx="98" cy="44" r="24" />
      <circle cx="98" cy="44" r="18" strokeDasharray="2 4" />
      <path d="M115 61l20 20c2 2 2 5 0 7s-5 2-7 0l-20-20" />
      <path d="M89 34c2-3 6-5 10-5" />
    </LineArt>
  );
}

/** A clipped sheet of paper, a pen writing a squiggle, and a small speech bubble. */
export function ClipboardArt({ className }: ArtProps) {
  return (
    <LineArt className={className}>
      <path d="M40 26h52v74l-8 8H40Z" />
      <path d="M84 108v-8h8" />
      <path d="M56 26v-6h20v6M60 20v-6h12v6" />
      <path d="M50 44h32M50 52h26M50 60h30" />
      <path d="M50 82c6-8 10 6 16-2s8 4 14-2" />
      <path d="m98 88 34-34c2-2 5-2 7 0s2 5 0 7l-34 34-10 3Z" />
      <path d="m128 58 7 7M95 98l3 1" />
      <path d="M108 16c-10 0-18 6-18 13s8 13 18 13c3 0 5 0 7-1l8 5-2-8c3-2 5-6 5-9 0-7-8-13-18-13Z" />
      <path d="M101 28h14M101 33h9" />
    </LineArt>
  );
}

/** A hand watering a lightbulb sprouting from soil, with two seedlings. */
export function SproutArt({ className }: ArtProps) {
  return (
    <LineArt className={className}>
      <path d="M20 102c20-5 100-5 120 0" />
      <path d="M30 104h4M48 106h6M70 105h3M96 106h5M118 104h4" />
      <path d="M78 101V78" />
      <path d="M78 90c-6-2-10-6-10-12 6 0 10 4 10 12ZM78 86c5-3 10-4 14-2-2 5-7 6-14 2Z" />
      <path d="M72 74c-6-4-9-10-9-17 0-9 7-16 15-16s15 7 15 16c0 7-3 13-9 17Z" />
      <path d="M72 74v4h12v-4M73 81h10" />
      <path d="M74 64c0-6 2-9 4-9s4 3 4 9" />
      <path d="M78 33v-6M60 40l-4-4M96 40l4-4M54 56h-6M108 56h-6" />
      <path d="M36 101V92c-4 0-7-3-7-7 4 0 7 3 7 7M36 94c0-5 3-8 7-8 0 4-3 7-7 8" />
      <path d="M122 101v-8c3-1 6-4 6-8-4 0-6 3-6 8" />
      <path d="M132 20c-6 1-12 6-16 11l-10 4c-2 1-2 4 0 5l12-3 8 4 10-4" />
      <path d="M106 36c-2 2-5 6-6 9" />
      <path d="M96 47v3M101 50v3M98 54v3" strokeDasharray="1 3" />
    </LineArt>
  );
}

/** A small chalkboard on an easel with a node diagram and a pointer. */
export function ChalkboardArt({ className }: ArtProps) {
  return (
    <LineArt className={className}>
      <path d="M30 20h96v62H30z" />
      <path d="M34 24h88v54H34z" />
      <path d="M52 82 42 110M104 82l10 28M78 82v26M78 20v-6" />
      <path d="M46 96h64" />
      <circle cx="54" cy="44" r="6" />
      <circle cx="80" cy="36" r="5" />
      <circle cx="102" cy="52" r="6" />
      <circle cx="74" cy="64" r="5" />
      <path d="m59 41 16-4M84 39l13 9M97 55l-18 8M58 48l12 12" />
      <path d="M132 112 116 64" />
      <path d="M115 61l1 3" />
    </LineArt>
  );
}

/** An unfolded paper map with a dotted path to a flag. */
export function MapArt({ className }: ArtProps) {
  return (
    <LineArt className={className}>
      <path d="M22 30 58 22l40 10 40-10v70l-40 10-40-10-36 8Z" />
      <path d="M58 22v70M98 32v70" />
      <path d="M36 84c6-8 14-6 20-12s10-16 22-14 12 12 22 10 12-12 14-22" strokeDasharray="2 5" />
      <rect x="32" y="82" width="6" height="6" />
      <path d="M114 46V20l14 5-14 5" />
      <circle cx="114" cy="46" r="2" />
      <path d="M68 52c2-3 6-3 8 0M70 52v4M74 52v4" />
    </LineArt>
  );
}
