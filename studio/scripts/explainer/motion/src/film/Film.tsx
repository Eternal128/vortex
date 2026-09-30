import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import timing from "../timing.json";
import { FPS, Shots } from "./shots";

/** The film is silent here; mix.mjs builds its soundtrack and render.mjs muxes the two. */
export const TOTAL_FRAMES = Math.round(timing.seconds * FPS);

export function Film() {
  return <Shots />;
}

/**
 * The About page's step loops, one chapter each, without the tagline. Each closes on a blend back
 * into its own first frame, so its last frame and its first are the same picture. Mirrored in
 * render.mjs.
 */
export const LOOPS = {
  "step-find": { from: 26, to: 39 },
  "step-watch": { from: 39, to: 52 },
  "step-quiz": { from: 52, to: 65 },
  "step-plan": { from: 65, to: 78 },
} as const;
export type LoopId = keyof typeof LOOPS;

/** Frames at the end of a loop spent blending back into its first frame. */
export const LOOP_BLEND = 14;

export const loopFrames = (id: LoopId) => Math.round((LOOPS[id].to - LOOPS[id].from) * FPS);

export function Loop({ id }: { id: LoopId }) {
  const frame = useCurrentFrame();
  const start = Math.round(LOOPS[id].from * FPS);
  const length = loopFrames(id);
  const blend = interpolate(frame, [length - LOOP_BLEND, length - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Sequence from={-start}>
        <Shots bare />
      </Sequence>
      {blend > 0 && (
        <AbsoluteFill style={{ opacity: blend }}>
          {/* Offset so this copy always sees the loop's first frame (Freeze clamps to the loop's own length). */}
          <Sequence from={frame - start}>
            <Shots bare />
          </Sequence>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
