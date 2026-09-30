import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, getStaticFiles, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import layoutFile from "../../public/captures/layout.json";
import { fontFamily } from "../theme";
import timing from "../timing.json";
import { Ball, drop, ease, hop, lerp, roll, smooth, squash, type Who } from "./cast";

/**
 * The sphere film, drawn flat in 2D. Each shot is a flat colour; the cast are flat circles; the
 * screens are the real captures on clean, head-on cards. Everything runs on the film's clock, so
 * each move lands on its line and its sound.
 */

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Layout {
  searchField: Box;
  results: { cards: Box[]; watch: Box | null };
  courseCollapsed: { modules: Box[] };
  plan?: { rows: Box[]; thumbs: Box[]; nav?: Box; height: number };
}
const layout = layoutFile as unknown as Layout;
export const FPS = timing.fps;
const SHOTS = timing.shots;
const shotOf = (id: string) => SHOTS.find((shot) => shot.id === id)!;
/** The times of one kind of sound effect, in script order. */
const sfx = (kind: string) => timing.sfx.filter((cue) => cue.kind === kind).map((cue) => cue.at);

const PLAN_READY = getStaticFiles().some((file) => file.name === "captures/plan-full.png") && Boolean(layout.plan);
const pad = (n: number) => String(n).padStart(2, "0");
const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/* ------------------------------------------------------------------------------------------------ */
/* Screens: real captures on clean cards.                                                            */

/** A region of a capture (CSS pixels of an image `width` wide), fitted into a box. */
function Fit({ box, src, width, region, mode = "contain", align = "center", background = "#ffffff", children }: { box: Box; src?: string; width: number; region: Box; mode?: "contain" | "cover"; align?: "center" | "top"; background?: string; children?: ReactNode }) {
  const k = mode === "cover" ? Math.max(box.w / region.w, box.h / region.h) : Math.min(box.w / region.w, box.h / region.h);
  const left = (box.w - region.w * k) / 2;
  const top = align === "top" ? Math.min(box.h * 0.04, (box.h - region.h * k) / 2) : (box.h - region.h * k) / 2;
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, overflow: "hidden", background }}>
      <div style={{ position: "absolute", left, top, width: region.w, height: region.h, transformOrigin: "0 0", transform: `scale(${k})`, overflow: "hidden" }}>
        {src && <Img src={staticFile(`captures/${src}`)} style={{ position: "absolute", left: -region.x, top: -region.y, width, maxWidth: "none" }} />}
        <div style={{ position: "absolute", left: -region.x, top: -region.y, width }}>{children}</div>
      </div>
    </div>
  );
}

const cardShadow = "0 34px 70px -34px rgba(0,0,0,0.38), 0 0 0 1px rgba(0,0,0,0.06)";

/** A clean white card holding a screen: rounded, a hairline, a soft shadow; `glow` rings its edge. */
function Card({ box, radius = 22, glow, children, style }: { box: Box; radius?: number; glow?: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: radius, overflow: "hidden", background: "#fff", boxShadow: glow ? `${cardShadow}, 0 0 0 5px ${glow}, 0 0 60px 8px ${glow}` : cardShadow, ...style }}>
      {children}
    </div>
  );
}

/** A generic flat laptop: a dark rounded bezel around the screen, and a pale base. */
function Laptop({ screen, children }: { screen: Box; children: ReactNode }) {
  const bezel = 16;
  return (
    <>
      <div style={{ position: "absolute", left: screen.x - bezel, top: screen.y - bezel, width: screen.w + bezel * 2, height: screen.h + bezel * 2, borderRadius: 24, background: "#1d1d1f", boxShadow: "0 40px 80px -40px rgba(0,0,0,0.4)" }} />
      <div style={{ position: "absolute", left: screen.x - 130, top: screen.y + screen.h + bezel - 2, width: screen.w + 260, height: 26, borderRadius: "4px 4px 20px 20px", background: "#c9ccd3" }} />
      <div style={{ position: "absolute", left: screen.x, top: screen.y, width: screen.w, height: screen.h, borderRadius: 6, overflow: "hidden", background: "#fff" }}>{children}</div>
    </>
  );
}

