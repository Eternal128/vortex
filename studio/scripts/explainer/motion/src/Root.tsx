import { Composition } from "remotion";
import { Film, Loop, LOOPS, type LoopId, loopFrames, TOTAL_FRAMES } from "./film/Film";
import { FPS } from "./film/shots";

export function Root() {
  return (
    <>
      <Composition id="Explainer" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
      {(Object.keys(LOOPS) as LoopId[]).map((id) => (
        <Composition key={id} id={id} component={Loop} defaultProps={{ id }} durationInFrames={loopFrames(id)} fps={FPS} width={1920} height={1080} />
      ))}
    </>
  );
}
