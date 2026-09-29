import type { ComponentPropsWithoutRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchInputSize = "md" | "lg";

interface SearchInputProps extends Omit<ComponentPropsWithoutRef<"input">, "className" | "type" | "size"> {
  /** Accessible label; visually hidden by default. */
  label?: string;
  /** Keyboard hint shown on the right, e.g. "⌘ K". Pass null to hide it. */
  shortcut?: string | null;
  /** `lg` is the hero field: taller, roomier, larger placeholder. */
  size?: SearchInputSize;
  className?: string;
}

const fields: Record<SearchInputSize, string> = {
  md: "h-11 gap-3 px-4",
  lg: "h-14 gap-3 px-5 sm:h-16 sm:gap-4 sm:px-6",
};

const icons: Record<SearchInputSize, string> = {
  md: "size-5",
  lg: "size-6",
};

const inputs: Record<SearchInputSize, string> = {
  md: "text-body",
  lg: "text-body-lg sm:text-[17px]",
};

export function SearchInput({
  id = "search",
  label = "Search",
  placeholder = "Search anything...",
  shortcut = "⌘ K",
  size = "md",
  className,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("w-full", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center rounded-lg border border-neutral-200 bg-surface shadow-press-soft transition-colors focus-within:border-neutral-500",
          fields[size],
        )}
      >
        <Search
          className={cn("shrink-0 text-neutral-900", icons[size])}
          strokeWidth={2}
          aria-hidden
        />
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
              size === "lg" ? "px-3 py-2 text-[14px] leading-5" : "px-2 py-1 text-[12px] leading-4",
            )}
          >
            {shortcut}
          </kbd>
        )}
      </div>
    </div>
  );
}