/** A generic flat phone. */
function Phone({ screen, children }: { screen: Box; children: ReactNode }) {
  const bezel = 13;
  return (
    <>
      <div style={{ position: "absolute", left: screen.x - bezel, top: screen.y - bezel, width: screen.w + bezel * 2, height: screen.h + bezel * 2, borderRadius: 58, background: "#1d1d1f", boxShadow: "0 40px 80px -40px rgba(0,0,0,0.4)" }} />
      <div style={{ position: "absolute", left: screen.x, top: screen.y, width: screen.w, height: screen.h, borderRadius: 46, overflow: "hidden", background: "#fff" }}>{children}</div>
    </>
  );
}

/** A slow push-in about a point, eased in and out. */
function Push({ t, from, to, z, at, children }: { t: number; from: number; to: number; z: number; at: { x: number; y: number }; children: ReactNode }) {
  const scale = 1 + (z - 1) * ease(t, from, to);
  return <AbsoluteFill style={{ transformOrigin: `${at.x}px ${at.y}px`, transform: `scale(${scale})` }}>{children}</AbsoluteFill>;
}

/** An accent outline that draws itself around a box, then holds. */
function Outline({ t, at, box, radius = 12, padding = 8 }: { t: number; at: number; box: Box; radius?: number; padding?: number }) {
  const p = ease(t, at, at + 0.7);
  if (p <= 0) return null;
  const w = box.w + padding * 2;
  const h = box.h + padding * 2;
  const length = 2 * (w + h);
  return (
    <svg style={{ position: "absolute", left: box.x - padding, top: box.y - padding, overflow: "visible" }} width={w} height={h}>
      <rect width={w} height={h} rx={radius} fill="none" stroke="#f5a524" strokeWidth={3} strokeDasharray={length} strokeDashoffset={length * (1 - p)} />
    </svg>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* The blank cards that rain down and then line up.                                                 */

const PASTELS = ["#f9c6d6", "#bdebdd", "#d8ccf6", "#fad4be", "#c7ddf7", "#f6e7a8"];
function Blank({ x, y, w = 150, h = 96, rotate = 0, color, opacity = 1 }: { x: number; y: number; w?: number; h?: number; rotate?: number; color: string; opacity?: number }) {
  return <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 16, background: color, transform: `rotate(${rotate}deg)`, opacity, boxShadow: "0 10px 20px -12px rgba(0,0,0,0.3)" }} />;
}

/* ------------------------------------------------------------------------------------------------ */
/* Shots. Each takes the film's clock `t`, in seconds.                                               */

const ROW: [Who, number][] = [
  ["maya", 640],
  ["leo", 800],
  ["sam", 960],
  ["pip", 1100],
  ["kai", 1250],
];

/** 1: five learners drop in one by one and bounce to a stop. */
function Arrive({ t }: { t: number }) {
  const floor = 800;
  const lands = sfx("bounce");
  return (
    <>
      {ROW.map(([who, x], i) => {
        const land = lands[i];
        if (t < land - 0.6) return null;
        const { h, impacts } = drop(t, land);
        return <Ball key={who} who={who} pose={{ x, bottom: floor - h, floor, ...squash(t, impacts) }} shadow="rgba(0,0,0,0.3)" />;
      })}
    </>
  );
}

