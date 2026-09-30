import type { ComponentType } from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { FPS } from "../theme";
import timing from "../timing.json";
import { Close, Courses, Intro, Plan, Progress, Quiz, Search } from "./chapters";
import { Canvas } from "./kit";

const CHAPTERS: Record<string, ComponentType<{ t: number }>> = {
  intro: Intro,
  courses: Courses,
  search: Search,
  progress: Progress,
  quiz: Quiz,
  plan: Plan,
  close: Close,
};

/** Frames each chapter dissolves into the next. Mirrored in render.mjs. */
export const DISSOLVE = 24;

/** Each chapter: its lead-in, its narration, room after it; the next one starts while it dissolves. */
export const timeline = (() => {
  let from = 0;
  return timing.map((take, i) => {
    const frames = Math.round((take.lead + take.seconds + take.tail) * FPS);
    const chapter = { name: take.name, lead: take.lead, from, frames, voiceAt: from + Math.round(take.lead * FPS) };
    from += frames - (i < timing.length - 1 ? DISSOLVE : 0);
    return chapter;
  });
})();

export const TOTAL_FRAMES = timeline.at(-1)!.from + timeline.at(-1)!.frames;

/** One chapter at its own clock: `t` is seconds of its narration, negative during the lead-in. */
function Chapter({ name, lead, frames, first, last }: { name: string; lead: number; frames: number; first: boolean; last: boolean }) {
  const frame = useCurrentFrame();
  const Scene = CHAPTERS[name];
  const opacity = Math.min(
    first ? 1 : interpolate(frame, [0, DISSOLVE], [0, 1], { extrapolateRight: "clamp" }),
    last ? 1 : interpolate(frame, [frames - DISSOLVE, frames], [1, 0], { extrapolateLeft: "clamp" }),
  );
  return (
    <AbsoluteFill style={{ opacity }}>
      <Scene t={frame / FPS - lead} />
    </AbsoluteFill>
  );
}

export function Film() {
  return (
    <AbsoluteFill>
      <Canvas />
      {timeline.map((chapter, i) => (
        <Sequence key={chapter.name} from={chapter.from} durationInFrames={chapter.frames} name={chapter.name}>
          <Chapter name={chapter.name} lead={chapter.lead} frames={chapter.frames} first={i === 0} last={i === timeline.length - 1} />
        </Sequence>
      ))}
      {timeline.map((chapter, i) => (
        <Sequence key={`voice-${chapter.name}`} from={chapter.voiceAt} name={`voice ${chapter.name}`}>
          <Audio src={staticFile(`vo/n${i}.mp3`)} />
        </Sequence>
      ))}
      <Audio src={staticFile("music/bed.m4a")} />
    </AbsoluteFill>
  );
}

/** Frames cross-dissolved at a loop's seam, so a step card's loop never jumps. */
export const LOOP_BLEND = 15;

/** Where each About-page loop starts (voice-time), once its device is in place. Mirrored in render.mjs. */
export const LOOP_STARTS: Record<string, number> = { search: 1.4, progress: 1.4, quiz: 1.6, plan: 0.8 };

export function loopFrames(name: string) {
  const chapter = timeline.find((item) => item.name === name)!;
  const start = Math.round((chapter.lead + LOOP_STARTS[name]) * FPS);
  return { start, length: chapter.frames - start - LOOP_BLEND };
}

/** One chapter, silent, from its product shot to its end, dissolving back into its start. */
export function Loop({ scene }: { scene: string }) {
  const frame = useCurrentFrame();
  const chapter = timeline.find((item) => item.name === scene)!;
  const Scene = CHAPTERS[scene];
  const { start, length } = loopFrames(scene);
  const blend = interpolate(frame, [length - LOOP_BLEND, length], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const at = (offset: number) => (frame + offset) / FPS - chapter.lead;
  return (
    <AbsoluteFill>
      <Canvas />
      <AbsoluteFill>
        <Scene t={at(start + LOOP_BLEND)} />
      </AbsoluteFill>
      {frame >= length - LOOP_BLEND && (
        <AbsoluteFill style={{ opacity: blend }}>
          <Scene t={at(start - (length - LOOP_BLEND))} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
