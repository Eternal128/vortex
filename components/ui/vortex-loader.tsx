import { cn } from "@/lib/utils";

interface VortexLoaderProps {
  /** Visible caption under the windmill. Without one, "Loading" is announced but not shown. */
  label?: string;
  /** Width and height of the windmill in px. */
  size?: number;
  className?: string;
}

/** One sail: a triangle from the hub out to the rim, echoing the logo mark. */
const sail = "M24 24 L24 2 L40 11 Z";

/** Same sail colours as the logo mark: ocean, mint, amber, ink. */
const sails = [
  { rotate: 0, fill: "var(--color-sail-ocean)" },
  { rotate: 90, fill: "var(--color-sail-mint)" },
  { rotate: 180, fill: "var(--color-brand-500)" },
  { rotate: 270, fill: "var(--color-neutral-900)" },
];

/**
 * A spinning four-sail windmill, so waiting reads as a vortex. Under reduced motion the global
 * rule in `globals.css` stops the spin and it shows as a still mark.
 */
export function VortexLoader({ label, size = 48, className }: VortexLoaderProps) {
  return (
    <div role="status" className={cn("flex flex-col items-center gap-3", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        aria-hidden
        className="animate-spin [animation-duration:1.4s]"
      >
        {sails.map(({ rotate, fill }) => (
          <path key={rotate} d={sail} fill={fill} transform={`rotate(${rotate} 24 24)`} />
        ))}
        <circle
          cx="24"
          cy="24"
          r="3"
          fill="var(--color-surface)"
          stroke="var(--color-neutral-900)"
          strokeWidth="1.5"
        />
      </svg>
      {label ? (
        <p className="text-body text-neutral-500">{label}</p>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}