/** 2: blank video cards rain down; the learners dodge; one gets bonked. */
function Chaos({ t }: { t: number }) {
  const floor = 800;
  const thuds = sfx("thud");
  const bonk = sfx("bonk")[0];
  const cards = Array.from({ length: 22 }, (_, i) => ({
    start: 6.05 + i * 0.2 + rand(i) * 0.15,
    x: 180 + rand(i + 40) * 1560,
    rest: floor - 20 - rand(i + 80) * 30,
    spin: (rand(i + 120) - 0.5) * 140,
    end: (rand(i + 160) - 0.5) * 30,
    color: PASTELS[i % PASTELS.length],
    dur: 0.85 + rand(i + 200) * 0.2,
  }));
  // A learner hops aside just before a card thuds down near it.
  const dodges: Partial<Record<Who, [number, number]>> = { leo: [thuds[0] - 0.2, 60], pip: [thuds[1] - 0.2, -50], sam: [thuds[2] - 0.2, 55], maya: [thuds[3] - 0.2, -60] };
  const drop = Math.min(1, Math.max(0, (t - (bonk - 0.55)) / 0.55));
  const headTop = floor - 172;
  return (
    <>
      {cards.map((card, i) => {
        const p = (t - card.start) / card.dur;
        if (p < 0) return null;
        const fall = Math.min(1, p);
        return <Blank key={i} x={card.x} y={lerp(-140, card.rest, fall * fall)} rotate={lerp(card.spin, card.end, fall)} color={card.color} />;
      })}
      {ROW.map(([who, x]) => {
        const dodge = dodges[who];
        let pose = { x, bottom: floor, sx: 1, sy: 1 };
        if (dodge && t >= dodge[0]) {
          const [at, shift] = dodge;
          const j = hop(t, at, at + 0.42, x, floor, x + shift, floor, 90);
          pose = { x: j.x, bottom: j.bottom, ...squash(t, [[at + 0.42, 0.6]]) };
        }
        if (who === "kai") pose = { ...pose, ...squash(t, [[bonk, 1.4]]) };
        return <Ball key={who} who={who} pose={{ ...pose, floor }} shadow="rgba(0,0,0,0.3)" />;
      })}
      {/* The bonk: one last card lands flat on Kai's head and slides off a little. */}
      {t > bonk - 0.55 && <Blank x={1250 + Math.max(0, t - bonk) * 30} y={t < bonk ? lerp(-140, headTop - 44, drop * drop) : headTop - 44 + Math.min(10, (t - bonk) * 50)} rotate={t < bonk ? lerp(-30, -6, drop) : -6 + Math.min(12, (t - bonk) * 40)} color="#f6e7a8" />}
    </>
  );
}

/** 3: the guide glides in; the cards straighten into one column, which becomes the course. */
const HERO: Box = { x: 20, y: 95, w: 1400, h: 490 };
function Order({ t }: { t: number }) {
  const floor = 880;
  const chime = sfx("chime")[0];
  const scattered = Array.from({ length: 12 }, (_, i) => ({ x: 220 + rand(i + 300) * 1080, y: 170 + rand(i + 340) * 500, r: (rand(i + 380) - 0.5) * 60, color: PASTELS[i % PASTELS.length] }));
  const column = 6;
  const become = ease(t, 16.8, 17.7);
  const guideX = roll(t, 12.2, 13.8, -120, 690);
  return (
    <>
      {scattered.map((card, i) => {
        const inColumn = i < column;
        const at = chime - 1.6 + i * 0.25;
        const p = inColumn ? ease(t, at, at + 0.45) : 0;
        const leave = inColumn ? 0 : ease(t, 14.6 + i * 0.05, 15.2 + i * 0.05);
        const bob = Math.sin(t * 2 + i) * 6 * (1 - p);
        const target = { x: 960, y: 540 - ((column - 1) * 72) / 2 + i * 72 };
        return <Blank key={i} x={lerp(card.x, target.x, p)} y={lerp(card.y + bob, target.y, p)} w={lerp(150, 300, p)} h={lerp(96, 56, p)} rotate={lerp(card.r, 0, p)} color={card.color} opacity={(1 - leave) * (1 - become)} />;
      })}
      <Ball who="guide" pose={{ x: guideX, bottom: 600 + Math.sin(t * 2.4) * 8, floor, sx: 1, sy: 1 }} outline="rgba(0,0,0,0.08)" shadow="rgba(0,0,0,0.08)" />
      {(["maya", "leo", "sam", "pip", "kai"] as Who[]).map((who, i) => (
        <Ball key={who} who={who} scale={0.7} pose={{ x: 1440 + i * 92, bottom: floor, floor, ...squash(t, [[chime, 0.4]]) }} />
      ))}
      {become > 0 && (() => {
        const w = lerp(300, 1180, become);
        const h = (w * HERO.h) / HERO.w;
        return (
          <Card box={{ x: 960 - w / 2, y: 520 - h / 2, w, h }} radius={lerp(16, 24, become)} style={{ opacity: Math.min(1, become * 3) }}>
            <Fit box={{ x: 0, y: 0, w, h }} src="course-collapsed-full.png" width={1440} region={HERO} background="#f7f7f7" />
          </Card>
        );
      })()}
    </>
  );
}

