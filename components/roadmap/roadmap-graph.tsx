import { WINDMILL_SAILS } from "@/components/brand/logo";
import { pluralize } from "@/lib/format";
import { courseHref, lessonHref } from "@/lib/routes";
import { paletteFor } from "@/lib/palette";

export interface RoadmapModule {
  _key: string;
  title: string | null;
  lessonCount: number | null;
  firstLessonSlug: string | null;
}

export interface RoadmapCourse {
  _id: string;
  title: string | null;
  slug: string | null;
  accent: string | null;
  lessonCount: number | null;
  modules: RoadmapModule[] | null;
}

interface RoadmapGraphProps {
  category: { title: string; courseCount: number; lessonCount: number };
  courses: RoadmapCourse[];
}

/** The node marks, cycled per module, as in the reference: each shape stands for one module. */
export const NODE_SHAPES = ["square", "diamond", "circle", "triangle", "hexagon", "pentagon"] as const;
export type NodeShape = (typeof NODE_SHAPES)[number];

/** Vivid node colours for module marks. Fixed across themes, like the rest of the artwork. */
export const NODE_COLORS = ["#e8812f", "#2f6fed", "#1fae78", "#7c5ce6", "#d9485f", "#6b7280"];

const W = 1000;
const H = 940;
const HUB = { x: W / 2, y: H / 2 };
const COURSE_RADIUS = 225;
const MODULE_RADIUS = 205;

/** Splits a title onto at most two lines of about `max` characters, on word breaks. */
function wrap(text: string, max = 18) {
  const words = text.split(/\s+/);
  const lines: string[] = [""];
  for (const word of words) {
    const current = lines[lines.length - 1];
    if (current && (current + " " + word).length > max) {
      if (lines.length === 2) {
        lines[1] = `${lines[1]}…`;
        break;
      }
      lines.push(word);
    } else {
      lines[lines.length - 1] = current ? `${current} ${word}` : word;
    }
  }
  return lines;
}

