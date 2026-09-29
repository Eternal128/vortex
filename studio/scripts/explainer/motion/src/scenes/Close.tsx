import { useCurrentFrame } from "remotion";
import { color, ease, FPS, hues, LEAD, rand } from "../theme";
import { Stage, Tile, Windmill } from "../ui";

/** "Vortex. Learn anything from YouTube, the way a course teaches it." Also the poster frame. */
export function Close() {
  const frame = useCurrentFrame();
  const t = frame / FPS - LEAD;

  const sails = ease(t, -0.45, 0.9);
  const word = ease(t, 0.2, 0.6);
  const line1 = ease(t, 2.0, 0.5);
  const line2 = ease(t, 5.25, 0.5);
  const underline = ease(t, 5.6, 0.6);

  return (
    <Stage>
      {/* The same colorful tiles as the opening, now calm and in their place around the edge. */}
      {Array.from({ length: 12 }, (_, i) => {
        const side = i % 2 ? 1 : -1;
        const x = side > 0 ? 1540 + rand(i) * 260 : 60 + rand(i) * 260;
        const y = 70 + Math.floor(i / 2) * 160 + rand(i + 5) * 30;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y + Math.sin(t * 0.8 + i) * 6,
              opacity: 0.22 * ease(t, -0.3 + i * 0.05, 0.6),
              transform: `rotate(${(rand(i + 11) - 0.5) * 10}deg)`,
            }}
          >
            <Tile hue={hues[i % hues.length]} width={170} height={96} />
          </div>
        );
      })}

      <div style={{ position: "absolute", top: 270, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 34 }}>
        <Windmill size={170} rotate={(1 - sails) * -220} spread={1 - sails} />
        <div
          style={{
            fontSize: 170,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            opacity: word,
            transform: `translateX(${(1 - word) * -30}px)`,
          }}
        >
          Vortex
        </div>
      </div>

      <div style={{ position: "absolute", top: 560, left: 0, right: 0, textAlign: "center", fontSize: 66, fontWeight: 600, letterSpacing: "-0.01em" }}>
        <div style={{ color: color.muted, opacity: line1, transform: `translateY(${(1 - line1) * 20}px)` }}>Learn anything from YouTube,</div>
        <div style={{ marginTop: 8, opacity: line2, transform: `translateY(${(1 - line2) * 20}px)` }}>
          the way{" "}
          <span style={{ position: "relative", display: "inline-block" }}>
            a course
            <span
              style={{
                position: "absolute",
                left: 0,
                bottom: -2,
                height: 10,
                width: `${underline * 100}%`,
                borderRadius: 99,
                background: color.coral,
              }}
            />
          </span>{" "}
          teaches it.
        </div>
      </div>
    </Stage>
  );
}
