import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDate, formatReadingTime } from "@/lib/format";
import { postHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: {
    title: string | null;
    slug: string | null;
    excerpt?: string | null;
    publishedAt?: string | null;
    wordCount?: number | null;
    topic?: { title: string | null } | null;
  };
  /** `compact` is the related-notes card: topic, title and the link only. */
  variant?: "full" | "compact";
  className?: string;
}

/** The reference's note card: mono topic, a tight title, and a mono "Read article →". */
export function PostCard({ post, variant = "full", className }: PostCardProps) {
  if (!post.slug) return null;
  const meta = [formatDate(post.publishedAt), formatReadingTime(post.wordCount)].filter(Boolean);

  return (
    <Link
      href={postHref(post.slug)}
      className={cn(
        "group flex h-full flex-col rounded-lg border border-canvas-line bg-surface p-6 shadow-sm transition-[box-shadow,transform] duration-300 ease-out-soft",
        "hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {post.topic?.title ? <p className="eyebrow text-neutral-500">{post.topic.title}</p> : null}
      <h3
        className={cn(
          "mt-4 font-semibold tracking-[-0.03em] text-balance text-neutral-900",
          variant === "full" ? "text-[22px] leading-7" : "text-[18px] leading-6",
        )}
      >
        {post.title}
      </h3>
      {variant === "full" && post.excerpt ? (
        <p className="mt-3 line-clamp-3 text-[15px] leading-6 text-neutral-500">{post.excerpt}</p>
      ) : null}
      <div className="mt-auto flex items-center justify-between gap-4 pt-8">
        <span className="inline-flex items-center gap-1.5 font-mono text-[13px] text-neutral-500 transition-colors group-hover:text-neutral-900">
          Read article
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} aria-hidden />
        </span>
        {variant === "full" && meta.length > 0 ? (
          <span className="font-mono text-[12px] text-neutral-500">{meta.join(" · ")}</span>
        ) : null}
      </div>
    </Link>
  );
}