function polygon(cx: number, cy: number, r: number, sides: number, rotate = -Math.PI / 2) {
  return Array.from({ length: sides }, (_, i) => {
    const a = rotate + (i * 2 * Math.PI) / sides;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

/** One module mark. Odd-numbered marks are filled, even ones outlined with their number inside. */
export function NodeMark({
  shape,
  color,
  x,
  y,
  r = 13,
  filled,
  number,
}: {
  shape: NodeShape;
  color: string;
  x: number;
  y: number;
  r?: number;
  filled: boolean;
  number?: number;
}) {
  const paint = filled
    ? { fill: color, stroke: color }
    : { fill: "var(--color-canvas)", stroke: color };
  const mark = (() => {
    switch (shape) {
      case "square":
        return <rect x={x - r} y={y - r} width={r * 2} height={r * 2} strokeWidth={1.5} {...paint} />;
      case "diamond":
        return <polygon points={polygon(x, y, r * 1.3, 4)} strokeWidth={1.5} {...paint} />;
      case "circle":
        return <circle cx={x} cy={y} r={r} strokeWidth={1.5} {...paint} />;
      case "triangle":
        return <polygon points={polygon(x, y + 2, r * 1.3, 3)} strokeWidth={1.5} {...paint} />;
      case "hexagon":
        return <polygon points={polygon(x, y, r * 1.15, 6)} strokeWidth={1.5} {...paint} />;
      case "pentagon":
        return <polygon points={polygon(x, y, r * 1.2, 5)} strokeWidth={1.5} {...paint} />;
    }
  })();
  return (
    <g>
      {mark}
      {!filled && number !== undefined ? (
        <text x={x} y={y + 3.5} textAnchor="middle" fontSize={9} fill={color} className="font-mono">
          {number}
        </text>
      ) : null}
    </g>
  );
}

/**
 * The roadmap graph for one category: the windmill at the hub, the category's courses on the first
 * ring, and each course's modules fanned out beyond it, with lesson counts. Every node is a link:
 * a course opens the course page, a module opens its first lesson. Pure SVG, server-rendered.
 */
export function RoadmapGraph({ category, courses }: RoadmapGraphProps) {
  const n = Math.max(courses.length, 1);
  // One course sits to the left of the hub; several spread evenly around it.
  const startAngle = n === 1 ? Math.PI : Math.PI * 0.75;
  let moduleIndex = 0;

  const placed = courses.map((course, i) => {
    const angle = startAngle + (i * 2 * Math.PI) / n;
    const cx = HUB.x + COURSE_RADIUS * Math.cos(angle);
    const cy = HUB.y + COURSE_RADIUS * Math.sin(angle);
    const modules = (course.modules ?? []).slice(0, 6);
    const spread = n === 1 ? Math.PI * 1.25 : Math.min(Math.PI * 0.95, (Math.PI * 1.6) / n);
    const mods = modules.map((module, j) => {
      const t = modules.length === 1 ? 0.5 : j / (modules.length - 1);
      const a = angle - spread / 2 + t * spread;
      const index = moduleIndex++;
      return {
        module,
        number: j + 1,
        x: cx + MODULE_RADIUS * Math.cos(a),
        y: cy + MODULE_RADIUS * Math.sin(a),
        shape: NODE_SHAPES[index % NODE_SHAPES.length],
        color: NODE_COLORS[index % NODE_COLORS.length],
        filled: index % 2 === 0,
        dashed: j % 2 === 1,
      };
    });
    return { course, cx, cy, angle, mods, palette: paletteFor(course.accent, course.slug) };
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${category.title}: ${pluralize(courses.length, "course")} and their modules`}
      className="h-auto w-full"
    >
      {/* Edges first, so the marks sit on top of them. */}
      {placed.map(({ course, cx, cy, mods }) => (
        <g key={`edges-${course._id}`} stroke="var(--color-neutral-300)" strokeWidth={1.25} fill="none">
          <path d={`M${HUB.x} ${HUB.y} L${(HUB.x + cx) / 2} ${HUB.y} L${cx} ${cy}`} />
          {mods.map(({ module, x, y, dashed }) => (
            <path
              key={module._key}
              d={`M${cx} ${cy} L${(cx + x) / 2} ${(cy + y) / 2 + (y > cy ? 12 : -12)} L${x} ${y}`}
              strokeDasharray={dashed ? "5 5" : undefined}
            />
          ))}
        </g>
      ))}

      {/* Hub: the windmill, turning slowly unless reduced motion is on. */}
      <g>
        <circle cx={HUB.x} cy={HUB.y} r={36} fill="var(--color-surface)" stroke="var(--color-canvas-line)" />
        <g transform={`translate(${HUB.x - 26} ${HUB.y - 26}) scale(1.0833)`}>
          <g className="origin-center motion-safe:animate-[spin_12s_linear_infinite] [transform-box:fill-box]">
            {WINDMILL_SAILS.map((sail) => (
              <path key={sail.d} d={sail.d} fill={sail.fill} />
            ))}
            <circle cx={24} cy={24} r={3} fill="var(--color-surface)" stroke="var(--color-neutral-900)" strokeWidth={1.5} />
          </g>
        </g>
        <text x={HUB.x} y={HUB.y + 66} textAnchor="middle" fontSize={25} fontWeight={600} fill="var(--color-neutral-900)" letterSpacing="-0.5">
          {category.title}
        </text>
        <text x={HUB.x} y={HUB.y + 90} textAnchor="middle" fontSize={14} fill="var(--color-neutral-500)" className="font-mono">
          {pluralize(category.courseCount, "course")} · {pluralize(category.lessonCount, "lesson")}
        </text>
      </g>

      {placed.map(({ course, cx, cy, mods, palette }) => (
        <g key={course._id}>
          {mods.map(({ module, number, x, y, shape, color, filled }) => {
            const lines = wrap(module.title ?? `Module ${number}`, 16);
            const href = module.firstLessonSlug ? lessonHref(module.firstLessonSlug) : course.slug ? courseHref(course.slug) : undefined;
            const body = (
              <g className="transition-opacity hover:opacity-70">
                <NodeMark shape={shape} color={color} x={x} y={y} r={16} filled={filled} number={number} />
                <text x={x} y={y + 40} textAnchor="middle" fontSize={19} fill="var(--color-neutral-900)" letterSpacing="-0.3">
                  {lines.map((line, i) => (
                    <tspan key={i} x={x} dy={i ? 22 : 0}>
                      {line}
                    </tspan>
                  ))}
                </text>
                <text x={x} y={y + 40 + lines.length * 22} textAnchor="middle" fontSize={14} fill="var(--color-neutral-500)" className="font-mono">
                  {pluralize(module.lessonCount ?? 0, "lesson")}
                </text>
              </g>
            );
            return href ? (
              <a key={module._key} href={href} aria-label={`${module.title}, ${pluralize(module.lessonCount ?? 0, "lesson")}`}>
                {body}
              </a>
            ) : (
              <g key={module._key}>{body}</g>
            );
          })}

          <a href={course.slug ? courseHref(course.slug) : undefined} aria-label={`${course.title}, ${pluralize(course.lessonCount ?? 0, "lesson")}`}>
            <g className="transition-opacity hover:opacity-80">
              <rect x={cx - 21} y={cy - 21} width={42} height={42} rx={10} fill={palette.art} stroke={palette.ink} strokeWidth={2} />
              <rect x={cx - 14} y={cy - 28} width={42} height={42} rx={10} fill="none" stroke={palette.ink} strokeWidth={1.25} opacity={0.5} />
              {wrap(course.title ?? "Course", 22).map((line, i) => (
                <text key={i} x={cx} y={cy + 50 + i * 24} textAnchor="middle" fontSize={21} fontWeight={600} fill="var(--color-neutral-900)" letterSpacing="-0.4">
                  {line}
                </text>
              ))}
            </g>
          </a>
        </g>
      ))}
    </svg>
  );
}
