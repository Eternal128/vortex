import { Check, ListChecks, Play } from "lucide-react";
import { interpolate, useCurrentFrame } from "remotion";
import { category, color, ease, FPS, hues, LEAD, pop, rand } from "../theme";
import { Card, Pill, Stage, Tile, Windmill } from "../ui";

/** Real module 1 of "Building AI Apps with LLMs", with each video's channel. */
const LESSONS = [
  { n: "1.1", title: "Tokens and context windows", length: "11:31", channel: "IBM Technology" },
  { n: "1.2", title: "Temperature and sampling", length: "8:11", channel: "DataMListic" },
  { n: "1.3", title: "Choosing a model for the job", length: "6:57", channel: "IBM Technology" },
];

const AI = category["AI Engineering"];
const QUIZ = { bg: "#fef3c7", fg: "#92400e" };

/** "Vortex turns those videos into real courses…" The tiles spiral into a windmill and land in order. */
export function What() {
  const frame = useCurrentFrame();
  const t = frame / FPS - LEAD;

  const card = pop(frame, LEAD + 2.3, { damping: 16 });
  const mill = 1 - ease(t, 2.0, 0.5);
  const done = LESSONS.map((_, i) => (i < 2 ? ease(t, 5.65 + i * 0.4, 0.35) : 0));
  const bar = done.reduce((sum, d) => sum + d, 0) / LESSONS.length;

  return (
    <Stage>
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 68,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          opacity: ease(t, 0, 0.5),
          transform: `translateY(${(1 - ease(t, 0, 0.6)) * 24}px)`,
        }}
      >
        Vortex turns videos into <span style={{ color: color.coral600 }}>real courses</span>
      </div>

      {/* The vortex: tiles spiral in toward the windmill. */}
      {Array.from({ length: 14 }, (_, i) => {
        const p = ease(t, -0.4 + i * 0.07, 1.6);
        const angle = (i / 14) * Math.PI * 2 + (1 - p) * Math.PI * 2.4;
        const radius = (1 - p) * 1150 + 40;
        const s = 1 - p * 0.75;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 + Math.cos(angle) * radius - 90,
              top: 560 + Math.sin(angle) * radius * 0.62 - 50,
              transform: `scale(${s}) rotate(${(1 - p) * 90 * (rand(i) - 0.5)}deg)`,
              opacity: (1 - ease(t, 1.7, 0.5)) * Math.min(1, (t + 0.6) * 3),
            }}
          >
            <Tile hue={hues[i % hues.length]} width={180} height={101} />
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 960 - 110,
          top: 560 - 110,
          opacity: mill,
          transform: `scale(${0.6 + 0.4 * mill})`,
        }}
      >
        <Windmill size={220} rotate={t * 260} spread={1 - ease(t, -0.5, 0.7)} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 330,
          top: 205,
          width: 1260,
          opacity: Math.min(1, card * 1.5),
          transform: `translateY(${(1 - card) * 80}px) scale(${0.92 + 0.08 * card})`,
        }}
      >
        <Card style={{ padding: "38px 46px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <Pill background={`${AI}22`} foreground="#5b21b6" size={24}>
                AI Engineering
              </Pill>
              <div style={{ marginTop: 14, fontSize: 50, fontWeight: 700, letterSpacing: "-0.01em" }}>Building AI Apps with LLMs</div>
            </div>
            <div style={{ width: 300 }}>
              <div style={{ fontSize: 24, color: color.muted, fontWeight: 600, textAlign: "right" }}>
                {Math.round(bar * 3)} of 3 lessons done
              </div>
              <div style={{ marginTop: 10, height: 14, borderRadius: 99, background: color.line, overflow: "hidden" }}>
                <div style={{ width: `${bar * 100}%`, height: "100%", borderRadius: 99, background: color.success }} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 28, fontSize: 26, fontWeight: 600, color: color.muted }}>Module 1 · LLM Fundamentals</div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 16 }}>
            {LESSONS.map((lesson, i) => {
              const row = pop(frame, LEAD + 2.6 + i * 0.12, { damping: 15 });
              const badge = pop(frame, LEAD + 4.1 + i * 0.3, { damping: 9 });
              const quiz = pop(frame, LEAD + 7.54 + i * 0.22, { damping: 11 });
              const credit = ease(t, 10.0 + i * 0.25, 0.4);
              const glow = interpolate(t, [4.1 + i * 0.3, 4.4 + i * 0.3, 5.0 + i * 0.3], [0, 1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={lesson.n}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 26,
                    padding: "14px 18px",
                    borderRadius: 18,
                    background: `rgba(243,82,82,${glow * 0.08})`,
                    border: `2px solid ${glow > 0.01 ? `rgba(243,82,82,${glow * 0.5})` : color.line}`,
                    opacity: row,
                    transform: `translateX(${(1 - row) * -60}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: color.coral,
                      color: color.ink,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      fontWeight: 700,
                      transform: `scale(${0.6 + 0.4 * badge})`,
                      flexShrink: 0,
                    }}
                  >
                    {lesson.n}
                  </div>
                  <Tile hue={[AI, "#a78bfa", "#7c3aed"][i]} width={172} height={97} length={lesson.length} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 34, fontWeight: 600 }}>{lesson.title}</div>
                    <div
                      style={{
                        marginTop: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 24,
                        color: color.ink2,
                        opacity: credit,
                        padding: "2px 10px",
                        borderRadius: 8,
                        background: `linear-gradient(90deg, ${color.coral100} ${credit * 100}%, transparent ${credit * 100}%)`,
                      }}
                    >
                      <Play size={18} fill={color.coral600} color={color.coral600} />
                      by {lesson.channel}
                    </div>
                  </div>
                  <div style={{ opacity: Math.min(1, quiz * 2), transform: `scale(${quiz})` }}>
                    <Pill background={QUIZ.bg} foreground={QUIZ.fg} size={24} icon={<ListChecks size={24} strokeWidth={2.4} />}>
                      Quiz
                    </Pill>
                  </div>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      border: `3px solid ${done[i] > 0 ? color.success : color.line}`,
                      background: done[i] > 0 ? color.success : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={34} color="white" strokeWidth={3.5} style={{ transform: `scale(${done[i]})` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </Stage>
  );
}
