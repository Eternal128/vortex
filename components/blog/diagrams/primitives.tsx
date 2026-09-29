import type { ReactNode } from "react";

/**
 * Drawing primitives for field-note diagrams. Every colour is a site token, so the diagrams follow
 * light and dark mode, and text uses ink tokens rather than series colours.
 */

export const ink = "var(--color-neutral-900)";
export const muted = "var(--color-neutral-500)";
export const line = "var(--color-neutral-300)";
export const hairline = "var(--color-canvas-line)";
export const surface = "var(--color-surface)";
export const canvas = "var(--color-canvas)";
export const accent = "var(--color-brand-500)";
export const series = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)"] as const;

/** The SVG frame: a fixed design width, scaled to the column, with an accessible title. */
export function Svg({
  width = 800,
  height,
  title,
  id,
  children,
}: {
  width?: number;
  height: number;
  title: string;
  /** Unique per diagram, for marker ids. */
  id: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-labelledby={`${id}-title`}
      className="h-auto w-full"
      fontFamily="var(--font-sans)"
    >
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={muted} />
        </marker>
      </defs>
      {children}
    </svg>
  );
}

/** A labelled box. `strong` draws the ink-filled variant used for the thing being explained. */
export function Box({
  x,
  y,
  w,
  h,
  label,
  sub,
  strong = false,
  dashed = false,
  tint,
  align = "middle",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  strong?: boolean;
  dashed?: boolean;
  /** A small colour chip in the top-left corner, for identity. */
  tint?: string;
  align?: "middle" | "start";
}) {
  const tx = align === "middle" ? x + w / 2 : x + 14;
  const hasSub = Boolean(sub);
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        fill={strong ? ink : surface}
        stroke={strong ? ink : line}
        strokeWidth={1.25}
        strokeDasharray={dashed ? "5 5" : undefined}
      />
      {tint ? <rect x={x + 10} y={y + 10} width={8} height={8} rx={2} fill={tint} /> : null}
      <text
        x={tx}
        y={y + h / 2 + (hasSub ? -3 : 5)}
        textAnchor={align}
        fontSize={14}
        fontWeight={600}
        fill={strong ? canvas : ink}
        letterSpacing="-0.2"
      >
        {label}
      </text>
      {sub ? (
        <text
          x={tx}
          y={y + h / 2 + 15}
          textAnchor={align}
          fontSize={11.5}
          fill={strong ? canvas : muted}
          fontFamily="var(--font-mono)"
          opacity={strong ? 0.75 : 1}
        >
          {sub}
        </text>
      ) : null}
    </g>
  );
}

/** A straight or elbowed arrow between points. */
export function Arrow({
  id,
  points,
  dashed = false,
  label,
  labelAt,
}: {
  id: string;
  points: [number, number][];
  dashed?: boolean;
  label?: string;
  labelAt?: [number, number];
}) {
  const d = points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={muted}
        strokeWidth={1.4}
        strokeDasharray={dashed ? "5 5" : undefined}
        markerEnd={`url(#${id}-arrow)`}
      />
      {label && labelAt ? (
        <text x={labelAt[0]} y={labelAt[1]} textAnchor="middle" fontSize={11} fill={muted} fontFamily="var(--font-mono)">
          {label}
        </text>
      ) : null}
    </g>
  );
}

/** A zone behind a group of boxes, with a mono label. */
export function Zone({
  x,
  y,
  w,
  h,
  label,
  tone = "plain",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  tone?: "plain" | "trusted" | "outside";
}) {
  const fill = tone === "trusted" ? "var(--color-neutral-100)" : tone === "outside" ? "transparent" : "var(--color-neutral-50)";
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={16}
        fill={fill}
        stroke={hairline}
        strokeDasharray={tone === "outside" ? "6 6" : undefined}
      />
      <text x={x + 16} y={y + 24} fontSize={11} letterSpacing="1.4" fill={muted} fontFamily="var(--font-mono)">
        {label.toUpperCase()}
      </text>
    </g>
  );
}

/** Mono caption text placed anywhere. */
export function Note({ x, y, children, anchor = "start", size = 11.5 }: { x: number; y: number; children: ReactNode; anchor?: "start" | "middle" | "end"; size?: number }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={muted} fontFamily="var(--font-mono)">
      {children}
    </text>
  );
}
