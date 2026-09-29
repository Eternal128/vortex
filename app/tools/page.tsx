import type { Metadata } from "next";
import { PageFrame } from "@/components/layout/page-frame";
import { SiteHeader } from "@/components/layout/site-header";
import { ToolFinder, type Tool } from "@/components/tools/tool-finder";
import { container } from "@/lib/layout";
import {
  blogHref,
  coursesHref,
  ideasHref,
  myLearningHref,
  newPlanHref,
  roadmapHref,
  searchPageHref,
  toolsHref,
} from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tools",
  description: "Every tool Vortex gives you to learn: search, plans, quizzes, progress, the roadmap and more.",
};

/** Only features that exist in Vortex today, each linking to where it lives. */
const tools: Tool[] = [
  {
    title: "Lesson Search",
    description: "Ask in plain English and land on the exact second of the lesson that teaches it.",
    href: searchPageHref,
    keywords: "find question moment video timestamp transcript chapters",
    group: "learn",
    icon: "search",
  },
  {
    title: "Plan Builder",
    description: "Describe a goal and get a personal syllabus with a YouTube video for every lesson.",
    href: newPlanHref,
    keywords: "goal syllabus custom personal course ai",
    group: "learn",
    icon: "plan",
  },
  {
    title: "Lesson Quizzes",
    description: "A short graded quiz after every video. See what you missed and retake it until you pass.",
    href: coursesHref,
    keywords: "test check grade questions pass retake",
    group: "learn",
    icon: "quiz",
  },
  {
    title: "Progress & Resume",
    description: "Your place in every video saves to the second. Pick up where you left off in My Learning.",
    href: myLearningHref,
    keywords: "continue resume saved completed my learning",
    group: "learn",
    icon: "progress",
  },
  {
    title: "Roadmap",
    description: "See every path at a glance: each category mapped to its courses and lessons.",
    href: roadmapHref,
    keywords: "map graph paths categories order overview",
    group: "learn",
    icon: "roadmap",
  },
  {
    title: "Ideas Board",
    description: "Suggest a course or a feature, and vote on what gets built next.",
    href: ideasHref,
    keywords: "feature request vote suggest community roadmap",
    group: "community",
    icon: "ideas",
  },
  {
    title: "Field Notes",
    description: "Short articles that go deeper on one idea, each tied to the course it extends.",
    href: blogHref,
    keywords: "blog articles notes reading writing",
    group: "community",
    icon: "blog",
  },
];

export default function ToolsPage() {
  return (
    <PageFrame header={<SiteHeader activeHref={toolsHref} />}>
      <main id="main" className={cn(container, "flex flex-1 flex-col pt-20 pb-24")}>
        <p className="eyebrow text-center text-neutral-500">Tools</p>
        <h1 className="mx-auto mt-4 max-w-[18ch] text-center text-[44px] leading-[1.02] font-semibold tracking-display text-balance text-neutral-900 sm:text-[64px]">
          Everything you learn with, in one place.
        </h1>
        <div className="mt-12">
          <ToolFinder tools={tools} />
        </div>
      </main>
    </PageFrame>
  );
}
