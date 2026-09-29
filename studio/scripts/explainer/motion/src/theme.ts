import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { Easing, interpolate, spring } from "remotion";

/**
 * Vortex's tokens (app/globals.css, the fanout system): off-white canvas, charcoal ink, and amber as
 * the one accent for "you are here", live and new. The windmill adds ocean and mint.
 */
export const color = {
  canvas: "#f7f7f7",
  surface: "#ffffff",
  line: "#e9e9e9",
  ink: "#1f1f1f",
  ink2: "#4a4a4a",
  muted: "#6e6e6e",
  faint: "#b5b5b5",
  deep: "#141414",
  accent: "#f5a524",
  accent600: "#8a5a00",
  accent100: "#fdf1dc",
  accent50: "#fef8ec",
  ocean: "#2d6a9d",
  mint: "#14b894",
  success: "#1f7a4d",
  successSoft: "#e3f5ec",
  error: "#c8102e",
  errorSoft: "#fdecee",
};

/** One hue per category, from the course path palette, so a color always means the same subject. */
export const category = {
  "AI Engineering": "#14b894",
  "Web Development": "#2d6a9d",
  Data: "#e8812f",
  Security: "#d9485f",
  "Backend & Infrastructure": "#7c5ce6",
  Languages: "#2f6fed",
} as const;

export const hues = Object.values(category);

/*
 * Geist and Geist Mono (SIL OFL, public/fonts/OFL.txt), bundled as variable fonts rather than
 * fetched from Google Fonts, so a render needs no network and always matches the site's type.
 */
export const fontFamily = "Geist";
export const monoFamily = "Geist Mono";
loadFont({ family: fontFamily, url: staticFile("fonts/Geist-Variable.woff2"), weight: "100 900" });
loadFont({ family: monoFamily, url: staticFile("fonts/GeistMono-Variable.woff2"), weight: "100 900" });

export const FPS = 30;
/** Seconds of picture before the voice starts, and after it ends, in each scene. */
export const LEAD = 0.35;
export const TAIL = 0.5;

const outSoft = Easing.bezier(0.16, 1, 0.3, 1);

/** 0 → 1 over `dur` seconds from `at`, eased out. */
export function ease(t: number, at: number, dur = 0.5) {
  return interpolate(t, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: outSoft });
}

/** A spring from `at` seconds: a small overshoot, settling in about half a second. */
export function pop(frame: number, at: number, config: { damping?: number; stiffness?: number; mass?: number } = {}) {
  return spring({ frame: frame - at * FPS, fps: FPS, config: { damping: 14, stiffness: 160, mass: 0.8, ...config } });
}

/** Linear 0 → 1 between two times, clamped. */
export function progress(t: number, from: number, to: number) {
  return interpolate(t, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

/** Deterministic pseudo-random in [0, 1) from an integer seed. */
export function rand(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
