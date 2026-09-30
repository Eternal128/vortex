import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";
import { fontFamily } from "../theme";
import { Windmill } from "../ui";

/**
 * The launch film's visual language: a warm light-grey canvas with a faint grain, one bold idea per
 * title card, the real product inside a generic device, and a camera that moves slowly.
 */
export const film = {
  canvas: "#e8e8eb",
  canvasLight: "#f5f5f7",
  ink: "#1d1d1f",
  muted: "#6e6e73",
  bezel: "#1d1d1f",
};

const settleCurve = Easing.bezier(0.16, 1, 0.3, 1);
const glideCurve = Easing.bezier(0.45, 0, 0.2, 1);

/** 0 → 1 between two voice-times, eased to settle; `glide` eases in and out, for camera moves. */
export function between(t: number, a: number, b: number, curve: "settle" | "glide" | "linear" = "settle") {
  return interpolate(t, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: curve === "settle" ? settleCurve : curve === "glide" ? glideCurve : undefined,
  });
}

/** The canvas: a soft pool of light on warm grey, with a static grain so it reads as a surface. */
export function Canvas() {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 60% at 50% 38%, ${film.canvasLight} 0%, ${film.canvas} 72%)` }}>
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, mixBlendMode: "multiply" }}>
        <filter id="film-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.09" />
          </feComponentTransfer>
        </filter>
        <rect width="1920" height="1080" filter="url(#film-grain)" />
      </svg>
    </AbsoluteFill>
  );
}

/** The windmill, small, bottom-left, as the brand mark on every product shot. */
export function BrandBug({ opacity = 1 }: { opacity?: number }) {
  return (
    <div style={{ position: "absolute", left: 64, bottom: 52, opacity }}>
      <Windmill size={46} />
    </div>
  );
}

interface TitleCardProps {
  t: number;
  eyebrow: string;
  /** Lines of the headline; one entry per line. */
  lines: string[];
  size?: number;
  /** Voice-time at which the card glides up to the top and shrinks, making room for the product. */
  dockAt?: number;
}

/** A small line over one bold idea. Centred first; then it docks at the top above the device. */
export function TitleCard({ t, eyebrow, lines, size = 148, dockAt }: TitleCardProps) {
  const eyebrowIn = between(t, -1.05, -0.2);
  const headlineIn = between(t, -0.9, 0.05);
  const docked = dockAt === undefined ? 0 : between(t, dockAt, dockAt + 1.0, "glide");
  const top = interpolate(docked, [0, 1], [540 - (size * lines.length) / 2 - 40, 58]);
  const scale = interpolate(docked, [0, 1], [1, 0.58]);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily, color: film.ink, transform: `scale(${scale})`, transformOrigin: "50% 0%" }}>
      <div style={{ fontSize: size * 0.3, fontWeight: 500, letterSpacing: "-0.01em", opacity: eyebrowIn, transform: `translateY(${(1 - eyebrowIn) * 24}px)` }}>
        {eyebrow}
      </div>
      {lines.map((line) => (
        <div
          key={line}
          style={{
            fontSize: size,
            fontWeight: 700,
            letterSpacing: "-0.045em",
            lineHeight: 1.02,
            opacity: headlineIn,
            transform: `translateY(${(1 - headlineIn) * 32}px)`,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

/** Where the camera looks, in the page's own CSS pixels: a centre point and a zoom (1 = the whole viewport). */
export interface Shot {
  t: number;
  cx: number;
  cy: number;
  z: number;
}

/** The camera at voice-time `t`, eased between keyframes. */
export function camera(t: number, keys: Shot[]): Shot {
  if (t <= keys[0].t) return keys[0];
  const last = keys.at(-1)!;
  if (t >= last.t) return last;
  const i = keys.findIndex((key) => key.t > t);
  const a = keys.at(i - 1)!;
  const b = keys.at(i)!;
  const p = between(t, a.t, b.t, "glide");
  return { t, cx: a.cx + (b.cx - a.cx) * p, cy: a.cy + (b.cy - a.cy) * p, z: a.z + (b.z - a.z) * p };
}

export interface Lens {
  k: number;
  left: number;
  top: number;
}

/**
 * How a page image of `imgW` × `imgH` CSS pixels lands on a screen `screenW` × `screenH`, shown at a
 * viewport of `viewW` CSS pixels wide, for a camera shot. Clamped so the camera never shows past
 * the page's edges.
 */
export function lens(shot: Shot, screenW: number, screenH: number, viewW: number, imgW: number, imgH: number): Lens {
  const k = (screenW / viewW) * shot.z;
  const left = Math.min(0, Math.max(screenW - imgW * k, screenW / 2 - shot.cx * k));
  const top = Math.min(0, Math.max(screenH - imgH * k, screenH / 2 - shot.cy * k));
  return { k, left, top };
}

/** A captured page, placed by a lens. */
export function Page({ src, w, h, at, opacity = 1 }: { src: string; w: number; h: number; at: Lens; opacity?: number }) {
  return (
    <Img
      src={staticFile(`captures/${src}`)}
      style={{ position: "absolute", left: at.left, top: at.top, width: w * at.k, height: h * at.k, opacity, maxWidth: "none" }}
    />
  );
}

/** A tap: a soft press and a ring that opens and fades, at a point on the page. */
export function Tap({ t, at, x, y, on }: { t: number; at: number; x: number; y: number; on: Lens }) {
  const p = between(t, at, at + 0.6, "linear");
  if (p <= 0 || p >= 1) return null;
  const cx = on.left + x * on.k;
  const cy = on.top + y * on.k;
  const ring = 16 + 40 * p;
  return (
    <>
      <div style={{ position: "absolute", left: cx - 15, top: cy - 15, width: 30, height: 30, borderRadius: "50%", background: "rgba(29,29,31,0.28)", opacity: 1 - p }} />
      <div style={{ position: "absolute", left: cx - ring, top: cy - ring, width: ring * 2, height: ring * 2, borderRadius: "50%", border: "3px solid rgba(29,29,31,0.35)", opacity: (1 - p) * 0.9 }} />
    </>
  );
}

const rise = (t: number, enterAt: number) => between(t, enterAt, enterAt + 1.1);

/** A generic laptop: a dark bezel around a 16:10 screen, and a slim base. No real product's design. */
export const LAPTOP = { screenW: 1160, screenH: 725, bezel: 18, top: 262 };

export function Laptop({ t, enterAt, children }: { t: number; enterAt: number; children: ReactNode }) {
  const e = rise(t, enterAt);
  const { screenW, screenH, bezel, top } = LAPTOP;
  const outerW = screenW + bezel * 2;
  return (
    <div style={{ position: "absolute", left: (1920 - outerW) / 2, top, opacity: e, transform: `translateY(${(1 - e) * 240}px)` }}>
      <div style={{ width: outerW, height: screenH + bezel * 2, borderRadius: 30, background: film.bezel, padding: bezel, boxShadow: "0 50px 90px -30px rgba(0,0,0,0.35), 0 0 0 1.5px #3a3a3c inset" }}>
        <div style={{ position: "relative", width: screenW, height: screenH, borderRadius: 10, overflow: "hidden", background: "#fff" }}>{children}</div>
      </div>
      <div style={{ width: outerW + 150, height: 22, marginLeft: -75, marginTop: -2, borderRadius: "4px 4px 18px 18px", background: "linear-gradient(#d4d4d8, #a1a1a6)" }} />
    </div>
  );
}

/** A generic phone: rounded bezel around a 390 × 844 screen. */
export const PHONE = { screenW: 404, screenH: 874, bezel: 14 };

export function Phone({ t, enterAt, left, children }: { t: number; enterAt: number; left: number; children: ReactNode }) {
  const e = rise(t, enterAt);
  const { screenW, screenH, bezel } = PHONE;
  return (
    <div style={{ position: "absolute", left, top: 150, opacity: e, transform: `translateY(${(1 - e) * 260}px)` }}>
      <div style={{ width: screenW + bezel * 2, height: screenH + bezel * 2, borderRadius: 64, background: film.bezel, padding: bezel, boxShadow: "0 50px 90px -30px rgba(0,0,0,0.35), 0 0 0 1.5px #3a3a3c inset" }}>
        <div style={{ position: "relative", width: screenW, height: screenH, borderRadius: 50, overflow: "hidden", background: "#fff" }}>{children}</div>
      </div>
    </div>
  );
}

/** A floating callout pill, for the one fact a shot is about. */
export function Callout({ children, style, opacity = 1 }: { children: ReactNode; style?: CSSProperties; opacity?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 28px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.92)",
        boxShadow: "0 20px 50px -18px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.05)",
        fontFamily,
        fontSize: 32,
        fontWeight: 600,
        color: film.ink,
        opacity,
        transform: `translateY(${(1 - opacity) * 16}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
