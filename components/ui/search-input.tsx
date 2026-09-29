import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchInputSize = "md" | "lg";

/** `field` is the boxed input; `pill` is the header's capsule with a round submit button. */
export type SearchInputVariant = "field" | "pill";

interface SearchInputProps extends Omit<ComponentPropsWithoutRef<"input">, "className" | "type" | "size"> {
  /** Accessible label; visually hidden by default. */
  label?: string;
  /** Keyboard hint shown on the right, e.g. "⌘ K". Pass null to hide it. Not drawn on `pill`. */
  shortcut?: string | null;
  /** `lg` is the hero field: taller, roomier, larger placeholder. Ignored by `pill`. */
  size?: SearchInputSize;
  variant?: SearchInputVariant;
  /** Replaces the magnifier on the `field` variant, e.g. a sparkle for the plan composer. */
  icon?: ReactNode;
  className?: string;
}

const fields: Record<SearchInputSize, string> = {
  md: "h-12 gap-3 px-3",
  lg: "h-14 gap-4 px-5 sm:h-16 sm:px-6",
};

const icons: Record<SearchInputSize, string> = {
  md: "size-5",
  lg: "size-6",
};

const inputs: Record<SearchInputSize, string> = {
  md: "text-body",
  lg: "text-body-lg",
};

/** The pill search field with its submit button. */
export function SearchInput({
  id = "search",
  label = "Search",
  placeholder = "Search anything...",
  shortcut = "⌘ K",
  size = "md",
  variant = "field",
  icon,
  className,
  ...props
}: SearchInputProps) {
  if (variant === "pill") {
    return (
      <div className={cn("w-full", className)}>
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <div className="flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-surface pr-1 pl-5 shadow-press-soft transition-colors focus-within:border-neutral-500">
          <input
            id={id}
            type="search"
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-body text-neutral-900 placeholder:text-neutral-500 focus:outline-none"
            {...props}
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-canvas transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Search className="size-5" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center rounded-lg border border-field-line bg-surface shadow-press-soft transition-colors focus-within:border-neutral-500",
          fields[size],
        )}
      >
        {icon ?? (
          <Search
            className={cn("shrink-0 text-neutral-900", icons[size])}
            strokeWidth={2}
            aria-hidden
          />
        )}
        <input
          id={id}
          type="search"
          placeholder={placeholder}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-neutral-900 placeholder:text-neutral-500 focus:outline-none",
            inputs[size],
          )}
          {...props}
        />
        {shortcut && (
          <kbd
            className={cn(
              "hidden shrink-0 rounded-xs border border-neutral-200 font-mono text-neutral-500 sm:block",
              size === "lg" ? "px-3 py-1.5 text-body" : "px-2 py-1 text-small",
            )}
          >
            {shortcut}
          </kbd>
        )}
      </div>
    </div>
  );
}
