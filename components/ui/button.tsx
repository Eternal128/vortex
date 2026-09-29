import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "outline" | "text";
export type ButtonSize = "xl" | "lg" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md text-action whitespace-nowrap " +
  "transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out-soft " +
  "active:scale-[0.98] disabled:active:scale-100 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed";

const sizes: Record<ButtonSize, string> = {
  /** Hero call to action — the spec's 48px input height, so it lines up with the search field. */
  xl: "h-12 gap-3 px-6",
  lg: "h-11 px-4",
  /** The spec's 36px action button. */
  md: "h-9 px-4",
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary-500 text-on-primary",
  secondary: "border border-neutral-900 bg-surface text-neutral-900",
  tertiary: "border border-neutral-200 bg-surface text-neutral-900",
  /** Primary-coloured outline — the header's sign-up action. */
  outline: "border border-primary-500 bg-surface text-primary-600",
  text: "px-0 text-primary-600 underline-offset-4",
};

const hoverVariants: Record<ButtonVariant, string> = {
  primary: "hover:bg-primary-600",
  secondary: "hover:bg-neutral-50",
  tertiary: "hover:bg-neutral-50",
  outline: "hover:bg-primary-50",
  text: "hover:text-primary-600 hover:underline",
};

/** Applied statically so the design system sheet can show the hover row. */
const hoverStatic: Record<ButtonVariant, string> = {
  primary: "bg-primary-600",
  secondary: "bg-neutral-50",
  tertiary: "bg-neutral-50",
  outline: "bg-primary-50",
  text: "text-primary-600 underline",
};

const disabledVariants: Record<ButtonVariant, string> = {
  primary: "bg-neutral-100 text-neutral-300",
  secondary: "border-neutral-200 text-neutral-300",
  tertiary: "border-neutral-200 bg-neutral-50 text-neutral-300",
  outline: "border-neutral-200 text-neutral-300",
  text: "text-neutral-300",
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
