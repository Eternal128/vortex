import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SearchForm } from "@/components/search/search-form";
import { buttonClasses } from "@/components/ui/button";

/** Fades the backdrop out before it reaches the section edge, so it reads as light rather than as a pasted image. */
const backdropFade =
  "[mask-image:radial-gradient(75%_70%_at_50%_30%,black_0%,transparent_100%)]";

export function Hero() {
  return (
    <section className="relative isolate flex flex-col items-center overflow-hidden px-6 pt-14 pb-16 text-center sm:px-12 sm:pt-16 sm:pb-20 xl:px-18 xl:pt-20 xl:pb-24">
      {/* Generated paper backdrop, one per theme. Decorative, so both are alt="". */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Image
          src="/hero-light.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className={`object-cover opacity-55 dark:hidden ${backdropFade}`}
        />
        <Image
          src="/hero-dark.png"
          alt=""
          fill
          sizes="100vw"
          className={`hidden object-cover opacity-70 dark:block ${backdropFade}`}
        />
      </div>
      <p className="rounded-sm border border-canvas-line bg-surface px-5 py-3 text-[11px] leading-4 font-semibold tracking-[0.16em] text-primary-500 uppercase shadow-sm">
        Intelligent learning
      </p>

      <h1 className="mt-10 max-w-[16ch] font-display text-[40px] leading-[1.2] font-bold text-balance text-neutral-900 sm:text-[52px] lg:text-[60px] lg:leading-[74px]">
        Search your learning in plain English.
      </h1>

      <p className="mt-7 max-w-[46ch] text-[17px] leading-8 text-balance text-neutral-500 sm:text-[18px]">
        Vortex understands what you want to learn and finds the exact lessons across all your
        courses.
      </p>

      <Link
        href="/courses"
        className={buttonClasses({ size: "xl", className: "mt-11 w-full max-w-xs sm:w-auto" })}
      >
        Explore Courses
        <ArrowRight className="size-5" strokeWidth={2} aria-hidden />
      </Link>

      <SearchForm
        id="home-search"
        size="lg"
        label="Ask anything about your learning"
        placeholder="Ask anything about your learning..."
        className="mt-11 w-full max-w-225"
      />
    </section>
  );
}
