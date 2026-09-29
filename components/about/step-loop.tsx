"use client";

import { useEffect, useRef } from "react";

interface StepLoopProps {
  src: string;
  poster: string;
  label: string;
}

/**
 * A short, silent loop for a How it works step. It downloads nothing until it scrolls into view,
 * plays only while visible, and stays on its poster frame when the learner prefers reduced motion.
 */
export function StepLoop({ src, poster, label }: StepLoopProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.4 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
      width={1280}
      height={720}
      className="absolute inset-0 size-full object-cover"
    />
  );
}
