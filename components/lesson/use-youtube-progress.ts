"use client";

import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { ANALYTICS_EVENTS, WATCH_DEPTH_MILESTONES } from "@/lib/analytics/events";
import { LESSON_COMPLETE_EVENT, sendProgress } from "@/lib/progress/client";

/** Messages are accepted only from YouTube's own player origins. */
const YOUTUBE_ORIGIN = /^https:\/\/www\.youtube(-nocookie)?\.com$/;

/** YouTube player states, from the IFrame API. */
const ENDED = 0;
const PLAYING = 1;
const PAUSED = 2;

const SAVE_EVERY_MS = 15_000;
/** Watching this much of a video counts as finishing it, even without reaching the end. */
const COMPLETE_RATIO = 0.9;
/** A jump in `currentTime` larger than this is a seek, not playback, and earns no watch credit. */
const MAX_TICK_SECONDS = 3;

interface Options {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  /** True once the iframe is mounted. */
  active: boolean;
  lessonId: string;
  /** Save to the learner's record: true only when signed in. Plan lessons save through their own route. */
  saveProgress: boolean;
  lessonSlug: string;
  courseSlug: string | null;
  lessonLabel: string | null;
  durationSeconds: number | null;
}

/**
 * Real progress from YouTube's own embedded player (AGENTS.md §7 — still the provider's player, not a
 * custom one): it posts its position, duration and state once asked with `{"event":"listening"}`.
 *
 * - Resume position: saved every 15s while playing, on pause, and when the learner leaves.
 * - Watched time: only forward playback counts, so seeking to the end does not complete a lesson.
 * - Completion: the video ends, or 90% of it has actually been watched.
 */
export function useYouTubeProgress({
  iframeRef,
  active,
  lessonId,
  saveProgress,
  lessonSlug,
  courseSlug,
  lessonLabel,
  durationSeconds,
}: Options) {
  const router = useRouter();
  const [ended, setEnded] = useState(false);
  const state = useRef({ time: 0, duration: durationSeconds ?? 0, watched: 0, playerState: -1, lastSaved: -1, completed: false });
  const milestones = useRef(new Set<number>());
  const context = useRef({ lessonId, saveProgress, lessonSlug, courseSlug, lessonLabel });

  useEffect(() => {
    context.current = { lessonId, saveProgress, lessonSlug, courseSlug, lessonLabel };
  });

  const command = useCallback(
    (func: string, args: unknown[] = []) => {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
    },
    [iframeRef],
  );

  const replay = useCallback(() => {
    setEnded(false);
    command("seekTo", [0, true]);
    command("playVideo");
  }, [command]);

  useEffect(() => {
    if (!active) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const s = state.current;

    function savePosition({ beacon = false, refresh = false } = {}) {
      const { lessonId: id, saveProgress: save } = context.current;
      const seconds = Math.round(s.time);
      if (!save || seconds === s.lastSaved || s.completed) return;
      s.lastSaved = seconds;
      void sendProgress({ type: "position", lessonId: id, seconds }, { beacon }).then(() => {
        if (refresh) router.refresh();
      });
    }

    function complete(source: "video_ended" | "video_watched") {
      if (s.completed) return;
      s.completed = true;
      const { lessonId: id, saveProgress: save, lessonSlug: slug, courseSlug: course, lessonLabel: label } = context.current;
      window.dispatchEvent(new CustomEvent(LESSON_COMPLETE_EVENT, { detail: { lessonId: id } }));
      posthog.capture(ANALYTICS_EVENTS.lessonCompleted, {
        lesson_slug: slug,
        course_slug: course,
        lesson_label: label,
        duration_seconds: Math.round(s.duration),
        source,
        measurement: "player_events",
      });
      // Refresh once the record is written, so the sidebar check and course percentage update live.
      if (save) void sendProgress({ type: "complete", lessonId: id }).then(() => router.refresh());
    }

    function onInfo(info: { currentTime?: number; duration?: number; playerState?: number }) {
      if (typeof info.duration === "number" && info.duration > 0) s.duration = info.duration;
      if (typeof info.currentTime === "number") {
        const delta = info.currentTime - s.time;
        if (s.playerState === PLAYING && delta > 0 && delta <= MAX_TICK_SECONDS) s.watched += delta;
        s.time = info.currentTime;
      }
      if (typeof info.playerState === "number" && info.playerState !== s.playerState) {
        s.playerState = info.playerState;
        if (info.playerState === PAUSED) savePosition({ refresh: true });
        if (info.playerState === ENDED) {
          setEnded(true);
          complete("video_ended");
        }
        if (info.playerState === PLAYING) setEnded(false);
      }
      if (s.duration > 0) {
        const percent = Math.min(100, Math.round((s.watched / s.duration) * 100));
        for (const milestone of WATCH_DEPTH_MILESTONES) {
          if (percent < milestone || milestones.current.has(milestone)) continue;
          milestones.current.add(milestone);
          posthog.capture(ANALYTICS_EVENTS.videoProgress, {
            lesson_slug: context.current.lessonSlug,
            course_slug: context.current.courseSlug,
            provider: "youtube",
            percent_watched: milestone,
            position_seconds: Math.round(s.time),
            duration_seconds: Math.round(s.duration),
            measurement: "player_events",
          });
        }
        if (s.watched / s.duration >= COMPLETE_RATIO) complete("video_watched");
      }
    }

    let heard = false;
    function onMessage(event: MessageEvent) {
      if (event.source !== iframe?.contentWindow || !YOUTUBE_ORIGIN.test(event.origin)) return;
      let data: { event?: string; info?: unknown };
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      heard = true;
      if ((data.event === "infoDelivery" || data.event === "initialDelivery") && data.info && typeof data.info === "object") {
        onInfo(data.info as { currentTime?: number; duration?: number; playerState?: number });
      } else if (data.event === "onStateChange" && typeof data.info === "number") {
        onInfo({ playerState: data.info });
      }
    }

    // The player only starts reporting once asked; keep asking until it answers.
    const listen = () => iframe.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: lessonId, channel: "widget" }), "*");
    const ask = window.setInterval(() => (heard ? window.clearInterval(ask) : listen()), 500);
    iframe.addEventListener("load", listen);
    window.addEventListener("message", onMessage);

    const saver = window.setInterval(() => {
      if (s.playerState === PLAYING) savePosition();
    }, SAVE_EVERY_MS);
    const onPageHide = () => savePosition({ beacon: true });
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearInterval(ask);
      window.clearInterval(saver);
      iframe.removeEventListener("load", listen);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("pagehide", onPageHide);
      // Leaving the lesson client-side is an exit too.
      savePosition();
    };
  }, [active, iframeRef, lessonId, router]);

  return { ended, replay };
}
