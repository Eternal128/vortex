"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CreatorAvatars } from "@/components/creators/creator-avatars";
import type { HomeCourse } from "@/components/home/home-course";
import { buttonClasses } from "@/components/ui/button";
import { coursesHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

/** Course slide fills, cycled: the spec's cream, soft blue and pink illustration tints. */
const tints = ["bg-promo-cream", "bg-primary-50", "bg-promo-pink"];

interface PromoCarouselProps {
  /** Featured courses, shown after the pitch slide. */
  courses: HomeCourse[];
}

/**
 * The home carousel: the Vortex pitch, then featured courses. Native scroll-snap does the
 * scrolling; the dots and arrows only jump to a slide. No autoplay.
 */
export function PromoCarousel({ courses }: PromoCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const total = courses.length + 1;
  const [visible, setVisible] = useState<boolean[]>(() =>
    Array.from({ length: total }, (_, index) => index < 2),
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.children) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        setVisible((current) => {
          const next = [...current];
          for (const entry of entries) {
            const index = slides.indexOf(entry.target as HTMLElement);
            if (index >= 0) next[index] = entry.intersectionRatio >= 0.6;
          }
          return next;
        });
      },
      { root: track, threshold: [0, 0.6, 1] },
    );
    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [total]);

  const scrollToSlide = useCallback((index: number) => {
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    if (!track || !slide) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: slide.offsetLeft, behavior: reduce ? "auto" : "smooth" });
  }, []);

  const first = visible.indexOf(true);
  const last = visible.lastIndexOf(true);

  return (
    <section aria-roledescription="carousel" aria-label="Featured" className="relative">
      <div
        ref={trackRef}
        className="relative flex snap-x snap-mandatory gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Slide index={0} total={total} className="bg-promo-ink">
          <div className="relative z-10 flex flex-col justify-center p-8 sm:max-w-[54%]">
            <h1 className="text-display-2 text-white">
              YouTube&rsquo;s best lessons, organized into real courses.
            </h1>
            <p className="mt-3 text-body-lg text-white/80">
              Curated playlists with notes, progress, and a quiz after every video.
            </p>
            <Link
              href={coursesHref}
              className={buttonClasses({
                variant: "tertiary",
                className: "mt-6 w-fit border-transparent focus-visible:ring-offset-promo-ink",
              })}
            >
              Explore courses
              <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
            </Link>
          </div>
          <Image
            src="/generated/hero-play.jpg"
            alt=""
            width={800}
            height={800}
            priority
            sizes="(min-width: 1024px) 320px, 60vw"
            className="pointer-events-none absolute inset-y-0 right-0 h-full w-auto object-cover opacity-40 [mask-image:linear-gradient(to_right,transparent,black_45%)] sm:opacity-100"
          />
        </Slide>

        {courses.map((course, index) => (
          <Slide
            key={course.id}
            index={index + 1}
            total={total}
            className={tints[index % tints.length]}
          >
            <div className="relative z-10 flex flex-col justify-center p-8 sm:max-w-[60%]">
              {course.creators.length > 0 && (
                <p className="flex items-center gap-2 text-body-lg text-neutral-700">
                  <CreatorAvatars creators={course.creators} size={28} />
                  <span className="min-w-0 truncate">Videos by {course.creatorsLabel}</span>
                </p>
              )}
              <h2 className="mt-3 line-clamp-2 text-display-2 text-neutral-900">{course.title}</h2>
              <p className="mt-3 line-clamp-3 text-body-lg text-neutral-700">{course.summary}</p>
              <Link href={course.href} className={buttonClasses({ className: "mt-6 w-fit" })}>
                View course
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </Link>
            </div>
            {course.cover && (
              <div className="absolute inset-y-6 right-6 hidden w-[32%] overflow-hidden rounded-lg sm:block">
                <Image src={course.cover} alt="" fill sizes="220px" className="object-cover" />
              </div>
            )}
          </Slide>
        ))}
      </div>

      <ArrowButton
        direction="previous"
        disabled={first <= 0}
        onClick={() => scrollToSlide(Math.max(0, first - 1))}
      />
      <ArrowButton
        direction="next"
        disabled={last < 0 || last >= total - 1}
        onClick={() => scrollToSlide(Math.min(total - 1, first + 1))}
      />

      <div className="mt-3 flex items-center gap-1">
        {Array.from({ length: total }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Show slide ${index + 1}`}
            aria-current={visible[index] ? "true" : undefined}
            onClick={() => scrollToSlide(index)}
            className="flex h-6 items-center rounded-full px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <span
              className={cn(
                "block h-2 rounded-full transition-[width,background-color] duration-200",
                visible[index] ? "w-6 bg-neutral-700" : "w-2 bg-neutral-300 hover:bg-neutral-500",
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}

function Slide({
  index,
  total,
  className,
  children,
}: {
  index: number;
  total: number;
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}`}
      className={cn(
        "relative flex min-h-75 shrink-0 basis-[88%] snap-start overflow-hidden rounded-lg sm:basis-[80%] lg:basis-[calc(48%-12px)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "previous" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={direction === "previous" ? "Previous slide" : "Next slide"}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "absolute top-[150px] z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-canvas-line bg-surface text-neutral-900 shadow-md transition-opacity hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-0 sm:flex",
        direction === "previous" ? "-left-4" : "-right-4",
      )}
    >
      <Icon className="size-5" strokeWidth={2} aria-hidden />
    </button>
  );
}
