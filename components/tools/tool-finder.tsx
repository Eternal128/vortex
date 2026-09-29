"use client";

import {
  ArrowRight,
  History,
  Lightbulb,
  ListChecks,
  Map,
  Newspaper,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type ToolGroup = "learn" | "community";

export interface Tool {
  title: string;
  description: string;
  href: string;
  /** The words a learner might type to find it. */
  keywords: string;
  group: ToolGroup;
  icon: "search" | "plan" | "quiz" | "progress" | "roadmap" | "ideas" | "blog";
}

const ICONS: Record<Tool["icon"], LucideIcon> = {
  search: Search,
  plan: Sparkles,
  quiz: ListChecks,
  progress: History,
  roadmap: Map,
  ideas: Lightbulb,
  blog: Newspaper,
};

const GROUPS: { value: ToolGroup | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "learn", label: "Learn" },
  { value: "community", label: "Community" },
];

const ASCII = " .:-=+*#%@";

/** A deterministic strip of ASCII shading, denser toward one side, as on fanout's lab cards. */
function asciiStrip(seed: number, rows = 4, cols = 64) {
  let out = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wave = Math.sin((c + seed * 7) / 6) * 0.5 + 0.5;
      const noise = Math.abs(Math.sin((r + 1) * 12.9898 + (c + seed) * 78.233) * 43758.5453) % 1;
      const density = Math.max(0, Math.min(0.999, wave * (1 - r / rows) * 0.9 + noise * 0.25));
      out += ASCII[Math.floor(density * ASCII.length)];
    }
    out += "\n";
  }
  return out;
}

/** "Find a tool": a filter field (`/` focuses it), group tabs, a match count, and the tool cards. */
export function ToolFinder({ tools }: { tools: Tool[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<ToolGroup | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey) return;
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, [contenteditable=true]")) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = useMemo(
    () =>
      tools.filter((tool) => {
        if (group && tool.group !== group) return false;
        const haystack = `${tool.title} ${tool.description} ${tool.keywords}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tools, group, query],
  );

  const count = (value: ToolGroup | null) => tools.filter((tool) => !value || tool.group === value).length;

  return (
    <>
      <div className="mx-auto w-full max-w-230 rounded-xl border border-canvas-line bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="tool-filter" className="eyebrow text-neutral-500">
            Find a tool
          </label>
          <span className="hidden font-mono text-[11px] tracking-[0.1em] text-neutral-500 uppercase sm:inline">
            Press / to focus
          </span>
        </div>
        <div className="mt-4 flex h-13 items-center gap-3 rounded-lg border border-field-line bg-surface px-4 shadow-press-soft focus-within:border-neutral-500">
          <Search className="size-4.5 shrink-0 text-neutral-500" strokeWidth={2} aria-hidden />
          <input
            ref={inputRef}
            id="tool-filter"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search, plans, quizzes, progress, roadmap…"
            className="min-w-0 flex-1 bg-transparent text-body-lg text-neutral-900 placeholder:text-neutral-500 focus:outline-none"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Filter by kind" className="flex gap-1">
            {GROUPS.map(({ value, label }) => {
              const selected = group === value;
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setGroup(value)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                    selected ? "bg-neutral-100 font-medium text-neutral-900" : "text-neutral-500 hover:text-neutral-900",
                  )}
                >
                  {label}
                  <span className="tabular font-mono text-[12px] text-neutral-500">{count(value)}</span>
                </button>
              );
            })}
          </div>
          <p aria-live="polite" className="font-mono text-[11px] tracking-[0.1em] text-neutral-500 uppercase">
            {matches.length} {matches.length === 1 ? "match" : "matches"}
          </p>
        </div>
      </div>

      {matches.length > 0 ? (
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((tool, index) => {
            const Icon = ICONS[tool.icon];
            return (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="lift group flex h-full flex-col overflow-hidden rounded-xl border border-canvas-line bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <pre
                    aria-hidden
                    className="h-14 overflow-hidden px-3 pt-2 font-mono text-[9px] leading-[10px] text-neutral-300 select-none [mask-image:linear-gradient(to_bottom,black,transparent)]"
                  >
                    {asciiStrip(index + tool.title.length)}
                  </pre>
                  <div className="flex flex-1 flex-col px-6 pb-6">
                    <span className="flex size-11 items-center justify-center rounded-md bg-neutral-100 text-neutral-900">
                      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <h2 className="mt-5 text-[24px] leading-7 font-semibold tracking-[-0.04em] text-neutral-900">
                      {tool.title}
                    </h2>
                    <p className="mt-2 text-body text-neutral-500">{tool.description}</p>
                    <span className="mt-auto flex items-center justify-between pt-8 text-body font-medium text-neutral-900">
                      Open {tool.title}
                      <span className="flex size-9 items-center justify-center rounded-full bg-neutral-100 transition-transform duration-300 group-hover:translate-x-0.5">
                        <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
                      </span>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mx-auto mt-14 max-w-230 rounded-xl border border-dashed border-neutral-300 px-6 py-14 text-center">
          <p className="text-body-lg font-medium text-neutral-900">No tool matches &ldquo;{query}&rdquo;.</p>
          <p className="mt-2 text-body text-neutral-500">Try a shorter word, or clear the filter.</p>
        </div>
      )}
    </>
  );
}
