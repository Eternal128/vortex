/**
 * The course card palettes. Each course card is artwork, so its colours are fixed and do not swap
 * with the site theme: a blue card is blue on a light or a dark canvas, as in the reference.
 *
 * `accent` on a course picks one; without it the slug picks one deterministically, so a course
 * keeps its colour across renders and pages.
 */
export const PATH_PALETTES = {
  blue: { card: "#2d6a9d", fg: "#ffffff", muted: "rgba(255,255,255,0.72)", art: "#c7e5fb", ink: "#0e2233" },
  mint: { card: "#86e29c", fg: "#0f2a18", muted: "rgba(15,42,24,0.66)", art: "#14b894", ink: "#06261d" },
  sand: { card: "#efe6d3", fg: "#2b2419", muted: "rgba(43,36,25,0.62)", art: "#fba516", ink: "#2b1a02" },
  ink: { card: "#232323", fg: "#f5f5f5", muted: "rgba(245,245,245,0.66)", art: "#e33ce8", ink: "#1a031b" },
  lilac: { card: "#ece8f6", fg: "#26213a", muted: "rgba(38,33,58,0.6)", art: "#f4d9ef", ink: "#1f1830" },
  sky: { card: "#dde6f5", fg: "#1b2740", muted: "rgba(27,39,64,0.62)", art: "#fbd24c", ink: "#2a2100" },
  forest: { card: "#1f4a33", fg: "#f1f7f3", muted: "rgba(241,247,243,0.7)", art: "#5ee39a", ink: "#062414" },
  navy: { card: "#243155", fg: "#f2f4fa", muted: "rgba(242,244,250,0.68)", art: "#f7a05a", ink: "#2b1402" },
} as const;

export type PathPaletteName = keyof typeof PATH_PALETTES;
export type PathPalette = (typeof PATH_PALETTES)[PathPaletteName];

const ORDER = Object.keys(PATH_PALETTES) as PathPaletteName[];

function isPaletteName(value: string | null | undefined): value is PathPaletteName {
  return !!value && value in PATH_PALETTES;
}

/** The stored accent when valid, otherwise a stable pick from the slug. */
export function paletteFor(accent: string | null | undefined, slug: string | null | undefined) {
  if (isPaletteName(accent)) return PATH_PALETTES[accent];
  let hash = 0;
  for (const char of slug ?? "") hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PATH_PALETTES[ORDER[hash % ORDER.length]];
}

/** The label drawn on the stack art: the authored one, else the title, lowercased. */
export function artLabelFor(artLabel: string | null | undefined, title: string | null | undefined) {
  return (artLabel?.trim() || title?.trim() || "vortex").toLowerCase();
}
