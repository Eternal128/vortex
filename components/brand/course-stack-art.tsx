import type { CSSProperties } from "react";
import type { PathPalette } from "@/lib/palette";
import { cn } from "@/lib/utils";

interface CourseStackArtProps {
  palette: PathPalette;
  /** Lowercase label drawn on the front card in bold mono. */
  label: string;
  /** `md` for card thumbnails, `lg` for the course hero, `sm` for small floating accents. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const BACK_CARDS = 4;

const sizes = {
  sm: { width: 150, height: 104, step: 7, label: "text-[14px] leading-[1.05]" },
  md: { width: 196, height: 136, step: 9, label: "text-[19px] leading-[1.05]" },
  lg: { width: 248, height: 172, step: 11, label: "text-[24px] leading-[1.05]" },
} as const;

/**
 * The course thumbnail: a fan of rounded cards stacked up and to the right, their backs shaded with
 * a halftone, the front one in the course's art colour with its label in bold mono. Faint
 * ruled lines sit behind, like the reference. Pure CSS, so every course gets one, in every theme.
 */
export function CourseStackArt({ palette, label, size = "md", className }: CourseStackArtProps) {
  const { width, height, step, label: labelClass } = sizes[size];
  const offset = step * BACK_CARDS;

  const card = (index: number): CSSProperties => ({
    width,
    height,
    left: index * step,
    bottom: index * step,
    borderColor: palette.ink,
    backgroundColor: palette.art,
    zIndex: BACK_CARDS - index,
  });

  return (
    <div
      aria-hidden
      className={cn("relative flex items-center justify-center", className)}
      style={{ color: palette.fg }}
    >
      <div className="ruled pointer-events-none absolute inset-x-0 top-0 h-3/5 opacity-60" />
      <div className="relative" style={{ width: width + offset, height: height + offset }}>
        {Array.from({ length: BACK_CARDS }, (_, i) => BACK_CARDS - i).map((index) => (
          <div
            key={index}
            className="absolute overflow-hidden rounded-[14px] border-2"
            style={card(index)}
          >
            <div
              className="halftone absolute inset-0"
              style={{ opacity: 0.25 + index * 0.12, maskImage: "linear-gradient(135deg, transparent 35%, #000 90%)" }}
            />
          </div>
        ))}
        <div
          className="absolute overflow-hidden rounded-[14px] border-2 shadow-[0_18px_30px_-12px_rgba(0,0,0,0.45)]"
          style={{
            ...card(0),
            zIndex: BACK_CARDS + 1,
            backgroundImage: `linear-gradient(160deg, color-mix(in srgb, ${palette.art} 70%, #fff) 0%, ${palette.art} 55%, color-mix(in srgb, ${palette.art} 82%, #000) 100%)`,
          }}
        >
          <span
            className={cn("absolute right-3 bottom-2.5 left-3 font-mono font-bold tracking-[-0.02em] break-words", labelClass)}
            style={{ color: palette.ink }}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
