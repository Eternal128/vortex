import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "outline" | "text" | "pill";
export type ButtonSize = "xl" | "lg" | "md" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md text-action whitespace-nowrap " +
  "transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out-soft " +
  "active:translate-y-px disabled:active:translate-y-0 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed";

const sizes: Record<ButtonSize, string> = {
  /** Hero call to action. */
  xl: "h-13 gap-3 px-5 text-[17px]",
  lg: "h-11 px-4 text-[15px]",
  md: "h-9 px-3.5",
  /** Round icon-only control, like the header search. */
  icon: "size-9 rounded-full p-0",
};

const variants: Record<ButtonVariant, string> = {
  /** Charcoal key with a lit rim and a hard lip, as in the fanout reference. */
  primary: "bg-primary-500 text-on-primary shadow-press",
  secondary: "border border-neutral-900 bg-surface text-neutral-900",
  /** White key: hairline border and a soft bottom edge ("Sign in"). */
  tertiary: "border border-neutral-200 bg-surface text-neutral-900 shadow-press-soft",
  outline: "border border-neutral-300 bg-surface text-neutral-900",
  text: "px-0 text-neutral-900 underline decoration-neutral-300 underline-offset-4",
  /** Rounded outline capsule ("New in September →"). */
  pill: "rounded-full border border-neutral-200 bg-surface text-neutral-900 shadow-sm",
};

const hoverVariants: Record<ButtonVariant, string> = {
  primary: "hover:bg-primary-400",
  secondary: "hover:bg-neutral-50",
  tertiary: "hover:bg-neutral-50",
  outline: "hover:border-neutral-900",
  text: "hover:decoration-neutral-900",
  pill: "hover:border-neutral-300 hover:shadow-md",
};

/** Applied statically so the design system sheet can show the hover row. */
const hoverStatic: Record<ButtonVariant, string> = {
  primary: "bg-primary-400",
  secondary: "bg-neutral-50",
  tertiary: "bg-neutral-50",
  outline: "border-neutral-900",
  text: "decoration-neutral-900",
  pill: "border-neutral-300 shadow-md",
};

const disabledVariants: Record<ButtonVariant, string> = {
  primary: "bg-neutral-100 text-neutral-300 shadow-none",
  secondary: "border-neutral-200 text-neutral-300",
  tertiary: "border-neutral-200 bg-neutral-50 text-neutral-300 shadow-none",
  outline: "border-neutral-200 text-neutral-300",
  text: "text-neutral-300",
  pill: "text-neutral-300 shadow-none",
};

/**
 * Button appearance as a class string, for elements that cannot be a `Button`/`ButtonLink` —
 * chiefly `next/link`, which must render its own anchor to keep prefetching.
 */
export function buttonClasses({
  variant = "primary",
  size = "lg",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(base, sizes[size], variants[variant], hoverVariants[variant], className);
}

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon rendered after the label. */
  icon?: ReactNode;
  /** Renders the hover appearance without a pointer, for documentation. */
  hovered?: boolean;
  children: ReactNode;
  className?: string;
}

type ButtonProps = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<"button">, "children" | "className">;

/** The design system's button, in its variants and sizes. */
export function Button({
  variant = "primary",
  size = "lg",
  icon,
  hovered = false,
  disabled = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        base,
        sizes[size],
        variants[variant],
        disabled ? disabledVariants[variant] : hoverVariants[variant],
        hovered && !disabled && hoverStatic[variant],
        className,
      )}
      {...props}
    >
      {children}
      {icon}
    </button>
  );
}

type ButtonLinkProps = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<"a">, "children" | "className">;

/** A plain anchor styled as a button, for links that are not `next/link`. */
export function ButtonLink({
  variant = "primary",
  size = "lg",
  icon,
  hovered = false,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <a
      className={cn(
        base,
        sizes[size],
        variants[variant],
        hoverVariants[variant],
        hovered && hoverStatic[variant],
        className,
      )}
      {...props}
    >
      {children}
      {icon}
    </a>
  );
}
