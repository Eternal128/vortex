import { Check, MapPin, Pause, Play } from "lucide-react";
import { interpolate, useCurrentFrame } from "remotion";
import { category, color, ease, FPS, formatTime, LEAD, pop } from "../theme";
import { Button, Cursor, Pill, Stage, Tile } from "../ui";

const AI = category["AI Engineering"];
const LENGTH = 691;
const SAVED = 346;

/** "Pick a course and enroll for free. Watch right on the page, and your place saves to the second…" */
export function Enroll() {
  const frame = useCurrentFrame();
  const t = frame / FPS - LEAD;

  const intro = ease(t, -0.4, 0.6);
  const move = ease(t, 0.1, 0.7);
  const press = interpolate(t, [0.85, 0.95, 1.1], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const enrolled = pop(frame, LEAD + 1.0, { damping: 12 });
  const isEnrolled = t >= 1.0;

  const player = pop(frame, LEAD + 2.3, { damping: 16 });
  const playing = t >= 2.9;
  const position = interpolate(t, [2.9, 5.4], [SAVED - 16, SAVED], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pin = pop(frame, LEAD + 3.9, { damping: 9 });
  const resume = pop(frame, LEAD + 5.7, { damping: 13 });

  return (
    <Stage>
      {/* The course, left. */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 200,
          width: 620,
          opacity: intro,
          transform: `translateX(${(1 - intro) * -40}px)`,
        }}
      >
        <Pill background={`${AI}22`} foreground="#5b21b6" size={26}>
          AI Engineering
        </Pill>
        <div style={{ marginTop: 20, fontSize: 72, fontWeight: 700, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
          Building AI Apps with LLMs
        </div>
        <div style={{ marginTop: 18, fontSize: 30, color: color.muted }}>12 lessons · 4 modules · a quiz after each video</div>

        <div style={{ marginTop: 44, height: 130, position: "relative" }}>
          <div style={{ position: "absolute", opacity: 1 - Math.min(1, enrolled * 2), transform: `scale(${1 - press * 0.04})` }}>
            <Button size={34}>Enroll for free</Button>
          </div>
          <div
            style={{
              position: "absolute",
              display: "flex",
              alignItems: "center",
              gap: 20,
              opacity: isEnrolled ? Math.min(1, enrolled * 1.5) : 0,
              transform: `scale(${isEnrolled ? 0.85 + 0.15 * enrolled : 0.85})`,
              transformOrigin: "left center",
            }}
          >
            <Pill background={color.successSoft} foreground={color.success} size={32} icon={<Check size={34} strokeWidth={3} />}>
              Enrolled
            </Pill>
          </div>
        </div>

        <div
          style={{
            opacity: Math.min(1, resume * 1.5),
            transform: `translateY(${(1 - resume) * 30}px)`,
          }}
        >
          <Button size={34} icon={<Play size={32} fill={color.ink} />}>
            Continue from {formatTime(SAVED)}
          </Button>
          <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 18, fontSize: 26, color: color.ink2 }}>
            <span style={{ fontWeight: 600 }}>1.1 Tokens and context windows</span>
          </div>
          <div style={{ marginTop: 10, width: 520, height: 12, borderRadius: 99, background: color.line }}>
            <div style={{ width: `${(SAVED / LENGTH) * 100 * resume}%`, height: "100%", borderRadius: 99, background: color.coral }} />
          </div>
        </div>
      </div>

      {/* The lesson player, right. */}
      <div
        style={{
          position: "absolute",
          left: 820,
          top: 150,
          width: 1000,
          opacity: Math.min(1, player * 1.4),
          transform: `translateX(${(1 - player) * 120}px)`,
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 600, color: color.muted }}>Lesson 1.1 · by IBM Technology</div>
        <div style={{ marginTop: 4, fontSize: 44, fontWeight: 700 }}>Tokens and context windows</div>
        <div style={{ marginTop: 22, position: "relative" }}>
          <Tile hue={AI} width={1000} height={562} playSize={0} style={{ borderRadius: 22 }} />
          <div
            style={{
              position: "absolute",
              left: 28,
              bottom: 26,
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "white",
              fontSize: 28,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {playing ? <Pause size={34} fill="white" /> : <Play size={34} fill="white" />}
            {formatTime(position)} / {formatTime(LENGTH)}
          </div>
          {!playing && (
            <div
              style={{
                position: "absolute",
                left: 500 - 60,
                top: 281 - 60,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: color.coral,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Play size={56} fill={color.ink} color={color.ink} style={{ marginLeft: 8 }} />
            </div>
          )}
        </div>

        {/* The progress bar, with the saved second pinned on it. */}
        <div style={{ marginTop: 26, position: "relative", height: 14, borderRadius: 99, background: color.line }}>
          <div style={{ width: `${(position / LENGTH) * 100}%`, height: "100%", borderRadius: 99, background: color.coral }} />
          <div
            style={{
              position: "absolute",
              left: `${(SAVED / LENGTH) * 100}%`,
              top: 7,
              transform: `translateX(-50%) translateY(${(1 - pin) * 40}px) scale(${pin})`,
              transformOrigin: "50% 0%",
              opacity: Math.min(1, pin * 2),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: color.ink, border: "4px solid white", marginTop: -11 }} />
            <div style={{ width: 3, height: 22, background: color.ink }} />
            <Pill background={color.ink} foreground="white" size={28} icon={<MapPin size={28} color={color.coral} strokeWidth={2.6} />}>
              Saved at {formatTime(SAVED)}
            </Pill>
          </div>
        </div>
      </div>

      <Cursor
        x={interpolate(move, [0, 1], [900, 250])}
        y={interpolate(move, [0, 1], [900, 562])}
        press={press}
        opacity={ease(t, 0, 0.3) * (1 - ease(t, 1.5, 0.4))}
      />
    </Stage>
  );
}
