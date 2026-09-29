import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Size of the mark in px. The wordmark scales with it. */
  size?: number;
  showWordmark?: boolean;
}

/**
 * The windmill: four sails turning around a hub, the same shape as the loading windmill. The sails
 * take the course path palette (ocean, mint, amber, ink), so the mark, the course cards and the
 * tiles read as one system. The ink sail follows `neutral-900`, so it stays visible in dark mode.
 */
export const WINDMILL_SAILS = [
  { d: "M24 24 L24 2 L40 11 Z", fill: "var(--color-sail-ocean)" },
  { d: "M24 24 L46 24 L37 40 Z", fill: "var(--color-sail-mint)" },
  { d: "M24 24 L24 46 L8 37 Z", fill: "var(--color-brand-500)" },
  { d: "M24 24 L2 24 L11 8 Z", fill: "var(--color-neutral-900)" },
];

/** The windmill mark on its own, for tight spaces. */
export function LogoMark({ size = 28, className }: Omit<LogoProps, "showWordmark">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Vortex"
      className={cn("shrink-0", className)}
    >
      {WINDMILL_SAILS.map((sail) => (
        <path key={sail.d} d={sail.d} fill={sail.fill} />
      ))}
      <circle cx="24" cy="24" r="3" fill="var(--color-surface)" stroke="var(--color-neutral-900)" strokeWidth="1.5" />
    </svg>
  );
}

/** The windmill mark with the Vortex wordmark beside it. */
export function Logo({ size = 28, showWordmark = true, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <span
          className="font-sans font-semibold tracking-[-0.04em] text-neutral-900"
          style={{ fontSize: size * 0.8, lineHeight: 1 }}
        >
          Vortex
        </span>
      )}
    </span>
  );
}
