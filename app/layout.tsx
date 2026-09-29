import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Geist_Pixel } from "next/font/google";
import { PostHogUserIdentifier } from "@/components/posthog/posthog-user-identifier";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Accent face only (course art labels, one hero word), so it is not preloaded. */
const geistPixel = Geist_Pixel({
  variable: "--font-geist-pixel",
  subsets: ["latin"],
  preload: false,
  // No metric overrides exist for a pixel face, so skip the size-adjusted fallback.
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: { default: "Vortex", template: "%s · Vortex" },
  description:
    "Sequenced courses, searchable to the exact second of every lesson video. Field notes and a community roadmap alongside.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${geistPixel.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded-sm focus:bg-surface focus:px-4 focus:py-2 focus:text-body focus:text-neutral-900 focus:shadow-lg"
        >
          Skip to content
        </a>
        <ClerkProvider>
          <PostHogUserIdentifier />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}