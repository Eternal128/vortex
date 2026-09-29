import { loadFont } from "@remotion/google-fonts/SourceSans3";
import { Easing, interpolate, spring } from "remotion";

/** Vortex's tokens (app/globals.css), plus the idea colors the video uses for meaning. */
export const color = {
  canvas: "#fafafa",
  surface: "#ffffff",
  line: "#e4e4e7",
  ink: "#18181b",
  ink2: "#3f3f46",
  muted: "#52525b",
  faint: "#a1a1aa",
  deep: "#121215",
  coral: "#f35252",
  coral600: "#bd3636",
  coral100: "#fdecec",
  coral50: "#fef6f6",
  success: "#16a34a",
  successSoft: "#dcfce7",
  error: "#dc2626",
  errorSoft: "#fee2e2",
};

/** One hue per category, so a color always means the same subject. */
export const category = {
  "AI Engineering": "#8b5cf6",
  "Web Development": "#0ea5e9",
  Data: "#14b8a6",
  Security: "#f43f5e",
  "Backend & Infrastructure": "#f59e0b",
  Languages: "#84cc16",
} as const;

export const hues = Object.values(category);

export const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

export const FPS = 30;
/** Seconds of picture before the voice starts, and after it ends, in each scene. */
export const LEAD = 0.5;
export const TAIL = 0.8;

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
