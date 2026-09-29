import { Check, RotateCcw, X } from "lucide-react";
import { interpolate, useCurrentFrame } from "remotion";
import { category, color, ease, FPS, hues, LEAD, pop, rand } from "../theme";
import { Button, Card, Pill, Stage, Tile } from "../ui";

/** The real quiz for "Tokens and context windows": two options each, the right one marked. */
const QUESTIONS = [
  {
    prompt: "What does a context window represent for an LLM?",
    options: ["The model's working memory for tokens", "The amount of GPU memory required"],
    right: 0,
    first: 0,
  },
  {
    prompt: "Why can an overflowing context cause hallucinations?",
    options: ["The model runs out of compute power", "Earlier tokens are dropped, so it guesses"],
    right: 1,
    first: 0,
  },
  {
    prompt: "What is a primary trade-off of a larger context window?",
    options: ["It reduces the need for a system prompt", "A quadratic increase in compute cost"],
    right: 1,
    first: 0,
  },
];

/** "When a video ends, take a short quiz. Submit, see your grade and what you missed, then retake it…" */
export function Quiz() {
  const frame = useCurrentFrame();
  const t = frame / FPS - LEAD;

  const played = interpolate(t, [-0.5, 0.9], [0.86, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ended = ease(t, 0.95, 0.4);
  const out = ease(t, 1.8, 0.5);
  const quiz = pop(frame, LEAD + 1.95, { damping: 16 });
  const submit = interpolate(t, [3.74, 3.84, 4.0], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const results = t >= 4.6;
  const retake = t >= 8.2;

  const firstScore = Math.round(interpolate(t, [4.7, 5.3], [0, 33], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const secondScore = Math.round(interpolate(t, [8.3, 8.9], [33, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const grade = retake ? secondScore : firstScore;
  const passed = retake && t >= 8.9;
  const burst = ease(t, 8.9, 1.0);
  const spin = interpolate(t, [7.65, 8.2], [0, -360], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <Stage>
      {/* The video reaching its end. */}
      <div
        style={{
          position: "absolute",
          left: 410,
          top: 150,
          width: 1100,
          opacity: 1 - out,
          transform: `scale(${1 - out * 0.2}) translateX(${out * -300}px)`,
        }}
      >
        <div style={{ position: "relative" }}>
          <Tile hue={category["AI Engineering"]} width={1100} height={619} playSize={0} style={{ borderRadius: 24 }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 24,
              background: `rgba(18,18,21,${0.82 * ended})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              color: "white",
              opacity: ended,
            }}
          >
            <div style={{ fontSize: 76, fontWeight: 700, transform: `scale(${0.9 + 0.1 * ended})` }}>Nice work.</div>
            <div style={{ fontSize: 30, opacity: 0.85 }}>Ready for a quick check? 3 questions.</div>
            <Button size={32} style={{ marginTop: 10 }}>
              Take the quiz
            </Button>
          </div>
        </div>
        <div style={{ marginTop: 24, height: 14, borderRadius: 99, background: color.line }}>
          <div style={{ width: `${played * 100}%`, height: "100%", borderRadius: 99, background: color.accent }} />
        </div>
      </div>

      {/* The quiz, then its results. */}
      <div
        style={{
          position: "absolute",
          left: 260,
          top: 90,
          width: 1400,
          opacity: Math.min(1, quiz * 1.5),
          transform: `translateY(${(1 - quiz) * 90}px)`,
        }}
      >
        <Card style={{ padding: "36px 46px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 600, color: color.muted }}>Quiz · Tokens and context windows</div>
              {results ? (
                <div style={{ display: "flex", alignItems: "center", gap: 26, marginTop: 6 }}>
                  <div style={{ fontSize: 110, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums", position: "relative" }}>
                    {grade}%
                    {Array.from({ length: 18 }, (_, i) => {
                      const angle = (i / 18) * Math.PI * 2 + rand(i) * 0.5;
                      const distance = burst * (130 + rand(i + 9) * 110);
                      return (
                        <span
                          key={i}
                          style={{
                            position: "absolute",
                            left: 110 + Math.cos(angle) * distance,
                            top: 55 + Math.sin(angle) * distance,
                            width: 16,
                            height: 16,
                            borderRadius: i % 2 ? 4 : "50%",
                            background: hues[i % hues.length],
                            opacity: burst > 0 ? 1 - burst : 0,
                            transform: `rotate(${burst * 200}deg)`,
                          }}
                        />
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {passed ? (
                      <Pill background={color.successSoft} foreground={color.success} size={30} icon={<Check size={30} strokeWidth={3} />}>
                        Passed
                      </Pill>
                    ) : retake ? (
                      <Pill background={color.line} foreground={color.ink2} size={30}>
                        Grading
                      </Pill>
                    ) : (
                      <Pill background={color.errorSoft} foreground={color.error} size={30}>
                        Not passed yet
                      </Pill>
                    )}
                    <div style={{ fontSize: 24, color: color.muted }}>
                      {retake ? "Attempt 2 · Highest grade kept" : "1 of 3 correct · Pass mark 67%"}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 4, fontSize: 44, fontWeight: 700 }}>3 questions. Pass mark 67%.</div>
              )}
            </div>
            {results ? (
              <Button variant="tertiary" size={28} icon={<RotateCcw size={28} strokeWidth={2.6} style={{ transform: `rotate(${spin}deg)` }} />}>
                Retake quiz
              </Button>
            ) : (
              <Button size={30} style={{ transform: `scale(${1 - submit * 0.06})`, opacity: t > 3.2 ? 1 : 0.35 }}>
                Submit
              </Button>
            )}
          </div>

          <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 20 }}>
            {QUESTIONS.map((question, qi) => {
              const pick = t >= 2.4 + qi * 0.4;
              const chosen = retake ? question.right : question.first;
              const right = chosen === question.right;
              const reveal = ease(t, 5.95 + qi * 0.3, 0.35);
              const verdict = retake ? ease(t, 8.3 + qi * 0.15, 0.3) : reveal;
              return (
                <div key={question.prompt}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 32, fontWeight: 600 }}>
                    {results && verdict > 0 ? (
                      <span
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: right ? color.success : color.error,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transform: `scale(${verdict})`,
                        }}
                      >
                        {right ? <Check size={26} color="white" strokeWidth={3.5} /> : <X size={26} color="white" strokeWidth={3.5} />}
                      </span>
                    ) : (
                      <span style={{ width: 40, color: color.muted }}>{qi + 1}.</span>
                    )}
                    {question.prompt}
                  </div>
                  <div style={{ marginTop: 12, marginLeft: 54, display: "flex", gap: 14 }}>
                    {question.options.map((option, oi) => {
                      const selected = pick && oi === chosen;
                      const showRight = results && verdict > 0 && oi === question.right;
                      const showWrong = results && verdict > 0 && selected && !right;
                      return (
                        <div
                          key={option}
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            padding: "14px 20px",
                            borderRadius: 14,
                            fontSize: 26,
                            border: `2px solid ${showRight ? color.success : showWrong ? color.error : selected ? color.accent : color.line}`,
                            background: showRight ? color.successSoft : showWrong ? color.errorSoft : selected ? color.accent50 : color.surface,
                          }}
                        >
                          <span
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              border: `2px solid ${selected ? color.accent : color.faint}`,
                              boxShadow: selected ? `inset 0 0 0 5px white` : undefined,
                              background: selected ? color.accent : "white",
                              flexShrink: 0,
                            }}
                          />
                          {option}
                        </div>
                      );
                    })}
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
