import { VoteButton } from "@/components/ideas/vote-button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format";

export interface BoardIdea {
  _id: string;
  title: string | null;
  description: string | null;
  kind: string | null;
  status: string | null;
  origin: string | null;
  moderation: string | null;
  authorName: string | null;
  createdAt: string | null;
  votes: number;
  hasVoted: boolean;
}

/**
 * One idea. Title and description are learner-written, so they render as plain React text only:
 * escaped, never parsed as HTML or markdown.
 */
export function IdeaCard({ idea }: { idea: BoardIdea }) {
  const inReview = idea.moderation === "pending";
  const when = formatRelativeTime(idea.createdAt);

  return (
    <article className="flex gap-5 rounded-lg border border-canvas-line bg-surface p-5 shadow-sm sm:p-6">
      <VoteButton ideaId={idea._id} votes={idea.votes} hasVoted={idea.hasVoted} disabled={inReview} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={idea.origin === "team" ? "ink" : "outline"}>
            {idea.origin === "team" ? "Team" : "Community"}
          </Badge>
          {inReview ? (
            <Badge variant="video">In review</Badge>
          ) : idea.status ? (
            <Badge variant="neutral">{idea.status}</Badge>
          ) : null}
          {idea.kind ? <Badge variant="neutral">{idea.kind}</Badge> : null}
          <span className="font-mono text-[12px] text-neutral-500">
            {[when, idea.authorName].filter(Boolean).join(" · ")}
          </span>
        </div>

        <h3 className="mt-3 text-[18px] leading-6 font-medium tracking-[-0.02em] break-words text-neutral-900">
          {idea.title}
        </h3>
        {idea.description ? (
          <p className="mt-2 text-[14px] leading-6 break-words whitespace-pre-line text-neutral-500">
            {idea.description}
          </p>
        ) : null}
        {inReview ? (
          <p className="mt-3 text-[12px] text-neutral-500">
            Only you can see this until the team reviews it.
          </p>
        ) : null}
      </div>
    </article>
  );
}
