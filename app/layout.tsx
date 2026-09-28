import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { PostHogUserIdentifier } from "@/components/posthog/posthog-user-identifier";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vortex",
  description:
    "A unified design language for Vortex learning platform. Clean, modern and focused on clarity, consistency and intuitive learning experiences.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
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
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}