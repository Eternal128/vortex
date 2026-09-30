import { interpolate } from "remotion";

/**
 * The cast, flat and 2D: solid circles in the brief's colours, a flat shadow, and squash and
 * stretch. Motion is plain maths on the film's clock, so every landing sits exactly on its sound.
 */

export const CAST = {
  guide: { color: "#ffffff", r: 62 },
  maya: { color: "#7b4ddb", r: 62 },
  leo: { color: "#f0532e", r: 62 },
  sam: { color: "#2bb673", r: 62 },
  kai: { color: "#2f7bea", r: 86 },
  pip: { color: "#f7c22b", r: 34 },
  dough: { color: "#e9d8b8", r: 40 },
} as const;
export type Who = keyof typeof CAST;

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const ease = (t: number, from: number, to: number) => smooth((t - from) / (to - from));

/** A body at a moment: centre x, the y of its bottom, and its squash (scaleX, scaleY). */
export interface Pose {
  x: number;
  bottom: number;
  sx: number;
  sy: number;
  /** Where its shadow lies, and how far above that the body is. */
  floor?: number;
}

/** The squash of an impact at `at` with `strength`: a quick flatten, a small stretch back, settled. */
export function squash(t: number, impacts: [number, number][]) {
  let s = 0;
  for (const [at, strength] of impacts) {
    const dt = t - at;
    if (dt >= 0 && dt < 0.5) s += strength * 0.32 * Math.exp(-dt * 12) * Math.cos(dt * 26);
  }
  return { sx: 1 + s * 0.75, sy: 1 - s };
}

/**
 * Dropped from above the frame onto `floor`, landing at `land`, with two smaller bounces after.
 * Returns the height above the floor and the impacts, for squash.
 */
export function drop(t: number, land: number, height = 1100) {
  const fall = 0.55;
  const bounces: [number, number, number][] = [
    [land, 0.36, height * 0.16],
    [land + 0.36, 0.22, height * 0.045],
  ];
  let h = 0;
  if (t < land) {
    const p = clamp01((t - (land - fall)) / fall);
    h = t < land - fall ? height : height * (1 - p * p);
  } else {
    for (const [start, dur, peak] of bounces) {
      if (t >= start && t < start + dur) {
        const p = (t - start) / dur;
        h = peak * 4 * p * (1 - p);
      }
    }
  }
  const impacts: [number, number][] = [
    [land, 1],
    [land + 0.36, 0.45],
    [land + 0.58, 0.18],
  ];
  return { h, impacts };
}

/** A hop from (x0, y0) to (x1, y1) (bottoms), `high` px above the higher end, over [from, to]. */
export function hop(t: number, from: number, to: number, x0: number, y0: number, x1: number, y1: number, high: number) {
  const p = clamp01((t - from) / (to - from));
  const top = Math.min(y0, y1) - high;
  // A parabola through the two ends with its apex `high` above the higher one.
  const a = y0 - top;
  const b = y1 - top;
  const k = Math.sqrt(a) / (Math.sqrt(a) + Math.sqrt(b));
  const y = p < k ? top + a * ((k - p) / k) ** 2 : top + b * ((p - k) / (1 - k)) ** 2;
  return { x: lerp(x0, x1, p), bottom: y, airborne: p > 0 && p < 1 };
}

/** A rolling move with a slight settle past the end. */
export function roll(t: number, from: number, to: number, x0: number, x1: number) {
  const p = clamp01((t - from) / (to - from));
  const eased = p < 1 ? 1 - (1 - p) ** 3 : 1;
  const settle = t > to ? Math.exp(-(t - to) * 7) * Math.sin((t - to) * 18) * 8 * Math.sign(x1 - x0) : 0;
  return lerp(x0, x1, eased) + settle;
}

/** One of the cast, drawn flat: a solid circle with a soft flat highlight, and its shadow. */
export function Ball({ who, pose, scale = 1, shadow = "rgba(0,0,0,0.14)", outline, opacity = 1 }: { who: Who; pose: Pose; scale?: number; shadow?: string; outline?: string; opacity?: number }) {
  const { color } = CAST[who];
  const r = CAST[who].r * scale;
  const w = r * 2 * pose.sx;
  const h = r * 2 * pose.sy;
  const floor = pose.floor ?? pose.bottom;
  const lift = Math.max(0, floor - pose.bottom);
  const shade = interpolate(lift, [0, 400], [1, 0.25], { extrapolateRight: "clamp" });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: pose.x - r * 1.05 * shade,
          top: floor - r * 0.16 * shade,
          width: r * 2.1 * shade,
          height: r * 0.32 * shade,
          borderRadius: "50%",
          background: shadow,
          opacity: opacity * shade,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: pose.x - w / 2,
          top: pose.bottom - h,
          width: w,
          height: h,
          borderRadius: "50%",
          background: color,
          boxShadow: outline ? `inset 0 0 0 2px ${outline}` : undefined,
          opacity,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: "22%", top: "16%", width: "30%", height: "22%", borderRadius: "50%", background: "rgba(255,255,255,0.28)" }} />
      </div>
    </>
  );
}
