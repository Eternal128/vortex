import { Composition } from "remotion";
import { Film, Loop, loopFrames, TOTAL_FRAMES } from "./film/Film";
import { FPS } from "./theme";

/** The About page steps each loop one chapter of the film. */
export const LOOPS = { "step-find": "search", "step-watch": "progress", "step-quiz": "quiz", "step-plan": "plan" } as const;

export function Root() {
  return (
    <>
      <Composition id="Explainer" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
      {Object.entries(LOOPS).map(([id, scene]) => (
        <Composition
          key={id}
          id={id}
          component={Loop}
          defaultProps={{ scene }}
          durationInFrames={loopFrames(scene).length}
          fps={FPS}
          width={1920}
          height={1080}
        />
      ))}
    </>
  );
}
