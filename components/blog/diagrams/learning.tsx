import { Arrow, Box, Note, Svg, hairline, ink, line, muted, series, surface } from "./primitives";

/**
 * Learning-science charts and schematics. Charts of published results draw only the numbers the
 * cited papers report; schematic curves are labelled as illustrative. Each chart exports its data
 * so the figure can offer a table view.
 */

export interface ChartTable {
  columns: string[];
  rows: (string | number)[][];
}

const AXIS = { fontSize: 11.5, fill: muted, fontFamily: "var(--font-mono)" } as const;

/** Horizontal gridline + label at a y value. */
function GridY({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  return (
    <g>
      <line x1={x1} x2={x2} y1={y} y2={y} stroke={hairline} />
      <text x={x1 - 8} y={y + 4} textAnchor="end" {...AXIS}>{label}</text>
    </g>
  );
}

/** A vertical bar with a 4px rounded top, anchored to the baseline, with its value above. */
function Bar({ x, w, base, h, fill, value, title }: { x: number; w: number; base: number; h: number; fill: string; value: string; title: string }) {
  const r = Math.min(4, h / 2);
  const top = base - h;
  return (
    <g>
      <title>{title}</title>
      <path
        d={`M${x} ${base} L${x} ${top + r} Q${x} ${top} ${x + r} ${top} L${x + w - r} ${top} Q${x + w} ${top} ${x + w} ${top + r} L${x + w} ${base} Z`}
        fill={fill}
      />
      <text x={x + w / 2} y={top - 7} textAnchor="middle" fontSize={12.5} fontWeight={600} fill={ink}>{value}</text>
    </g>
  );
}

function Legend({ x, y, items }: { x: number; y: number; items: { label: string; color: string }[] }) {
  // Each entry starts after the previous one: a swatch, a gap, and the label's rough width.
  const starts = items.map((_, i) =>
    items.slice(0, i).reduce((sum, item) => sum + 26 + item.label.length * 7.4, x),
  );
  return (
    <g>
      {items.map((item, i) => (
        <g key={item.label}>
          <rect x={starts[i]} y={y - 9} width={12} height={12} rx={3} fill={item.color} />
          <text x={starts[i] + 18} y={y + 1} fontSize={12} fill={ink}>{item.label}</text>
        </g>
      ))}
    </g>
  );
}

/* ------------------------------------------------------------ testing effect */

const TESTING = {
  groups: ["5 minutes", "1 week"],
  conditions: [
    { label: "Read ×4 (SSSS)", values: [83, 40] },
    { label: "Read ×3, recall ×1 (SSST)", values: [78, 56] },
    { label: "Read ×1, recall ×3 (STTT)", values: [71, 61] },
  ],
};

export const testingEffectTable: ChartTable = {
  columns: ["Condition", "Recall after 5 min (%)", "Recall after 1 week (%)"],
  rows: TESTING.conditions.map((c) => [c.label, c.values[0], c.values[1]]),
};

/** Roediger & Karpicke (2006), Experiment 2: proportion of idea units recalled. */
export function TestingEffect() {
  const id = "testing-effect";
  const base = 300;
  const scale = 2.6; // px per percentage point
  const barW = 44;
  return (
    <Svg id={id} height={360} title="Recall on the final test, Roediger and Karpicke 2006, Experiment 2. After 5 minutes, rereading led: 83, 78 and 71 percent. After one week the order inverted: 40, 56 and 61 percent for read four times, three reads and one recall, and one read and three recalls.">
      <Legend x={80} y={24} items={TESTING.conditions.map((c, i) => ({ label: c.label, color: series[i] }))} />
      {[0, 25, 50, 75, 100].map((v) => (
        <GridY key={v} x1={80} x2={780} y={base - v * scale} label={`${v}%`} />
      ))}
      {TESTING.groups.map((group, g) => {
        const groupX = 150 + g * 330;
        return (
          <g key={group}>
            {TESTING.conditions.map((c, i) => (
              <Bar
                key={c.label}
                x={groupX + i * (barW + 2)}
                w={barW}
                base={base}
                h={c.values[g] * scale}
                fill={series[i]}
                value={`${c.values[g]}%`}
                title={`${c.label}, ${group}: ${c.values[g]}%`}
              />
            ))}
            <text x={groupX + (barW * 3 + 4) / 2} y={base + 22} textAnchor="middle" fontSize={13} fontWeight={600} fill={ink}>
              Final test after {group}
            </text>
          </g>
        );
      })}
      <line x1={80} x2={780} y1={base} y2={base} stroke={line} />
      <Note x={780} y={base + 48} anchor="end">Roediger &amp; Karpicke (2006), Exp. 2 · % of idea units recalled</Note>
    </Svg>
  );
}

/* ------------------------------------------------------ engagement by length */

const ENGAGEMENT = [
  { bucket: "Under 6 min", value: 100, label: "≈ all of it" },
  { bucket: "9–12 min", value: 50, label: "≈ 50%" },
  { bucket: "12–40 min", value: 20, label: "≈ 20%" },
];

export const engagementTable: ChartTable = {
  columns: ["Video length", "Median share watched (approx.)"],
  rows: ENGAGEMENT.map((e) => [e.bucket, e.label]),
};

/** Guo, Kim & Rubin (2014): median share of a video watched, by length (approximate). */
export function EngagementByLength() {
  const id = "engagement-by-length";
  const base = 260;
  const scale = 2;
  return (
    <Svg id={id} height={320} title="Guo, Kim and Rubin 2014, 6.9 million sessions on edX: the median learner watched roughly all of a video under 6 minutes, about half of a 9 to 12 minute video, and about a fifth of a 12 to 40 minute video.">
      {[0, 50, 100].map((v) => (
        <GridY key={v} x1={120} x2={760} y={base - v * scale} label={`${v}%`} />
      ))}
      {ENGAGEMENT.map((e, i) => (
        <g key={e.bucket}>
          <Bar
            x={170 + i * 200}
            w={110}
            base={base}
            h={e.value * scale}
            fill={series[0]}
            value={e.label}
            title={`${e.bucket}: median share watched ${e.label}`}
          />
          <text x={225 + i * 200} y={base + 22} textAnchor="middle" fontSize={13} fontWeight={600} fill={ink}>{e.bucket}</text>
        </g>
      ))}
      <line x1={120} x2={760} y1={base} y2={base} stroke={line} />
      <Note x={760} y={base + 48} anchor="end">Guo, Kim &amp; Rubin (2014) · median share of video watched, approximate</Note>
    </Svg>
  );
}

/* -------------------------------------------------------- spacing ridgeline */

const SPACING = [
  { interval: "Remember for 1 week", low: 20, high: 40 },
  { interval: "Remember for 1 year", low: 5, high: 10 },
];

export const spacingTable: ChartTable = {
  columns: ["How long you need to remember", "Best gap between sessions (% of that time)"],
  rows: SPACING.map((s) => [s.interval, `${s.low}–${s.high}%`]),
};

/** Cepeda et al. (2008): the best study gap, as a share of the retention interval. */
export function SpacingRidgeline() {
  const id = "spacing-ridgeline";
  const x0 = 250;
  const scale = 10; // px per percentage point
  return (
    <Svg id={id} height={250} title="Cepeda and colleagues 2008: to remember for one week, the best gap between study sessions was about 20 to 40 percent of that week; to remember for a year, about 5 to 10 percent, for example 23 days before a 350-day test.">
      {[0, 10, 20, 30, 40, 50].map((v) => (
        <g key={v}>
          <line x1={x0 + v * scale} x2={x0 + v * scale} y1={40} y2={180} stroke={hairline} />
          <text x={x0 + v * scale} y={200} textAnchor="middle" {...AXIS}>{v}%</text>
        </g>
      ))}
      {SPACING.map((s, i) => {
        const y = 80 + i * 70;
        return (
          <g key={s.interval}>
            <title>{`${s.interval}: best gap ${s.low}–${s.high}% of the interval`}</title>
            <text x={x0 - 16} y={y + 5} textAnchor="end" fontSize={13} fontWeight={600} fill={ink}>{s.interval}</text>
            <rect x={x0 + s.low * scale} y={y - 12} width={(s.high - s.low) * scale} height={24} rx={4} fill={series[i]} />
            <text x={x0 + s.high * scale + 10} y={y + 5} fontSize={12.5} fill={ink}>{s.low}–{s.high}%</text>
          </g>
        );
      })}
      <circle cx={x0 + 7 * scale} cy={150} r={5} fill={surface} stroke={ink} strokeWidth={2} />
      <Note x={x0 + 10 * scale + 64} y={155}>○ = 23 days before a 350-day test (≈ 7%)</Note>
      <Note x={780} y={232} anchor="end">Cepeda et al. (2008) · best gap as a share of the retention interval</Note>
    </Svg>
  );
}

/** Illustrative: one study session decays fast; spaced reviews flatten the curve. */
export function ForgettingReviews() {
  const id = "forgetting-reviews";
  const X = (day: number) => 90 + day * 22;
  const Y = (p: number) => 250 - p * 2;
  // Exponential decay after each review, with slower decay after each one. Illustrative only.
  const once = Array.from({ length: 31 }, (_, d) => [X(d), Y(100 * Math.exp(-d / 3))] as const);
  const reviews = [0, 2, 7, 16];
  const spaced: (readonly [number, number])[] = [];
  for (let d = 0; d <= 30; d += 0.5) {
    const last = [...reviews].reverse().find((r) => r <= d) ?? 0;
    const n = reviews.indexOf(last);
    const tau = 3 * Math.pow(2.6, n);
    spaced.push([X(d), Y(100 * Math.exp(-(d - last) / tau))]);
  }
  const path = (pts: readonly (readonly [number, number])[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <Svg id={id} height={310} title="Illustrative, not data: after a single study session recall falls quickly; with reviews spaced further and further apart, each review restores recall and the curve falls more slowly after it.">
      {[0, 50, 100].map((v) => (
        <GridY key={v} x1={90} x2={760} y={Y(v)} label={`${v}%`} />
      ))}
      <path d={path(once)} fill="none" stroke={series[1]} strokeWidth={2} />
      <path d={path(spaced)} fill="none" stroke={series[0]} strokeWidth={2} />
      {reviews.slice(1).map((r) => (
        <g key={r}>
          <circle cx={X(r)} cy={Y(100)} r={5} fill={series[0]} stroke={surface} strokeWidth={2} />
          <text x={X(r)} y={Y(100) - 12} textAnchor="middle" {...AXIS}>review · day {r}</text>
        </g>
      ))}
      <line x1={90} x2={760} y1={Y(0)} y2={Y(0)} stroke={line} />
      {[0, 7, 14, 21, 28].map((d) => (
        <text key={d} x={X(d)} y={Y(0) + 20} textAnchor="middle" {...AXIS}>day {d}</text>
      ))}
      <Legend x={420} y={215} items={[{ label: "Studied once", color: series[1] }, { label: "Spaced reviews", color: series[0] }]} />
      <Note x={760} y={296} anchor="end">illustrative, not data · the shape the spacing literature describes</Note>
    </Svg>
  );
}

/* ------------------------------------------------------ interpolated quizzes */

/** A lecture watched straight through vs cut into segments with a short quiz after each. */
export function InterpolatedQuizzes() {
  const id = "interpolated-quizzes";
  const segs = 4;
  return (
    <Svg id={id} height={230} title="Top: one long lecture watched straight through. Bottom: the same lecture in four segments with a short quiz after each; in Szpunar and colleagues 2013 this roughly halved mind wandering and improved the final test.">
      <text x={20} y={60} fontSize={13} fontWeight={600} fill={ink}>Straight through</text>
      <rect x={200} y={42} width={560} height={28} rx={6} fill={series[0]} opacity={0.35} />
      <Note x={480} y={90} anchor="middle">one long stream · attention drifts</Note>

      <text x={20} y={150} fontSize={13} fontWeight={600} fill={ink}>Segmented + quizzes</text>
      {Array.from({ length: segs }, (_, i) => {
        const x = 200 + i * 142;
        return (
          <g key={i}>
            <rect x={x} y={132} width={112} height={28} rx={6} fill={series[0]} />
            <rect x={x + 116} y={128} width={22} height={36} rx={5} fill="var(--color-brand-500)" />
            <text x={x + 127} y={151} textAnchor="middle" fontSize={11} fontWeight={700} fill="#1f1f1f">Q</text>
          </g>
        );
      })}
      <Note x={480} y={190} anchor="middle">short quiz after each segment · mind wandering ≈ halved</Note>
      <Note x={780} y={220} anchor="end">after Szpunar, Khan &amp; Schacter (2013)</Note>
    </Svg>
  );
}

/* -------------------------------------------------------- feeling vs learning */

const FEELING = [
  { label: "Exam score", value: 0.46 },
  { label: "Feeling of learning", value: -0.56 },
];

export const feelingTable: ChartTable = {
  columns: ["Measure", "Active minus passive (SD)"],
  rows: FEELING.map((f) => [f.label, f.value > 0 ? `+${f.value}` : `${f.value}`]),
};

/** Deslauriers et al. (2019): active vs passive classes, in standard deviations. */
export function FeelingVsLearning() {
  const id = "feeling-vs-learning";
  const x0 = 420;
  const scale = 380; // px per SD
  return (
    <Svg id={id} height={230} title="Deslauriers and colleagues 2019: students in active classes scored 0.46 standard deviations higher on the exam, yet rated their feeling of learning 0.56 standard deviations lower than students in polished lectures.">
      <line x1={x0} x2={x0} y1={30} y2={170} stroke={ink} strokeWidth={1.2} />
      <text x={x0} y={22} textAnchor="middle" {...AXIS}>no difference</text>
      {[-0.5, 0.5].map((v) => (
        <g key={v}>
          <line x1={x0 + v * scale} x2={x0 + v * scale} y1={30} y2={170} stroke={hairline} />
          <text x={x0 + v * scale} y={188} textAnchor="middle" {...AXIS}>{v > 0 ? "+" : ""}{v} SD</text>
        </g>
      ))}
      {FEELING.map((f, i) => {
        const y = 60 + i * 60;
        const w = Math.abs(f.value) * scale;
        const x = f.value > 0 ? x0 : x0 - w;
        return (
          <g key={f.label}>
            <title>{`${f.label}: ${f.value > 0 ? "+" : ""}${f.value} SD for active classes`}</title>
            <rect x={x} y={y} width={w} height={30} rx={4} fill={f.value > 0 ? series[0] : series[1]} />
            <text x={f.value > 0 ? x + w + 10 : x - 10} y={y + 20} textAnchor={f.value > 0 ? "start" : "end"} fontSize={13} fontWeight={600} fill={ink}>
              {f.label} {f.value > 0 ? "+" : ""}{f.value} SD
            </text>
          </g>
        );
      })}
      <Note x={780} y={218} anchor="end">Deslauriers et al. (2019) · active minus passive classes</Note>
    </Svg>
  );
}

/* ------------------------------------------------------ blocked vs interleaved */

export const interleavingTable: ChartTable = {
  columns: ["Practice schedule", "Test score one week later"],
  rows: [["Blocked", "20%"], ["Interleaved (mixed)", "63%"]],
};

/** Practice order (schematic) and Rohrer & Taylor (2007) test scores a week later. */
export function BlockedVsInterleaved() {
  const id = "blocked-vs-interleaved";
  const blocked = "AAAABBBBCCCC".split("");
  const mixed = "ABCBCACABBCA".split("");
  const colorOf = (c: string) => series["ABC".indexOf(c)];
  const row = (letters: string[], y: number) =>
    letters.map((c, i) => (
      <g key={i}>
        <rect x={170 + i * 30} y={y} width={26} height={26} rx={5} fill={colorOf(c)} />
        <text x={183 + i * 30} y={y + 18} textAnchor="middle" fontSize={12} fontWeight={700} fill="#ffffff">{c}</text>
      </g>
    ));
  const base = 200;
  const scale = 1.9;
  return (
    <Svg id={id} height={260} title="Blocked practice does all problems of one kind before the next; interleaved practice mixes kinds. In Rohrer and Taylor 2007, mixed practice scored 63 percent on a test a week later versus 20 percent for blocked practice.">
      <text x={20} y={72} fontSize={13} fontWeight={600} fill={ink}>Blocked</text>
      {row(blocked, 54)}
      <text x={20} y={142} fontSize={13} fontWeight={600} fill={ink}>Interleaved</text>
      {row(mixed, 124)}
      <Note x={170} y={36}>A, B, C = three kinds of problem · one practice session</Note>

      {[0, 50].map((v) => (
        <GridY key={v} x1={600} x2={780} y={base - v * scale} label={`${v}%`} />
      ))}
      <Bar x={620} w={60} base={base} h={20 * scale} fill={series[1]} value="20%" title="Blocked: 20% one week later" />
      <Bar x={700} w={60} base={base} h={63 * scale} fill={series[0]} value="63%" title="Interleaved: 63% one week later" />
      <text x={650} y={base + 20} textAnchor="middle" {...AXIS}>blocked</text>
      <text x={730} y={base + 20} textAnchor="middle" {...AXIS}>mixed</text>
      <Note x={780} y={248} anchor="end">Rohrer &amp; Taylor (2007) · test one week later</Note>
    </Svg>
  );
}

/* --------------------------------------------------------------- pretest loop */

/** Try first, get feedback, study, retrieve again. */
export function PretestLoop() {
  const id = "pretest-loop";
  return (
    <Svg id={id} height={250} title="A learning loop: attempt a question before studying, get corrective feedback, study with the question in mind, then retrieve again later.">
      <Box x={20} y={95} w={150} h={60} label="Try first" sub="even if wrong" strong />
      <Arrow id={id} points={[[170, 125], [220, 125]]} />
      <Box x={224} y={95} w={150} h={60} label="Feedback" sub="the right answer" />
      <Arrow id={id} points={[[374, 125], [424, 125]]} />
      <Box x={428} y={95} w={150} h={60} label="Study" sub="now it has a hook" />
      <Arrow id={id} points={[[578, 125], [628, 125]]} />
      <Box x={632} y={95} w={150} h={60} label="Retrieve later" sub="spaced quiz" />
      <Arrow id={id} points={[[707, 155], [707, 210], [95, 210], [95, 160]]} dashed label="next topic" labelAt={[400, 228]} />
      <Note x={400} y={60} anchor="middle">wrong guesses help when the answer follows (Richland et al., 2009)</Note>
    </Svg>
  );
}
