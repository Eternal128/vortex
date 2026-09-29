export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "vortex-theme";

/** A first visit gets light mode; "Match system" and dark remain one click away. */
export const DEFAULT_THEME: Theme = "light";

/** The concrete theme to show: "system" resolves to the OS preference. */
export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Applies a theme to the page by toggling the `dark` class on `<html>`. */
export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", resolveTheme(theme) === "dark");
}

/**
 * Runs before first paint so the stored theme is on `<html>` by the time the
 * page renders — without it a dark-mode visitor gets a white flash on reload.
 * Kept as a string because it must be inlined, not loaded as a module.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})||"light";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;
