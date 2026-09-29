import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

interface PageFrameProps {
  children: ReactNode;
  className?: string;
  /** The lesson player is a focused workspace, so it can opt out of the site footer. */
  footer?: boolean;
}

/** The page shell: a flat off-white canvas, the page's own header and body, then the footer. */
export function PageFrame({ children, className, footer = true }: PageFrameProps) {
  return (
    <div className={cn("flex flex-1 flex-col bg-canvas", className)}>
      {children}
      {footer ? <SiteFooter /> : null}
    </div>
  );
}
