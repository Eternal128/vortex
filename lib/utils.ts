import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The type scale in `app/globals.css` is custom `text-*` utilities. Registered as font sizes so
 * `cn("text-body text-neutral-900")` keeps both instead of reading `text-body` as a color.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-1",
            "display-2",
            "heading-1",
            "heading-2",
            "heading-3",
            "subtitle",
            "body-lg",
            "body",
            "small",
            "action",
            "nav",
            "caption",
          ],
        },
      ],
    },
  },
});

/** Joins class names and resolves Tailwind conflicts, aware of the custom type utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
