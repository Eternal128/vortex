import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/logo";
import { PageFrame } from "@/components/layout/page-frame";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Clerk appearance tuned to the site: ink primary, Geist, 10px radius, no Clerk card chrome. The
 * page supplies the white card, the logo mark and the heading, as in the reference.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#262626",
    colorText: "#1f1f1f",
    colorTextSecondary: "#6e6e6e",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    borderRadius: "10px",
    fontFamily: "var(--font-geist), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none border-0",
    card: "shadow-none border-0 p-0 bg-transparent",
    header: "hidden",
    footer: "bg-transparent",
    formButtonPrimary:
      "h-11 bg-[#262626] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_2px_0_0_#000] hover:bg-[#3d3d3d]",
    socialButtonsBlockButton: "h-11 shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.06),0_1px_2px_0_rgba(0,0,0,0.06)]",
    formFieldInput: "h-11",
  },
} as const;

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <PageFrame>
      <SiteHeader />
      <main id="main" className="flex flex-1 items-start justify-center px-5 py-16 sm:py-24">
        <div className="w-full max-w-md rounded-xl border border-canvas-line bg-white p-8 text-center shadow-md sm:p-10">
          <LogoMark size={40} className="mx-auto" />
          <h1 className="mt-6 text-[32px] leading-tight font-semibold tracking-[-0.045em] text-[#1f1f1f]">{title}</h1>
          <p className="mt-2 text-[15px] text-[#6e6e6e]">{subtitle}</p>
          <div className="mt-8 flex justify-center text-left">{children}</div>
        </div>
      </main>
    </PageFrame>
  );
}
