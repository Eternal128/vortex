import { CircleQuestionMark, Flag, Shuffle } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { color, ease, FPS, hues, LEAD, pop, rand } from "../theme";
import { Pill, Stage, Tile } from "../ui";

const TILES = Array.from({ length: 28 }, (_, i) => {
  // A loose grid with jitter, so the wall fills the frame without clumping.
  const col = i % 7;
  const row = Math.floor(i / 7);
  return {
    x: 60 + col * 280 + (rand(i) - 0.5) * 120,
    y: 40 + row * 270 + (rand(i + 40) - 0.5) * 110,
    w: 170 + rand(i + 80) * 110,
    hue: hues[i % hues.length],
    tilt: (rand(i + 120) - 0.5) * 22,
    phase: rand(i + 160) * Math.PI * 2,
  };
});

const CHIPS = [
  { at: 5.6, label: "No order", hue: "#f59e0b", Icon: Shuffle },
  { at: 6.7, label: "No checkpoints", hue: "#8b5cf6", Icon: Flag },
  { at: 8.1, label: "No way to know you've got it", hue: "#0ea5e9", Icon: CircleQuestionMark },
];

/** "YouTube holds some of the best teaching… But it's scattered." A bright wall that falls apart. */
export function Motive() {
  const frame = useCurrentFrame();
  const t = frame / FPS - LEAD;
  const scatter = ease(t, 3.5, 1.1);
  const first = 1 - ease(t, 3.3, 0.35);
  const second = pop(frame, LEAD + 3.6);

  return (
    <Stage background={color.deep}>
      {TILES.map((tile, i) => {
        const inScale = pop(frame, 0.05 * i, { damping: 12 });
        const cx = tile.x + tile.w / 2 - 960;
        const cy = tile.y + tile.w * 0.28 - 540;
        const push = 1 + scatter * 0.45;
        const jitter = scatter * 14;
        const x = cx * push + Math.sin(t * 0.7 + tile.phase) * 14 + Math.sin(t * 9 + i) * jitter;
        const y = cy * push + Math.cos(t * 0.6 + tile.phase) * 12 + Math.cos(t * 8 + i * 2) * jitter;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 + x - tile.w / 2,
              top: 540 + y - tile.w * 0.28,
              transform: `rotate(${tile.tilt * (1 + scatter * 1.4)}deg) scale(${inScale})`,
              opacity: 0.95,
            }}
          >
            <Tile hue={tile.hue} width={tile.w} height={tile.w * 0.5625} />
          </div>
        );
      })}

      {/* A dark pool behind the words so they always read. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(52% 44% at 50% 50%, rgba(18,18,21,.94) 0%, rgba(18,18,21,.82) 55%, rgba(18,18,21,0) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 260,
          right: 260,
          top: 380,
          textAlign: "center",
          color: "white",
          fontSize: 84,
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: "-0.02em",
          opacity: ease(t, -0.2, 0.6) * first,
          transform: `translateY(${(1 - ease(t, -0.2, 0.8)) * 30 - (1 - first) * 40}px)`,
        }}
      >
        YouTube holds some of the <span style={{ color: color.accent }}>best teaching</span> in the world.
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 330,
          display: "flex",
          justifyContent: "center",
          gap: 26,
          color: "white",
          fontSize: 110,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          opacity: Math.min(1, second * 1.4),
        }}
      >
        {["But", "it's", "scattered."].map((word, i) => (
          <span
            key={word}
            style={{
              display: "inline-block",
              color: i === 2 ? color.accent : "white",
              transform: `translateY(${(1 - second) * 50 + Math.sin(t * 7 + i * 2) * scatter * 5}px) rotate(${(i - 1) * 3 * second + Math.sin(t * 5 + i) * scatter * 2}deg)`,
            }}
          >
            {word}
          </span>
        ))}
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", gap: 22 }}>
        {CHIPS.map(({ at, label, hue, Icon }) => {
          const s = pop(frame, LEAD + at, { damping: 11 });
          return (
            <div key={label} style={{ transform: `scale(${s}) translateY(${(1 - s) * 30}px)`, opacity: Math.min(1, s * 2) }}>
              <Pill background={hue} foreground="#18181b" size={40} icon={<Icon size={40} strokeWidth={2.4} />}>
                {label}
              </Pill>
            </div>
          );
        })}
      </div>
    </Stage>
  );
}
