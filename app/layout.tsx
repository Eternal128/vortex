import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Geist_Pixel } from "next/font/google";
import { LearnerCountsProvider } from "@/components/learners/learner-counts";
import { PostHogUserIdentifier } from "@/components/posthog/posthog-user-identifier";
import { getLearnerCounts } from "@/lib/learners";
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

/** Accent face only (course card titles, one hero word), so it is not preloaded. */
const geistPixel = Geist_Pixel({
  variable: "--font-geist-pixel",
  subsets: ["latin"],
  preload: false,
  // No metric overrides exist for a pixel face, so skip the size-adjusted fallback.
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Vortex",
  description:
    "Vortex turns YouTube's best lessons into structured courses: curated playlists with transcripts, chapters, notes, quizzes and search that finds the exact second a topic is taught.",
};

/** The document shell: font, theme, Clerk, analytics, and live learner counts around every page. */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  // First paint carries real counts; the provider keeps them live from there.
  const learners = await getLearnerCounts();

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
          <LearnerCountsProvider initial={learners}>{children}</LearnerCountsProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}