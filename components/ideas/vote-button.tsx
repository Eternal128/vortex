"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { ArrowBigUp } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  ideaId: string;
  votes: number;
  hasVoted: boolean;
  /** Ideas still in review cannot be voted on yet. */
  disabled?: boolean;
}

/**
 * Upvote toggle. Optimistic: the count moves at once and rolls back if the server refuses. Signed-out
 * learners get Clerk's sign-in modal instead of a request.
 */
export function VoteButton({ ideaId, votes, hasVoted, disabled = false }: VoteButtonProps) {
  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  const [state, setState] = useState({ votes, hasVoted });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (disabled || isPending) return;
    if (!isSignedIn) {
      clerk.openSignIn();
      return;
    }

    const previous = state;
    setError(null);
    setState({
      votes: previous.votes + (previous.hasVoted ? -1 : 1),
      hasVoted: !previous.hasVoted,
    });

    startTransition(async () => {
      try {
        const response = await fetch(`/api/ideas/${encodeURIComponent(ideaId)}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        if (!response.ok) throw new Error();
        const data = (await response.json()) as { votes: number; hasVoted: boolean };
        setState({ votes: data.votes, hasVoted: data.hasVoted });
      } catch {
        setState(previous);
        setError("Vote not saved");
      }
    });
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={state.hasVoted}
        aria-label={state.hasVoted ? `Remove your vote (${state.votes})` : `Upvote (${state.votes})`}
        className={cn(
          "flex w-14 flex-col items-center gap-0.5 rounded-md border py-2.5 transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          state.hasVoted
            ? "border-neutral-900 bg-neutral-900 text-canvas"
            : "border-canvas-line bg-neutral-50 text-neutral-700 hover:border-neutral-300 hover:text-neutral-900",
          disabled && "cursor-not-allowed opacity-50 hover:border-canvas-line",
        )}
      >
        <ArrowBigUp className="size-5" strokeWidth={1.5} aria-hidden fill={state.hasVoted ? "currentColor" : "none"} />
        <span className="tabular font-mono text-[12px] leading-4">{state.votes}</span>
      </button>
      {error ? (
        <span role="status" className="mt-1 text-[11px] text-neutral-500">
          {error}
        </span>
      ) : null}
    </div>
  );
}
