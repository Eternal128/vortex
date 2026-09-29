import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { coursesHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

const banners = [
  {
    title: "Search every lesson in plain English",
    body: "Ask a question and land on the exact second it is taught.",
    cta: "Try a search",
    href: "/search",
    image: "/generated/banner-search-zinc.jpg",
    tone: "dark" as const,
  },
  {
    title: "Learn at your own pace",
    body: "Every course is a YouTube playlist you can pause, resume and quiz yourself on.",
    cta: "Browse courses",
    href: coursesHref,
    image: "/generated/banner-pace-light.jpg",
    tone: "light" as const,
  },
];

/**
 * Two promo panels, one charcoal and one light, each with generated art fading in from the right.
 * The whole panel is the link (the CTA's hit area stretches over it), so it lifts on hover.
 */
export function PromoBanners() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {banners.map((banner) => {
        const dark = banner.tone === "dark";
        return (
          <section
            key={banner.title}
            aria-label={banner.title}
            className={cn(
              "lift relative isolate flex min-h-60 overflow-hidden rounded-lg",
              dark ? "bg-promo-deep" : "border border-canvas-line bg-neutral-100",
            )}
          >
            <Image
              src={banner.image}
              alt=""
              width={1168}
              height={880}
              sizes="(min-width: 1024px) 400px, 70vw"
              className="pointer-events-none absolute inset-y-0 right-0 -z-10 h-full w-auto object-cover opacity-40 [mask-image:linear-gradient(to_right,transparent,black_40%)] sm:opacity-100"
            />
            <div className="flex flex-col justify-center p-8 sm:max-w-[58%]">
              <h2 className={cn("text-heading-1", dark ? "text-white" : "text-neutral-900")}>{banner.title}</h2>
              <p className={cn("mt-3 text-body-lg", dark ? "text-white/80" : "text-neutral-700")}>{banner.body}</p>
              <Link
                href={banner.href}
                className={cn(
                  "mt-5 inline-flex w-fit items-center gap-2 rounded-xs text-action underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  dark
                    ? "text-white focus-visible:ring-white focus-visible:ring-offset-promo-deep"
                    : "text-primary-600 focus-visible:ring-primary-500",
                )}
              >
                {banner.cta}
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </Link>
            </div>
          </section>
        );
      })}
    </div>
  );
}
