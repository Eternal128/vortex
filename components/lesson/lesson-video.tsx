"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Play, RotateCcw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import posthog from "posthog-js";
import { ANALYTICS_EVENTS, type VideoPlaySource } from "@/lib/analytics/events";
import { useWatchDepth } from "@/components/lesson/use-watch-depth";
import { useYouTubeProgress } from "@/components/lesson/use-youtube-progress";
import { buttonClasses } from "@/components/ui/button";
import { QUIZ_OPEN_EVENT } from "@/lib/progress/client";
import { formatTimestamp } from "@/lib/format";
import { type ParsedVideo, videoEmbedUrl, videoProviderLabel } from "@/lib/video";

interface LessonVideoProps {
  /** Sanity id, for the learner's progress record. */
  lessonId: string;
  /** Save resume position and completion — true only for a signed-in learner. */
  saveProgress: boolean;
  lessonTitle: string;
  lessonSlug: string;
  courseSlug: string | null;
  /** The derived "5.1" label, carried onto the completion event. */
  lessonLabel: string | null;
  /** Parsed on the server; null when the stored URL is not an embeddable provider URL. */
  video: ParsedVideo | null;
  /** Pre-sized poster URL from the lesson thumbnail. */
  posterUrl: string | null;
  posterAlt: string;
  /** Second to open at, from `?t=` — already clamped to the lesson duration on the server. */
  startSeconds: number;
  /** The lesson's stored runtime, which watch depth is measured against. */
  durationSeconds: number | null;
  /** The lesson has a quiz: the end-of-video prompt offers it. */
  hasQuiz?: boolean;
  /** Where "Next lesson" goes when there is no quiz. */
  nextHref?: string | null;
}

/**
 * Playback stays on this page through the provider's own embed (AGENTS.md §7) — no custom player.
 * The poster renders first and the iframe only mounts once the learner presses play (or the URL
 * carries a start second), so no third-party frame loads unasked.
 */
export function LessonVideo({
  lessonId,
  saveProgress,
  lessonTitle,
  lessonSlug,
  courseSlug,
  lessonLabel,
  video,
  posterUrl,
  posterAlt,
  startSeconds,
  durationSeconds,
  hasQuiz = false,
  nextHref = null,
}: LessonVideoProps) {
  const deepLinked = Boolean(video) && startSeconds > 0;
  const [isPlaying, setIsPlaying] = useState(deepLinked);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // YouTube's player reports real position and state; other providers fall back to the estimate.
  const isYouTube = video?.provider === "youtube";

  const capturePlay = (source: VideoPlaySource) => {
    posthog.capture(ANALYTICS_EVENTS.videoPlayed, {
      lesson_slug: lessonSlug,
      course_slug: courseSlug,
      provider: video?.provider ?? null,
      start_seconds: startSeconds,
      duration_seconds: durationSeconds,
      source,
    });
  };

  // A deep-linked video starts without anyone pressing anything, so there is no handler to hang the
  // capture on — the mount is the play.
  useEffect(() => {
    if (!deepLinked) return;
    capturePlay("deep_link");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once per deep-linked lesson.
  }, [deepLinked, lessonSlug]);

  const { ended, replay } = useYouTubeProgress({
    iframeRef,
    active: isPlaying && isYouTube,
    lessonId,
    saveProgress,
    lessonSlug,
    courseSlug,
    lessonLabel,
    durationSeconds,
  });

  useWatchDepth({
    isPlaying: isPlaying && !isYouTube,
    lessonId,
    saveProgress,
    lessonSlug,
    courseSlug,
    lessonLabel,
    provider: video?.provider ?? null,
    durationSeconds,
    startSeconds,
  });

  const play = () => {
    setIsPlaying(true);
    capturePlay("poster_click");
  };

  const openQuiz = () => {
    window.dispatchEvent(new CustomEvent(QUIZ_OPEN_EVENT, { detail: { lessonId } }));
    // After the quiz panel has rendered.
    window.setTimeout(() => document.getElementById("lesson-quiz")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
      {isPlaying && video ? (
        <iframe
          ref={iframeRef}
          src={videoEmbedUrl(video, { startSeconds, autoplay: true, jsApi: isYouTube })}
          title={`${lessonTitle}, ${videoProviderLabel(video.provider)} video`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <></>
      )}

      {ended && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center backdrop-blur-sm">
          <p className="text-display-2 text-white">Nice work.</p>
          <p className="text-body-lg text-white/80">
            {hasQuiz ? "Ready for a quick check? 3 questions, about 2 minutes." : "That is the end of this lesson."}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {hasQuiz ? (
              <button type="button" onClick={openQuiz} className={buttonClasses({ size: "lg" })}>
                Take the quiz
              </button>
            ) : nextHref ? (
              <Link href={nextHref} className={buttonClasses({ size: "lg" })}>
                Next lesson
                <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
              </Link>
            ) : null}
            <button
              type="button"
              onClick={replay}
              className={buttonClasses({
                variant: "tertiary",
                size: "lg",
                className: "border-white/40 bg-transparent text-white hover:bg-white/10",
              })}
            >
              <RotateCcw className="size-4" strokeWidth={2} aria-hidden />
              Replay
            </button>
          </div>
        </div>
      )}

      {isPlaying && video ? null : (
        <>
          {posterUrl && (
            <Image
              src={posterUrl}
              alt={posterAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 610px"
              priority
              className="object-cover opacity-80"
            />
          )}

          {video ? (
            <button
              type="button"
              onClick={play}
              className="absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-inset"
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-primary-500 text-on-primary shadow-lg transition-transform hover:scale-105">
                <Play className="size-7 translate-x-0.5 fill-current" strokeWidth={2} aria-hidden />
              </span>
              <span className="sr-only">
                Play {lessonTitle}
                {startSeconds > 0 ? ` from ${formatTimestamp(startSeconds)}` : ""}
              </span>
            </button>
          ) : (
            <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-body text-white/80">
              This lesson&apos;s video is unavailable.
            </p>
          )}
        </>
      )}
    </div>
  );
}
