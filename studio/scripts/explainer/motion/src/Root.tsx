import { Composition } from "remotion";
import { Explainer, LOOP_BLEND, Loop, timeline, TOTAL_FRAMES } from "./Explainer";
import { FPS } from "./theme";

/** The About page steps each loop one scene. */
export const LOOPS = { "step-find": "search", "step-watch": "enroll", "step-quiz": "quiz", "step-plan": "plan" } as const;

export function Root() {
  return (
    <>
      <Composition id="Explainer" component={Explainer} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
      {Object.entries(LOOPS).map(([id, scene]) => (
        <Composition
          key={id}
          id={id}
          component={Loop}
          defaultProps={{ scene }}
          durationInFrames={timeline.find((item) => item.name === scene)!.frames - LOOP_BLEND}
          fps={FPS}
          width={1920}
          height={1080}
        />
      ))}
    </>
  );
}
