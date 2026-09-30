import { Img, staticFile } from "remotion";
import { fontFamily } from "../theme";
import { Windmill } from "../ui";
import { BrandBug, between, Callout, camera, film, Laptop, LAPTOP, lens, Page, Phone, PHONE, type Shot, Tap, TitleCard } from "./kit";

/**
 * The film's chapters. Each takes `t`, seconds of its narration (negative during the lead-in), and
 * lands every move on the words that ask for it. Screens are real captures of the live site
 * (capture.mjs); positions are that page's own CSS pixels, measured on the live site.
 */

const DESKTOP = { w: 1440, h: 900 };
const screen = (shot: Shot, h = DESKTOP.h) => lens(shot, LAPTOP.screenW, LAPTOP.screenH, DESKTOP.w, DESKTOP.w, h);
const productIn = (t: number, at: number) => between(t, at, at + 1);

export function Intro({ t }: { t: number }) {
  const mark = between(t, -1.5, -0.3);
  const rows = between(t, -0.6, 1.4);
  const row = (names: string[], y: number, drift: number) => (
    <div style={{ position: "absolute", left: drift, top: y, display: "flex", gap: 28 }}>
      {names.map((name) => (
        <Img key={name} src={staticFile(`captures/thumbs/${name}.jpg`)} style={{ width: 384, height: 216, borderRadius: 20, objectFit: "cover", boxShadow: "0 18px 40px -20px rgba(0,0,0,0.4)" }} />
      ))}
    </div>
  );
  const first = ["t00", "t01", "t02", "t03", "t04", "t05", "t06", "t07", "t08", "t09"];
  const second = ["t10", "t11", "t12", "t13", "t14", "t15", "t16", "t17", "t18", "t19"];
  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: rows * 0.95, maskImage: "linear-gradient(90deg, transparent 0%, black 14%, black 86%, transparent 100%)" }}>
        {row(first, 640, -420 + t * 26)}
        {row(second, 884, -120 - t * 26)}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", flexDirection: "column", alignItems: "center", fontFamily, color: film.ink }}>
        <div style={{ opacity: mark, transform: `scale(${0.8 + 0.2 * mark})` }}>
          <Windmill size={104} rotate={(1 - mark) * -140} spread={(1 - mark) * 0.5} />
        </div>
        <div style={{ marginTop: 28, fontSize: 50, fontWeight: 500, letterSpacing: "-0.01em", opacity: between(t, -0.9, -0.1), transform: `translateY(${(1 - between(t, -0.9, -0.1)) * 20}px)` }}>
          Introducing
        </div>
        <div style={{ fontSize: 210, fontWeight: 700, letterSpacing: "-0.055em", lineHeight: 1, opacity: between(t, -0.7, 0.3), transform: `translateY(${(1 - between(t, -0.7, 0.3)) * 32}px)` }}>
          Vortex
        </div>
      </div>
    </>
  );
}

const COURSE_SHOTS: Shot[] = [
  { t: 1.6, cx: 720, cy: 450, z: 1 },
  { t: 4.0, cx: 720, cy: 450, z: 1 },
  { t: 6.0, cx: 720, cy: 1190, z: 1.1 },
  { t: 6.8, cx: 720, cy: 1190, z: 1.1 },
  { t: 8.2, cx: 370, cy: 384, z: 1.9 },
];

/** "Every video in the right order" pans to the curriculum; "credited to the creator" pushes into the creators. */
export function Courses({ t }: { t: number }) {
  return (
    <>
      <TitleCard t={t} eyebrow="Courses" lines={["In order."]} dockAt={1.0} />
      <Laptop t={t} enterAt={1.3}>
        <Page src="course-full.png" w={1440} h={1888} at={screen(camera(t, COURSE_SHOTS), 1888)} />
      </Laptop>
      <BrandBug opacity={productIn(t, 1.3)} />
    </>
  );
}

const TYPED: Shot = { t: 0, cx: 690, cy: 60, z: 2.3 };
const RESULT_SHOTS: Shot[] = [
  { t: 3.0, cx: 720, cy: 450, z: 1.15 },
  { t: 5.0, cx: 720, cy: 450, z: 1.15 },
  { t: 6.3, cx: 775, cy: 540, z: 1.25 },
];

/** The question is typed word by word, submitted, and the answer's exact moment is tapped. */
export function Search({ t }: { t: number }) {
  const typed = screen(TYPED);
  const results = screen(camera(t, RESULT_SHOTS));
  const word = t < 2.1 ? 1 : t < 2.5 ? 2 : 3;
  const show = between(t, 3.0, 3.5);
  return (
    <>
      <TitleCard t={t} eyebrow="Search" lines={["Just ask."]} dockAt={0.9} />
      <Laptop t={t} enterAt={1.1}>
        <Page src={`search-typed-${word}.png`} w={1440} h={900} at={typed} opacity={1 - show} />
        {/* Focus on the search field: the page below it fades back while the question is typed. */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, bottom: 0, opacity: 1 - show, background: "linear-gradient(rgba(255,255,255,0), rgba(255,255,255,0.985) 90px)" }} />
        <Tap t={t} at={2.8} x={868} y={32} on={typed} />
        <Page src="search-results.png" w={1440} h={900} at={results} opacity={show} />
        <Tap t={t} at={6.35} x={1272} y={599} on={results} />
      </Laptop>
      <BrandBug opacity={productIn(t, 1.1)} />
    </>
  );
}