/** 4: the four real module rows; the learners hop onto them one by one, like stepping stones. */
function Steps({ t }: { t: number }) {
  const floor = 930;
  const taps = sfx("tap");
  const rows = layout.courseCollapsed.modules;
  const rowBox = (i: number): Box => ({ x: 480 + i * 70, y: 250 + i * 150, w: 1080, h: 96 });
  const hoppers: [Who, number][] = [
    ["maya", 260],
    ["leo", 380],
    ["sam", 500],
    ["kai", 150],
  ];
  return (
    <>
      {rows.map((module, i) => {
        const box = rowBox(i);
        const lit = ease(t, taps[i], taps[i] + 0.3);
        const enter = ease(t, 18 + i * 0.12, 18.5 + i * 0.12);
        return (
          <div key={i} style={{ position: "absolute", inset: 0, opacity: enter, transform: `translateY(${(1 - enter) * 30}px)` }}>
            <Card box={box} radius={18}>
              <Fit box={{ x: 0, y: 0, w: box.w, h: box.h }} src="course-collapsed-full.png" width={1440} region={{ x: module.x + 1, y: module.y + 1, w: module.w - 2, h: module.h - 2 }} />
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 7, background: "#f5a524", opacity: lit }} />
            </Card>
          </div>
        );
      })}
      {hoppers.map(([who, x0], i) => {
        const land = taps[i];
        const box = rowBox(i);
        let pose = { x: x0, bottom: floor, floor, sx: 1, sy: 1 };
        if (t >= land - 0.7) {
          const j = hop(t, land - 0.7, land, x0, floor, box.x + 90, box.y, 120);
          pose = { x: j.x, bottom: j.bottom, floor: t >= land ? box.y : floor, ...squash(t, [[land, 0.9]]) };
        }
        return <Ball key={who} who={who} pose={pose} />;
      })}
      <Ball who="pip" pose={{ x: 640, bottom: floor, floor, sx: 1, sy: 1 }} />
    </>
  );
}

/** 5: Maya rolls up and hops onto the real search field, taps it twice; the question types in. */
function Ask({ t }: { t: number }) {
  const floor = 880;
  const bar: Box = { x: 410, y: 330, w: 1100, h: 100 };
  const land = sfx("bounce")[5];
  const { from, step, text } = timing.typing.search;
  const typed = Math.max(0, Math.min(text.length, Math.floor((t - from) / step + 1e-6)));
  const f = layout.searchField;
  let pose = { x: roll(t, 26.0, 26.8, 180, 360), bottom: floor, floor, sx: 1, sy: 1 };
  if (t >= land - 0.6) {
    const j = hop(t, land - 0.6, land, 360, floor, 480, bar.y, 110);
    pose = { x: j.x, bottom: j.bottom, floor: t >= land ? bar.y : floor, sx: 1, sy: 1 };
    for (const at of [land + 0.35, land + 0.7]) {
      if (t >= at && t < at + 0.26) pose.bottom = bar.y - 26 * 4 * ((t - at) / 0.26) * (1 - (t - at) / 0.26);
    }
    pose = { ...pose, ...squash(t, [[land, 0.8], [land + 0.61, 0.35], [land + 0.96, 0.35]]) };
  }
  const enter = ease(t, 26, 26.5);
  return (
    <>
      <Card box={bar} radius={50} style={{ transform: `translateY(${(1 - enter) * 40}px)`, opacity: enter }}>
        <Fit box={{ x: 0, y: 0, w: bar.w, h: bar.h }} src={`search-typed-${pad(typed)}.png`} width={1440} region={{ x: f.x + 3, y: f.y + 3, w: f.w - 6, h: f.h - 6 }} />
      </Card>
      <Ball who="maya" pose={pose} />
    </>
  );
}

