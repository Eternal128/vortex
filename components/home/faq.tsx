import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Every answer describes what Vortex actually does today; nothing here promises more. */
const questions = [
  {
    q: "Where should I start?",
    a: "Open the catalog and pick the path closest to your work. Every course lists its modules and lessons up front, and lessons marked free preview are labelled so you can sample the teaching first.",
  },
  {
    q: "How does search work?",
    a: "Ask in plain English. Vortex matches lessons on their topic and video moments on their chapters and transcripts, ranks the most specific matches first, and links straight to the lesson page starting at the matched second.",
  },
  {
    q: "Do I need an account?",
    a: "No. The catalog, search and every lesson page are open. Signing in saves your progress and quiz results, adds My Learning and personal plans, and lets you post and vote on the Ideas board.",
  },
  {
    q: "What is a personal plan?",
    a: "Describe what you want to learn and Vortex designs a syllabus, matching each lesson to a YouTube video through YouTube's official API. Plans are private to you, with progress and a quiz per lesson.",
  },
  {
    q: "What are field notes?",
    a: "Short articles that go deeper on one idea. Each note is tied to a topic and, where it fits, to the course it belongs to.",
  },
  {
    q: "Can I suggest a course or a feature?",
    a: "Yes. Post it on the Ideas board. The team reviews every submission before it appears publicly, and you can upvote the ideas you want most.",
  },
  {
    q: "Does the video leave the site?",
    a: "No. Lessons play in YouTube's own player embedded on the lesson page, with the creator credited, so a search result opens the lesson and starts at the right second without sending you elsewhere.",
  },
];

export function Faq({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-10 lg:grid-cols-[1fr_1.45fr] lg:gap-20", className)}>
      <div>
        <p className="eyebrow text-neutral-500">FAQ</p>
        <h2 className="mt-4 max-w-[14ch] text-[34px] leading-[1.08] font-semibold tracking-[-0.04em] text-neutral-900 sm:text-[40px]">
          Questions people ask before starting.
        </h2>
      </div>
      <div className="border-t border-canvas-line">
        {questions.map(({ q, a }, index) => (
          <details key={q} open={index === 0} className="group border-b border-canvas-line">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-xs py-6 text-[18px] leading-6 text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
              {q}
              <ChevronDown
                className="size-5 shrink-0 text-neutral-500 transition-transform duration-300 group-open:rotate-180"
                strokeWidth={1.75}
                aria-hidden
              />
            </summary>
            <p className="max-w-[68ch] pb-7 text-[15px] leading-7 text-neutral-500">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