const CONTINUE: Shot = { t: 0, cx: 330, cy: 520, z: 1.9 };
const LESSON_SHOTS: Shot[] = [
  { t: 2.5, cx: 720, cy: 450, z: 1 },
  { t: 6.6, cx: 860, cy: 640, z: 1.28 },
];

/** Enrolled, 4% complete: Continue is tapped and the lesson resumes at the saved second. */
export function Progress({ t }: { t: number }) {
  const course = screen(CONTINUE);
  const lesson = screen(camera(t, LESSON_SHOTS));
  const show = between(t, 2.5, 3.0);
  const pill = between(t, 3.2, 3.9);
  return (
    <>
      <TitleCard t={t} eyebrow="Progress" lines={["Right where you left off."]} size={124} dockAt={0.9} />
      <Laptop t={t} enterAt={1.1}>
        <Page src="course-continue.png" w={1440} h={900} at={course} opacity={1 - show} />
        <Tap t={t} at={2.2} x={142} y={531} on={course} />
        <Page src="lesson-playing.png" w={1440} h={900} at={lesson} opacity={show} />
      </Laptop>
      <Callout opacity={pill} style={{ left: 960 - 190, top: 880 }}>
        <span style={{ fontSize: 26 }}>▶</span> Resumed at 5:46
      </Callout>
      <BrandBug opacity={productIn(t, 1.1)} />
    </>
  );
}

/** The graded quiz floats up as a card: failed once with the right answers shown, then passed. */
export function Quiz({ t }: { t: number }) {
  const width = 1100;
  const k = width / 1098;
  const left = (1920 - width) / 2;
  const top = 300;
  const card = productIn(t, 1.2);
  const passed = between(t, 4.3, 4.8);
  const push = between(t, 5.2, 7.6, "glide");
  const surface = { position: "absolute" as const, left, top, width, borderRadius: 22, overflow: "hidden" as const, boxShadow: "0 50px 90px -30px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)" };
  return (
    <>
      <TitleCard t={t} eyebrow="Quizzes" lines={["Know that you know."]} dockAt={0.9} />
      <div style={{ position: "absolute", inset: 0, opacity: card, transform: `translateY(${(1 - card) * 220}px)` }}>
        <div style={{ ...surface, height: 645 * k, opacity: 1 - passed }}>
          <Img src={staticFile("captures/quiz-failed.png")} style={{ width, display: "block" }} />
          <Tap t={t} at={3.95} x={93 * k} y={598 * k} on={{ k: 1, left: 0, top: 0 }} />
        </div>
        <div style={{ ...surface, height: 513 * k, opacity: passed, transform: `scale(${1 + 0.1 * push})`, transformOrigin: "12% 10%" }}>
          <Img src={staticFile("captures/quiz-passed.png")} style={{ width, display: "block" }} />
        </div>
      </div>
      <BrandBug opacity={productIn(t, 1.2)} />
    </>
  );
}

const PLAN_TOP: Shot = { t: 0, cx: 195, cy: 422, z: 1 };
const PLAN_SCROLL: Shot[] = [
  { t: 4.4, cx: 195, cy: 422, z: 1 },
  { t: 7.4, cx: 195, cy: 1500, z: 1 },
];

/** On a phone: a goal typed, sent, and a plan of real videos appears and scrolls. */
export function Plan({ t }: { t: number }) {
  const view = (shot: Shot, h: number) => lens(shot, PHONE.screenW, PHONE.screenH, 390, 390, h);
  const typed = view(PLAN_TOP, 844);
  const plan = view(camera(t, PLAN_SCROLL), 4810);
  const show = between(t, 3.0, 3.5);
  const title = (from: number) => ({ opacity: between(t, from, from + 0.9), transform: `translateY(${(1 - between(t, from, from + 0.9)) * 28}px)` });
  return (
    <>
      <div style={{ position: "absolute", left: 170, top: 380, fontFamily, color: film.ink }}>
        <div style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.01em", ...title(-1.0) }}>Plans</div>
        <div style={{ fontSize: 132, fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 1.02, ...title(-0.85) }}>
          <div>A plan for</div>
          <div>anything.</div>
        </div>
      </div>
      <Phone t={t} enterAt={0.2} left={1110}>
        <Page src="plan-typed.png" w={390} h={844} at={typed} opacity={1 - show} />
        <Tap t={t} at={2.7} x={337} y={495} on={typed} />
        <Page src="plan-full.png" w={390} h={4810} at={plan} opacity={show} />
      </Phone>
      <BrandBug opacity={productIn(t, 0.2)} />
    </>
  );
}

/** The end card, and the poster: the mark, the name, and the line. */
export function Close({ t }: { t: number }) {
  const mark = between(t, -0.9, 0.3);
  const word = between(t, -0.6, 0.4);
  const line = between(t, 1.55, 2.5);
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily, color: film.ink }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 340, display: "flex", justifyContent: "center", alignItems: "center", gap: 36 }}>
        <div style={{ opacity: mark, transform: `scale(${0.85 + 0.15 * mark})` }}>
          <Windmill size={150} rotate={(1 - mark) * -120} spread={(1 - mark) * 0.4} />
        </div>
        <div style={{ fontSize: 176, fontWeight: 700, letterSpacing: "-0.055em", lineHeight: 1, opacity: word, transform: `translateX(${(1 - word) * -24}px)` }}>Vortex</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 610, textAlign: "center", fontSize: 58, fontWeight: 500, letterSpacing: "-0.02em", color: film.muted, opacity: line, transform: `translateY(${(1 - line) * 18}px)` }}>
        Learn anything, the way a course teaches it.
      </div>
    </div>
  );
}