/** 6: the real results rise; the learners gather under them; the top result's moment is marked. */
const RESULTS: Box = { x: 48, y: 244, w: 1344, h: 510 };
function Found({ t }: { t: number }) {
  const floor = 930;
  const w = 1180;
  const h = (w * RESULTS.h) / RESULTS.w;
  const rise = ease(t, 32, 32.9);
  const box: Box = { x: 960 - w / 2, y: 140 + (1 - rise) * 800, w, h };
  const card = layout.results.cards[0];
  const watch = layout.results.watch;
  const lift = ease(t, 34.2, 35.2);
  const gather: [Who, number, number][] = [
    ["maya", -150, 620],
    ["leo", -150, 770],
    ["pip", 2070, 1070],
    ["sam", 2070, 1190],
    ["kai", 2070, 1340],
  ];
  return (
    <>
      <Card box={box}>
        <Fit box={{ x: 0, y: 0, w, h }} src="search-results-full.png" width={1440} region={RESULTS} mode="cover" background="#f7f7f7">
          <div style={{ position: "absolute", left: card.x, top: card.y, width: card.w, height: card.h, transformOrigin: "60% 50%", transform: `scale(${1 + 0.05 * lift}) translateY(${-10 * lift}px)`, borderRadius: 14, overflow: "hidden", boxShadow: `0 ${24 * lift}px ${50 * lift}px -${16 * lift}px rgba(0,0,0,${0.35 * lift})` }}>
            <Img src={staticFile("captures/search-results-full.png")} style={{ position: "absolute", left: -card.x, top: -card.y, width: 1440, maxWidth: "none" }} />
            {watch && <Outline t={t} at={35.8} box={{ x: watch.x - card.x, y: watch.y - card.y, w: watch.w, h: watch.h }} />}
          </div>
        </Fit>
      </Card>
      {gather.map(([who, from, to], i) => {
        const start = 33 + i * 0.3;
        const x = roll(t, start, start + 1.1, from, to);
        const bounces = [35.5, 36.2, 36.9].map((at) => at + i * 0.12);
        let bottom = floor;
        for (const at of bounces) if (t >= at - 0.3 && t < at) bottom = floor - 40 * 4 * ((t - (at - 0.3)) / 0.3) * (1 - (t - (at - 0.3)) / 0.3);
        return <Ball key={who} who={who} pose={{ x, bottom, floor, ...squash(t, bounces.map((at) => [at, 0.5] as [number, number])) }} />;
      })}
    </>
  );
}

/** 7 and 8: the real lesson on a flat laptop; Leo watches, wanders off, and comes back. */
const SCREEN: Box = { x: 460, y: 170, w: 1000, h: 625 };
function Lesson({ t, back }: { t: number; back: boolean }) {
  const floor = 960;
  const frame = Math.max(0, Math.min(8, Math.floor((t - 39.5) / 0.5)));
  const src = back ? "player-paused.png" : `player-${pad(frame)}.png`;
  let pose = { x: 1180, bottom: floor, floor, sx: 1, sy: 1 };
  if (!back) {
    const leave = sfx("boing")[0];
    pose.x += Math.sin(t * 2.2) * 6 * (1 - ease(t, leave - 0.6, leave - 0.4));
    const hops: [number, number, number][] = [
      [leave - 0.4, 1180, 1460],
      [leave, 1460, 1760],
      [leave + 0.4, 1760, 2120],
    ];
    for (const [at, a, b] of hops) {
      if (t >= at) {
        const j = hop(t, at, at + 0.4, a, floor, b, floor, 150);
        pose = { ...pose, x: j.x, bottom: j.bottom, ...squash(t, [[at + 0.4, 0.6]]) };
      }
    }
  } else {
    const land = sfx("bounce")[6];
    const hops: [number, number, number][] = [
      [land - 1.2, 2120, 1760],
      [land - 0.8, 1760, 1460],
      [land - 0.4, 1460, 1180],
    ];
    pose.x = 2120;
    for (const [at, a, b] of hops) {
      if (t >= at) {
        const j = hop(t, at, at + 0.4, a, floor, b, floor, 150);
        pose = { ...pose, x: j.x, bottom: j.bottom };
      }
    }
    pose = { ...pose, ...squash(t, [[land - 0.8, 0.4], [land - 0.4, 0.4], [land, 1]]) };
  }
  return (
    <>
      <Laptop screen={SCREEN}>
        <Fit box={{ x: 0, y: 0, w: SCREEN.w, h: SCREEN.h }} src={src} width={1440} region={{ x: 0, y: 0, w: 1440, h: 900 }} mode="cover" />
      </Laptop>
      <Ball who="leo" pose={pose} />
      {back && <ResumePill t={t} x={1180} y={770} />}
    </>
  );
}

