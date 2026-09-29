import { ArrowRight, Search as SearchIcon } from "lucide-react";
import { interpolate, useCurrentFrame } from "remotion";
import { category, color, ease, FPS, LEAD, pop } from "../theme";
import { Card, Cursor, Pill, Stage, Tile } from "../ui";

const QUERY = "what is a context window";

/** The real top results for that query, in their real order. */
const RESULTS = [
  {
    course: "Building AI Apps with LLMs",
    hue: category["AI Engineering"],
    title: "Tokens and context windows",
    points: ["Budget a prompt against the context window", "Overflowing context"],
  },
  {
    course: "PostgreSQL for Developers",
    hue: category.Data,
    title: "CTEs and window functions",
    points: ["Named CTEs", "Rank rows within partitions"],
  },
  {
    course: "Practical Web Security",
    hue: category.Security,
    title: "Cross-site scripting (XSS)",
    points: ["Stored, reflected, and DOM-based XSS"],
  },
];

/** "Just ask in plain English. Vortex ranks the lessons that teach it, and takes you straight there." */
export function Search() {
  const frame = useCurrentFrame();
  const t = frame / FPS - LEAD;

  const typed = Math.floor(interpolate(t, [2.1, 3.7], [0, QUERY.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const caret = Math.floor(frame / 15) % 2 === 0 || (t > 2.1 && t < 3.7);
  const enter = interpolate(t, [3.85, 3.95, 4.1], [1, 0.97, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bar = pop(frame, LEAD - 0.3, { damping: 16 });

  // The click on the top result, then the zoom into the lesson.
  const move = ease(t, 5.9, 0.7);
  const press = interpolate(t, [6.7, 6.8, 6.95], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = ease(t, 7.0, 0.8);
  const lesson = ease(t, 7.25, 0.6);

  return (
    <Stage>
      <div
        style={{
          position: "absolute",
          top: 58,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 60,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          opacity: ease(t, -0.1, 0.5) * (1 - zoom),
        }}
      >
        Ask in <span style={{ color: color.accent600 }}>plain English</span>
      </div>

      <div
        style={{
          position: "absolute",
          left: 360,
          top: 170,
          width: 1200,
          height: 104,
          borderRadius: 999,
          background: color.surface,
          border: `3px solid ${t > 2 ? color.accent : color.ink}`,
          boxShadow: t > 2 ? "0 0 0 8px rgba(243,82,82,.14)" : "none",
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "0 40px",
          fontSize: 42,
          opacity: Math.min(1, bar * 1.5) * (1 - zoom),
          transform: `scale(${(0.9 + 0.1 * bar) * enter}) translateY(${(1 - bar) * 30}px)`,
        }}
      >
        <SearchIcon size={44} color={color.muted} strokeWidth={2.4} />
        <span style={{ color: typed ? color.ink : color.faint }}>{typed ? QUERY.slice(0, typed) : "Search anything..."}</span>
        {caret && t > 1.6 && t < 4.2 && <span style={{ width: 3, height: 50, background: color.accent, marginLeft: -18 }} />}
      </div>

      <div
        style={{
          position: "absolute",
          left: 360,
          top: 312,
          width: 1200,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: ease(t, 4.3, 0.4) * (1 - zoom),
        }}
      >
        <span style={{ fontSize: 28, fontWeight: 600, color: color.muted }}>Lessons, ranked by relevance</span>
        <Pill background={color.accent100} foreground={color.accent600} size={22}>
          Most relevant
        </Pill>
      </div>

      {RESULTS.map((result, i) => {
        const s = pop(frame, LEAD + 4.35 + i * 0.2, { damping: 15 });
        const top = i === 0;
        const lift = top ? ease(t, 6.5, 0.3) : 0;
        return (
          <div
            key={result.title}
            style={{
              position: "absolute",
              left: 360,
              top: 372 + i * 200,
              width: 1200,
              opacity: Math.min(1, s * 1.5) * (top ? 1 - ease(t, 7.3, 0.4) : (1 - zoom) * (i === 0 ? 1 : 0.94)),
              transform: `translateY(${(1 - s) * 60 - lift * 8}px) scale(${1 + lift * 0.02 + (top ? zoom * 0.5 : 0)})`,
              transformOrigin: "50% 50%",
              zIndex: top ? 5 : 1,
            }}
          >
            <Card
              style={{
                padding: "26px 32px",
                display: "flex",
                alignItems: "center",
                gap: 28,
                border: top ? `3px solid ${color.accent}` : `1px solid ${color.line}`,
                boxShadow: top ? `0 ${20 + lift * 20}px 60px -18px rgba(243,82,82,.45)` : undefined,
              }}
            >
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: "50%",
                  background: top ? color.accent : color.line,
                  color: color.ink,
                  fontSize: 30,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <Tile hue={result.hue} width={196} height={110} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24, fontWeight: 600, color: color.muted }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: result.hue }} />
                  {result.course}
                </div>
                <div style={{ marginTop: 4, fontSize: 38, fontWeight: 700 }}>{result.title}</div>
                <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                  {result.points.map((point) => (
                    <Pill key={point} background={`${result.hue}1f`} foreground={color.ink2} size={20}>
                      {point}
                    </Pill>
                  ))}
                </div>
              </div>
              {top && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 26, fontWeight: 600, color: color.accent600 }}>
                  View lesson <ArrowRight size={26} strokeWidth={2.6} />
                </div>
              )}
            </Card>
          </div>
        );
      })}

      {/* Straight into the lesson. */}
      <div
        style={{
          position: "absolute",
          left: 260,
          top: 90,
          width: 1400,
          opacity: lesson,
          transform: `scale(${0.9 + 0.1 * lesson})`,
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 600, color: color.muted }}>Building AI Apps with LLMs · Lesson 1.1</div>
        <div style={{ marginTop: 6, fontSize: 56, fontWeight: 700, letterSpacing: "-0.01em" }}>Tokens and context windows</div>
        <div style={{ marginTop: 26, borderRadius: 24, overflow: "hidden", position: "relative" }}>
          <Tile hue={category["AI Engineering"]} width={1400} height={700} playSize={150} style={{ borderRadius: 24 }} />
        </div>
      </div>

      <Cursor
        x={interpolate(move, [0, 1], [1780, 1380])}
        y={interpolate(move, [0, 1], [1040, 470])}
        press={press}
        opacity={ease(t, 5.8, 0.3) * (1 - ease(t, 7.0, 0.3))}
      />
    </Stage>
  );
}
