import { CircleQuestionMark, Sparkles } from "lucide-react";
import { interpolate, useCurrentFrame } from "remotion";
import { category, color, ease, FPS, hues, LEAD, pop, rand } from "../theme";
import { Button, Card, Pill, Stage, Tile } from "../ui";

const GOAL = "Bake sourdough bread at home";

/** An example of what the plan builder returns: modules, and a matched video per lesson. */
const MODULES = [
  { title: "Starter and flour", hue: "#f59e0b", lessons: ["Make a starter", "Feed and time it", "Pick your flour"] },
  { title: "Mix and shape", hue: "#f43f5e", lessons: ["Autolyse and mix", "Stretch and fold", "Shape a boule"] },
  { title: "Bake and score", hue: "#84cc16", lessons: ["Proof overnight", "Score the loaf", "Bake in a Dutch oven"] },
];

/** "Want to learn something that isn't in the catalog yet? Describe your goal, and Vortex builds you a plan…" */
export function Plan() {
  const frame = useCurrentFrame();
  const t = frame / FPS - LEAD;

  const gridOut = ease(t, 3.3, 0.5);
  const missing = pop(frame, LEAD + 1.1, { damping: 9 });
  const wiggle = Math.sin(t * 14) * 5 * interpolate(t, [1.2, 1.5, 2.6, 2.9], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dim = ease(t, 2.0, 0.4);

  const form = pop(frame, LEAD + 3.55, { damping: 16 });
  const typed = Math.floor(interpolate(t, [3.8, 5.0], [0, GOAL.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const press = interpolate(t, [5.1, 5.2, 5.35], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sparkle = ease(t, 5.15, 0.9);
  const rise = ease(t, 5.4, 0.6);

  return (
    <Stage background={`linear-gradient(180deg, ${color.accent50} 0%, ${color.canvas} 55%)`}>
      {/* The catalog, and the goal it doesn't cover. */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - gridOut, transform: `translateY(${gridOut * -80}px)` }}>
        <div style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center", fontSize: 60, fontWeight: 700, letterSpacing: "-0.02em", opacity: ease(t, -0.2, 0.5) }}>
          Not in the catalog yet?
        </div>
        <div style={{ position: "absolute", left: 250, top: 240, width: 1420, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 26 }}>
          {Object.entries(category).map(([name, hue], i) => {
            const s = pop(frame, 0.1 + i * 0.06, { damping: 15 });
            return (
              <div key={name} style={{ transform: `scale(${s})`, opacity: s * (1 - dim * 0.6) }}>
                <Card style={{ padding: 24, height: 230, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <Tile hue={hue} width={150} height={84} />
                  <div style={{ fontSize: 30, fontWeight: 700 }}>{name}</div>
                </Card>
              </div>
            );
          })}
          <div style={{ gridColumn: "span 2", transform: `scale(${missing}) rotate(${wiggle}deg)`, opacity: Math.min(1, missing * 2) }}>
            <div
              style={{
                height: 230,
                borderRadius: 24,
                border: `4px dashed ${color.accent}`,
                background: color.accent50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                fontSize: 44,
                fontWeight: 700,
                color: color.accent600,
              }}
            >
              <CircleQuestionMark size={52} strokeWidth={2.4} />
              Baking sourdough?
            </div>
          </div>
        </div>
      </div>

      {/* The goal, typed. */}
      <div
        style={{
          position: "absolute",
          left: 360,
          top: interpolate(rise, [0, 1], [330, 60]),
          width: 1200,
          opacity: Math.min(1, form * 1.5),
          transform: `scale(${(0.94 + 0.06 * form) * (1 - rise * 0.12)})`,
          transformOrigin: "50% 0%",
        }}
      >
        <Card style={{ padding: "34px 40px" }}>
          <div style={{ fontSize: 36, fontWeight: 700 }}>What do you want to learn?</div>
          <div style={{ marginTop: 18, display: "flex", gap: 18 }}>
            <div
              style={{
                flex: 1,
                height: 84,
                borderRadius: 14,
                border: `3px solid ${typed ? color.accent : color.ink}`,
                display: "flex",
                alignItems: "center",
                padding: "0 26px",
                fontSize: 36,
                color: typed ? color.ink : color.faint,
              }}
            >
              {typed ? GOAL.slice(0, typed) : "I want to learn how to..."}
            </div>
            <div style={{ position: "relative" }}>
              <Button size={32} icon={<Sparkles size={32} strokeWidth={2.4} />} style={{ height: 84, transform: `scale(${1 - press * 0.05})` }}>
                Build my plan
              </Button>
              {Array.from({ length: 10 }, (_, i) => {
                const angle = (i / 10) * Math.PI * 2;
                const d = sparkle * (90 + rand(i) * 70);
                return (
                  <Sparkles
                    key={i}
                    size={26 + rand(i + 3) * 18}
                    color={hues[i % hues.length]}
                    fill={hues[i % hues.length]}
                    style={{
                      position: "absolute",
                      left: 150 + Math.cos(angle) * d,
                      top: 30 + Math.sin(angle) * d * 0.7,
                      opacity: sparkle > 0 ? 1 - sparkle : 0,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* The plan, building. */}
      <div style={{ position: "absolute", left: 250, top: 300, width: 1420, opacity: ease(t, 5.4, 0.4) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Pill background={color.accent} foreground={color.ink} size={24} icon={<Sparkles size={24} strokeWidth={2.4} />}>
            Your plan
          </Pill>
          <span style={{ fontSize: 44, fontWeight: 700 }}>Bake Sourdough Bread at Home</span>
        </div>
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {MODULES.map((module, mi) => {
            const row = pop(frame, LEAD + 5.6 + mi * 0.45, { damping: 15 });
            return (
              <div key={module.title} style={{ opacity: Math.min(1, row * 1.5), transform: `translateY(${(1 - row) * 50}px)` }}>
                <Card style={{ padding: "20px 26px", display: "flex", alignItems: "center", gap: 28 }}>
                  <div style={{ width: 300, flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 600, color: color.muted }}>Module {mi + 1}</div>
                    <div style={{ fontSize: 34, fontWeight: 700 }}>{module.title}</div>
                  </div>
                  {module.lessons.map((lesson, li) => {
                    const snap = pop(frame, LEAD + 5.8 + mi * 0.45 + li * 0.14, { damping: 10, stiffness: 220 });
                    return (
                      <div key={lesson} style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                        <div style={{ transform: `scale(${snap})` }}>
                          <Tile hue={module.hue} width={128} height={72} />
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.15, opacity: snap }}>{lesson}</div>
                      </div>
                    );
                  })}
                </Card>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 20, fontSize: 26, color: color.muted, opacity: ease(t, 7.2, 0.4) }}>
          One matched YouTube video per lesson, with progress and a quiz on each.
        </div>
      </div>
    </Stage>
  );
}
