import type { CSSProperties, ReactNode } from "react";
import { Play } from "lucide-react";
import { AbsoluteFill } from "remotion";
import { color, fontFamily } from "./theme";

export function Stage({ background = color.canvas, children }: { background?: string; children: ReactNode }) {
  return <AbsoluteFill style={{ background, fontFamily, color: color.ink, overflow: "hidden" }}>{children}</AbsoluteFill>;
}

/** Shade a hex color toward black (negative) or white (positive) by `amount` in [-1, 1]. */
export function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const channels = [n >> 16, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount),
  );
  return `rgb(${channels.join(",")})`;
}

/** A video thumbnail: the category hue as a lit gradient, a play mark, and a length chip. */
export function Tile({
  hue,
  width,
  height,
  length,
  style,
  playSize,
}: {
  hue: string;
  width: number;
  height: number;
  length?: string;
  style?: CSSProperties;
  playSize?: number;
}) {
  const play = playSize ?? Math.round(Math.min(width, height) * 0.34);
  return (
    <div
      style={{
        width,
        height,
        borderRadius: Math.max(8, width * 0.06),
        background: `radial-gradient(120% 90% at 20% 15%, ${shade(hue, 0.35)} 0%, ${hue} 45%, ${shade(hue, -0.35)} 100%)`,
        boxShadow: "0 10px 30px rgba(24,24,27,.18), inset 0 0 0 1px rgba(255,255,255,.18)",
        position: "relative",
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: play,
          height: play,
          marginLeft: -play / 2,
          marginTop: -play / 2,
          borderRadius: "50%",
          background: "rgba(255,255,255,.92)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Play size={play * 0.46} color={shade(hue, -0.25)} fill={shade(hue, -0.25)} style={{ marginLeft: play * 0.06 }} />
      </div>
      {length && (
        <span
          style={{
            position: "absolute",
            right: width * 0.05,
            bottom: height * 0.07,
            fontSize: Math.max(14, height * 0.13),
            fontWeight: 600,
            color: "white",
            background: "rgba(0,0,0,.55)",
            borderRadius: 6,
            padding: "1px 8px",
          }}
        >
          {length}
        </span>
      )}
    </div>
  );
}

const SAILS = [
  { d: "M24 24 L24 2 L40 11 Z", fill: color.coral600 },
  { d: "M24 24 L46 24 L37 40 Z", fill: color.coral },
  { d: "M24 24 L24 46 L8 37 Z", fill: "#f77a7a" },
  { d: "M24 24 L2 24 L11 8 Z", fill: color.ink },
];

/** The Vortex windmill. `spread` flies each sail in from its own corner (0 = home). */
export function Windmill({ size, rotate = 0, spread = 0 }: { size: number; rotate?: number; spread?: number }) {
  const offsets = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ overflow: "visible", transform: `rotate(${rotate}deg)` }}>
      {SAILS.map((sail, i) => (
        <path
          key={sail.d}
          d={sail.d}
          fill={sail.fill}
          transform={`translate(${offsets[i][0] * spread * 40} ${offsets[i][1] * spread * 40})`}
          opacity={1 - spread * 0.8}
        />
      ))}
      <circle cx="24" cy="24" r="3" fill="white" stroke={color.coral600} strokeWidth="1.5" opacity={1 - spread} />
    </svg>
  );
}

export function Pill({
  children,
  background,
  foreground,
  icon,
  size = 30,
  style,
}: {
  children: ReactNode;
  background: string;
  foreground: string;
  icon?: ReactNode;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.35,
        padding: `${size * 0.3}px ${size * 0.7}px`,
        borderRadius: 999,
        background,
        color: foreground,
        fontSize: size,
        fontWeight: 600,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {icon}
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  size = 30,
  icon,
  style,
}: {
  children: ReactNode;
  variant?: "primary" | "success" | "tertiary" | "dark";
  size?: number;
  icon?: ReactNode;
  style?: CSSProperties;
}) {
  const look: Record<string, CSSProperties> = {
    primary: { background: color.coral, color: color.ink },
    success: { background: color.success, color: "white" },
    tertiary: { background: color.surface, color: color.ink, boxShadow: `inset 0 0 0 2px ${color.line}` },
    dark: { background: color.ink, color: "white" },
  };
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.4,
        height: size * 2.1,
        padding: `0 ${size * 0.9}px`,
        borderRadius: 12,
        fontSize: size,
        fontWeight: 600,
        whiteSpace: "nowrap",
        ...look[variant],
        ...style,
      }}
    >
      {icon}
      {children}
    </div>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: color.surface,
        borderRadius: 24,
        boxShadow: "0 1px 0 rgba(24,24,27,.04), 0 24px 60px -20px rgba(24,24,27,.22)",
        border: `1px solid ${color.line}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A soft pointer: coral-tinted dot with a white ring, shrinking while pressed. */
export function Cursor({ x, y, press = 0, opacity = 1 }: { x: number; y: number; press?: number; opacity?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x - 20,
        top: y - 20,
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "rgba(243,82,82,.35)",
        boxShadow: "0 0 0 3px white, 0 6px 18px rgba(24,24,27,.3)",
        transform: `scale(${1 - press * 0.3})`,
        opacity,
        zIndex: 50,
      }}
    />
  );
}

/** A ring that fills clockwise, with the percentage in the middle. */
export function Ring({ size, value, stroke = 14, hue = color.coral, label }: { size: number; value: number; stroke?: number; hue?: string; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color.line} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={hue}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
        />
      </svg>
      {label && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * 0.24,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
