import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDuration } from "@/lib/format";
import { coursesHref } from "@/lib/routes";

interface StatsBandProps {
  courseCount: number;
  lessonCount: number;
  /** Total video length across every lesson. */
  totalSeconds: number;
}

/** The spec's navy stat panel, filled with totals counted from the catalog — never invented. */
export function StatsBand({ courseCount, lessonCount, totalSeconds }: StatsBandProps) {
  const stats = [
    { value: String(courseCount), label: courseCount === 1 ? "course" : "courses" },
    { value: String(lessonCount), label: lessonCount === 1 ? "video" : "videos" },
    { value: formatDuration(totalSeconds), label: "of video" },
  ].filter((stat): stat is { value: string; label: string } => Boolean(stat.value) && stat.value !== "0");

  return (
    <section
      aria-labelledby="stats-band"
      className="grid items-center gap-8 rounded-lg bg-callout px-8 py-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-12"
    >
      <div className="max-w-xl">
        <h2 id="stats-band" className="text-heading-1 text-white">
          YouTube&rsquo;s best teaching, organized to the second
        </h2>
        <p className="mt-3 text-body-lg text-white/80">
          Every video is sequenced into a course, indexed by chapter and transcript, and followed by a
          quiz, so you learn in order and find any moment in seconds.
        </p>
        <Link
          href={coursesHref}
          className="mt-5 inline-flex items-center gap-2 rounded-xs text-action text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-callout"
        >
          Start learning
          <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
        </Link>
      </div>
      {stats.length > 0 && (
        <dl className="grid grid-cols-3 gap-6 sm:gap-10">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse">
              <dt className="mt-1 text-body text-white/80">{stat.label}</dt>
              <dd className="text-display-1 text-white tabular">{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
