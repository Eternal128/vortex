"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { applyTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const options = [
  { value: "system", label: "Match system", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
] as const satisfies readonly { value: Theme; label: string; Icon: typeof Sun }[];

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // `storage` covers the same site open in another tab.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): Theme {
  return (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? "system";
}

/** No stored choice is readable on the server, so no segment renders selected. */
function getServerSnapshot(): Theme | null {
  return null;
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (theme !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => applyTheme("system");
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [theme]);

  function choose(next: Theme) {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
    for (const notify of listeners) notify();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-canvas-line bg-surface p-0.5 shadow-sm",
        className,
      )}
    >
      {options.map(({ value, label, Icon }) => {
        const selected = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => choose(value)}
            className={cn(
              "rounded-full p-1.5 transition-colors duration-200 focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1",
              "focus-visible:ring-offset-background",
              selected
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-500 hover:text-neutral-900",
            )}
          >
            <Icon className="size-4" strokeWidth={2} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
