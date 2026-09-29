import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

interface PageFrameProps {
  /** Rendered full-bleed above the column, so the header and its Explore panel span the window. */
  header?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** The page: a full-width header, a flat canvas with the content centred at 1440px, then the footer. */
export function PageFrame({ header, children, className }: PageFrameProps) {
  return (
    <div className={cn("flex flex-1 flex-col bg-canvas", className)}>
      {header}
      <div className="flex flex-1 justify-center">
        <div className="flex w-full max-w-360 flex-col">{children}</div>
      </div>
      <SiteFooter />
    </div>
  );
}
