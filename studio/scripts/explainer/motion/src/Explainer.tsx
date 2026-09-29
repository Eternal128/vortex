import type { ComponentType } from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Close } from "./scenes/Close";
import { Enroll } from "./scenes/Enroll";
import { Motive } from "./scenes/Motive";
import { Plan } from "./scenes/Plan";
import { Quiz } from "./scenes/Quiz";
import { Search } from "./scenes/Search";
import { What } from "./scenes/What";
import { color, FPS, LEAD, TAIL } from "./theme";
import timing from "./timing.json";

export const SCENES: Record<string, ComponentType> = {
  motive: Motive,
  what: What,
  search: Search,
  enroll: Enroll,
  quiz: Quiz,
  plan: Plan,
  close: Close,
};

/** Each scene runs from a short lead-in, through its narration, to a beat of room after it. */
export const timeline = (() => {
  let from = 0;
  return timing.map((take) => {
    const frames = Math.round((LEAD + take.seconds + TAIL) * FPS);
    const scene = { name: take.name, from, frames, voiceAt: from + Math.round(LEAD * FPS) };
    from += frames;
    return scene;
  });
})();

export const TOTAL_FRAMES = timeline.reduce((sum, scene) => sum + scene.frames, 0);

/** Frames of the wipe on each side of a cut. */
const WIPE = 9;
const BANDS = [
  { color: "#8b5cf6", width: 260, lag: 0 },
  { color: "#f59e0b", width: 260, lag: 2 },
  { color: color.coral, width: 2500, lag: 4 },
];

/** A cut hidden under three skewed bands of color sweeping across, violet and amber leading coral. */
function Wipe() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {BANDS.map((band) => {
        const x = interpolate(frame - band.lag, [0, WIPE * 2], [-band.width - 400, 1920 + 400], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={band.color}
            style={{
              position: "absolute",
              top: -100,
              bottom: -100,
              left: x,
              width: band.width,
              background: band.color,
              transform: "skewX(-12deg)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}

export function Explainer() {
  return (
    <AbsoluteFill style={{ background: color.canvas }}>
      {timeline.map((scene) => {
        const Scene = SCENES[scene.name];
        return (
          <Sequence key={scene.name} from={scene.from} durationInFrames={scene.frames} name={scene.name}>
            <Scene />
          </Sequence>
        );
      })}
      {timeline.slice(1).map((scene) => (
        <Sequence key={`wipe-${scene.name}`} from={scene.from - WIPE - 4} durationInFrames={WIPE * 2 + 8} name={`wipe → ${scene.name}`}>
          <Wipe />
        </Sequence>
      ))}
      {timeline.map((scene, index) => (
        <Sequence key={`vo-${scene.name}`} from={scene.voiceAt} name={`voice ${scene.name}`}>
          <Audio src={staticFile(`vo/n${index}.mp3`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

/** Frames cross-dissolved at the loop point, so a step card's loop never jumps. */
export const LOOP_BLEND = 15;

/** One scene, silent, looping cleanly: its end dissolves back into its own opening. */
export function Loop({ scene }: { scene: string }) {
  const frame = useCurrentFrame();
  const entry = timeline.find((item) => item.name === scene)!;
  const Scene = SCENES[scene];
  const length = entry.frames - LOOP_BLEND;
  const blend = interpolate(frame, [length - LOOP_BLEND, length], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Sequence from={-LOOP_BLEND}>
        <Scene />
      </Sequence>
      <Sequence from={length - LOOP_BLEND} style={{ opacity: blend }}>
        <Scene />
      </Sequence>
    </AbsoluteFill>
  );
}