/** "Resumed at 5:46": the saved second is real; the pill is drawn over the real player. */
function ResumePill({ t, x, y }: { t: number; x: number; y: number }) {
  const at = sfx("pop")[0];
  if (t < at) return null;
  const s = interpolate(t, [at, at + 0.22, at + 0.4, at + 0.55], [0.4, 1.12, 0.96, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) scale(${s})`, transformOrigin: "50% 100%", opacity: ease(t, at, at + 0.12), display: "flex", alignItems: "center", gap: 12, padding: "12px 24px 12px 14px", borderRadius: 999, background: "#ffffff", boxShadow: "0 18px 40px -14px rgba(0,0,0,0.4)", fontFamily, fontSize: 30, fontWeight: 600, color: "#1d1d1f", whiteSpace: "nowrap" }}>
      <svg width="34" height="34" viewBox="0 0 26 26">
        <circle cx="13" cy="13" r="13" fill="#f5a524" />
        <path d="M10.5 8.5 L17.5 13 L10.5 17.5 Z" fill="#1d1d1f" />
      </svg>
      Resumed at 5:46
    </div>
  );
}

/** 9 and 10: the real quiz; Pip lands, fails and deflates, then reinflates as the retake passes. */
const QUIZ: Box = { x: 460, y: 250, w: 1000, h: 587 };
function Quiz({ t, retake }: { t: number; retake: boolean }) {
  const top = QUIZ.y;
  const blips = sfx("blip");
  const sigh = sfx("sigh")[0];
  const success = sfx("success")[0];
  const cheer = sfx("cheer")[0];
  const passed = retake ? ease(t, success, success + 0.3) : 0;
  const red = retake ? 0 : Math.max(0, ...blips.map((at) => (t >= at ? Math.exp(-(t - at) * 5) : 0)));
  const green = retake ? ease(t, success, success + 0.4) : 0;
  const glow = red > 0.02 ? `rgba(240,70,70,${0.75 * red})` : green > 0 ? `rgba(60,200,120,${0.6 * green})` : undefined;

  let pose = { x: 960, bottom: top, floor: top, sx: 1, sy: 1 };
  if (!retake) {
    const land = sfx("bounce")[7];
    const { h, impacts } = drop(t, land, 700);
    const s = squash(t, impacts);
    const flat = ease(t, sigh, sigh + 0.8);
    pose = { ...pose, bottom: top - h, sx: s.sx * lerp(1, 1.7, flat), sy: s.sy * lerp(1, 0.38, flat) };
  } else {
    const up = interpolate(t, [58.3, 58.75, 58.95, 59.1], [0.38, 1.12, 0.95, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    pose = { ...pose, sx: 1 / Math.sqrt(Math.max(0.6, up)), sy: up };
    if (t >= 59.1 && t < 59.6) pose.bottom = hop(t, 59.1, 59.6, 960, top, 960, top, 120).bottom;
    if (t >= 59.6) pose = { ...pose, ...squash(t, [[59.6, 0.7]]) };
  }
  const friends: [Who, number][] = [
    ["maya", 620],
    ["leo", 800],
    ["sam", 1120],
    ["kai", 1300],
  ];
  return (
    <>
      <Card box={QUIZ} glow={glow}>
        {passed < 1 && <Fit box={{ x: 0, y: 0, w: QUIZ.w, h: QUIZ.h }} src="quiz-failed.png" width={1098} region={{ x: 0, y: 0, w: 1098, h: 644 }} align="top" />}
        {passed > 0 && (
          <div style={{ position: "absolute", inset: 0, opacity: passed }}>
            <Fit box={{ x: 0, y: 0, w: QUIZ.w, h: QUIZ.h }} src="quiz-passed.png" width={1098} region={{ x: 0, y: 0, w: 1098, h: 512 }} align="top" />
          </div>
        )}
      </Card>
      <Ball who="pip" pose={pose} shadow="rgba(0,0,0,0.12)" />
      {retake &&
        friends.map(([who, x], i) => {
          const at = cheer - 0.1 + i * 0.1;
          const first = hop(t, at, at + 0.5, x, 1240, x, 1060, 90);
          const again = hop(t, at + 0.7, at + 1.1, x, 1060, x, 1060, 60);
          const bottom = t < at ? 1240 : t >= at + 0.7 ? again.bottom : first.bottom;
          return <Ball key={who} who={who} pose={{ x, bottom, floor: 1240, ...squash(t, [[at + 0.5, 0.6], [at + 1.1, 0.4]]) }} shadow="transparent" />;
        })}
    </>
  );
}

/** 11: a flat phone slides up; Sam rolls a ball of dough beside it; the goal types in; the plan builds. */
const PHONE: Box = { x: 1140, y: 140, w: 360, h: 780 };
function Plan({ t }: { t: number }) {
  const floor = 960;
  const slide = ease(t, 65, 66);
  const screen = { ...PHONE, y: PHONE.y + (1 - slide) * 980 };
  const { from, step, text } = timing.typing.plan;
  const typed = Math.max(0, Math.min(text.length, Math.floor((t - from) / step + 1e-6)));
  const plan = layout.plan;
  const ding = sfx("ding")[0];
  const open = PLAN_READY ? ease(t, ding, ding + 0.4) : 0;
  const scroll = plan ? interpolate(t, [ding + 0.7, ding + 4.2], [0, Math.max(0, plan.rows[0].y - 140)], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: smooth }) : 0;
  const sam = roll(t, 66, 68.2, -140, 860);
  const dough = roll(t, 66, 68.2, -40, 962);
  const proud = interpolate(t, [68.5, 68.75, 69.0, 69.25], [1, 1.12, 0.96, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <Phone screen={screen}>
        {open < 1 && <Fit box={{ x: 0, y: 0, w: screen.w, h: screen.h }} src={`plan-typed-${pad(typed)}.png`} width={390} region={{ x: 0, y: 0, w: 390, h: 844 }} mode="cover" align="top" />}
        {plan && open > 0 && (
          <div style={{ position: "absolute", inset: 0, opacity: open }}>
            <Fit box={{ x: 0, y: 0, w: screen.w, h: screen.h }} width={390} region={{ x: 0, y: scroll, w: 390, h: 844 }} mode="cover" align="top" background="#f7f7f7">
              <Img src={staticFile("captures/plan-full.png")} style={{ position: "absolute", left: 0, top: 0, width: 390, maxWidth: "none" }} />
              {plan.rows.map((row, i) => {
                const at = ding + 0.5 + i * 0.45;
                const p = ease(t, at, at + 0.4);
                const thumb = plan.thumbs[i];
                const snap = interpolate(t, [at + 0.25, at + 0.45, at + 0.6], [0, 1.08, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                return (
                  <div key={i}>
                    <div style={{ position: "absolute", left: row.x - 2, top: row.y - 1, width: row.w + 4, height: row.h + 2, background: "#f7f7f7" }} />
                    <div style={{ position: "absolute", left: row.x, top: row.y, width: row.w, height: row.h, overflow: "hidden", opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}>
                      <Img src={staticFile("captures/plan-full.png")} style={{ position: "absolute", left: -row.x, top: -row.y, width: 390, maxWidth: "none" }} />
                      <div style={{ position: "absolute", left: thumb.x - row.x, top: thumb.y - row.y, width: thumb.w, height: thumb.h, borderRadius: 8, background: "#e9e9ec" }} />
                      <div style={{ position: "absolute", left: thumb.x - row.x, top: thumb.y - row.y, width: thumb.w, height: thumb.h, borderRadius: 8, overflow: "hidden", opacity: Math.min(1, snap), transform: `scale(${0.6 + 0.4 * snap})` }}>
                        <Img src={staticFile("captures/plan-full.png")} style={{ position: "absolute", left: -thumb.x, top: -thumb.y, width: 390, maxWidth: "none" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </Fit>
          </div>
        )}
      </Phone>
      <Ball who="sam" pose={{ x: sam, bottom: floor, floor, sx: 1, sy: 1 }} />
      <Ball who="dough" pose={{ x: dough, bottom: floor, floor, sx: 1 / Math.sqrt(proud), sy: proud }} />
    </>
  );
}

/** 12: the learners roll into one row beside the guide, in the logo's order; the tagline; to black. */
function Finale({ t, bare }: { t: number; bare: boolean }) {
  const floor = 640;
  const order: [Who, number][] = [
    ["leo", 690],
    ["pip", 812],
    ["sam", 930],
    ["kai", 1098],
    ["maya", 1262],
  ];
  const tag = ease(t, 82.1, 83.1);
  const reflect = (who: Who, x: number) => <Ball who={who} pose={{ x, bottom: floor, floor, sx: 1, sy: -0.5 }} opacity={0.12} shadow="transparent" />;
  return (
    <>
      {order.map(([who, x], i) => {
        const start = 78.8 + i * 0.6;
        const px = roll(t, start, start + 1.0, -120, x);
        return (
          <div key={who}>
            {reflect(who, px)}
            <Ball who={who} pose={{ x: px, bottom: floor, floor, sx: 1, sy: 1 }} shadow="transparent" />
          </div>
        );
      })}
      {reflect("guide", 1400)}
      <Ball who="guide" pose={{ x: 1400, bottom: floor, floor, sx: 1, sy: 1 }} shadow="transparent" />
      {!bare && tag > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 820, textAlign: "center", fontFamily, fontSize: 58, fontWeight: 700, letterSpacing: "-0.03em", color: "#ffffff", opacity: tag, transform: `translateY(${(1 - tag) * 14}px)`, filter: `blur(${(1 - tag) * 8}px)` }}>
          Learn anything, the way a course teaches it.
        </div>
      )}
      <AbsoluteFill style={{ background: "#000", opacity: ease(t, 88.6, 90) }} />
    </>
  );
}

/* ------------------------------------------------------------------------------------------------ */

/** Where each push-in goes: [from, to, zoom, centre]. */
const PUSHES: Record<string, [number, number, number, { x: number; y: number }]> = {
  s01: [0, 6, 1.05, { x: 960, y: 700 }],
  s05: [29.8, 31.8, 1.25, { x: 960, y: 380 }],
  s06: [33.4, 36.8, 1.3, { x: 960, y: 400 }],
  s08: [48.4, 51.6, 1.28, { x: 1060, y: 560 }],
  s10: [60.4, 64.6, 1.22, { x: 960, y: 520 }],
  s11: [68.0, 77.6, 1.3, { x: 1260, y: 520 }],
};

function Scene({ id, t, bare }: { id: string; t: number; bare: boolean }) {
  switch (id) {
    case "s01":
      return <Arrive t={t} />;
    case "s02":
      return <Chaos t={t} />;
    case "s03":
      return <Order t={t} />;
    case "s04":
      return <Steps t={t} />;
    case "s05":
      return <Ask t={t} />;
    case "s06":
      return <Found t={t} />;
    case "s07":
      return <Lesson t={t} back={false} />;
    case "s08":
      return <Lesson t={t} back />;
    case "s09":
      return <Quiz t={t} retake={false} />;
    case "s10":
      return <Quiz t={t} retake />;
    case "s11":
      return <Plan t={t} />;
    default:
      return <Finale t={t} bare={bare} />;
  }
}

function Shot({ id, bare }: { id: string; bare: boolean }) {
  const frame = useCurrentFrame();
  const shot = shotOf(id);
  const t = shot.from + frame / FPS;
  const push = PUSHES[id];
  const body = (
    <AbsoluteFill style={{ background: shot.background, overflow: "hidden" }}>
      <Scene id={id} t={t} bare={bare} />
    </AbsoluteFill>
  );
  return push ? (
    <Push t={t} from={push[0]} to={push[1]} z={push[2]} at={push[3]}>
      {body}
    </Push>
  ) : (
    body
  );
}

export function Shots({ bare = false }: { bare?: boolean }) {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SHOTS.map((shot) => (
        <Sequence key={shot.id} from={Math.round(shot.from * FPS)} durationInFrames={Math.round((shot.to - shot.from) * FPS)} name={shot.id}>
          <Shot id={shot.id} bare={bare} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
