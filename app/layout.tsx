import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import { PostHogUserIdentifier } from "@/components/posthog/posthog-user-identifier";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vortex",
  description:
    "Vortex turns YouTube's best lessons into structured courses: curated playlists with transcripts, chapters, notes, quizzes and search that finds the exact second a topic is taught.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sourceSans.variable} h-full antialiased`}
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