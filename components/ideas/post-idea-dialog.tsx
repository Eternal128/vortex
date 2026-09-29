"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  IDEA_DESCRIPTION_MAX,
  IDEA_DESCRIPTION_MIN,
  IDEA_KINDS,
  IDEA_TITLE_MAX,
  IDEA_TITLE_MIN,
} from "@/lib/ideas/constants";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-md border border-neutral-200 bg-surface px-3.5 py-2.5 text-[15px] text-neutral-900 shadow-press-soft placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none";

/** "+ Post an idea": a native modal dialog with a plain-text form that posts to `/api/ideas`. */
export function PostIdeaDialog() {
  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [descriptionLength, setDescriptionLength] = useState(0);

  function open() {
    if (!isSignedIn) {
      clerk.openSignIn();
      return;
    }
    setError(null);
    dialogRef.current?.showModal();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(data.get("title") ?? ""),
          description: String(data.get("description") ?? ""),
          kind: String(data.get("kind") ?? "feature"),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Something went wrong. Please try again.");
        return;
      }
      posthog.capture("idea_form_submitted");
      form.reset();
      setDescriptionLength(0);
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button type="button" size="lg" onClick={open}>
        <Plus className="size-4" strokeWidth={2} aria-hidden />
        Post an idea
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="post-idea-title"
        className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-xl border border-canvas-line bg-surface p-0 text-neutral-900 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-5 p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-neutral-500">Feature request</p>
              <h2 id="post-idea-title" className="mt-2 text-[24px] leading-7 font-semibold tracking-[-0.04em]">
                Post an idea
              </h2>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => dialogRef.current?.close()}
              className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <X className="size-4" strokeWidth={2} aria-hidden />
            </button>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-medium">Title</span>
            <input
              name="title"
              required
              minLength={IDEA_TITLE_MIN}
              maxLength={IDEA_TITLE_MAX}
              autoComplete="off"
              placeholder="A course on…"
              className={field}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="flex justify-between text-[13px] font-medium">
              What should it do, and why?
              <span className="tabular font-mono text-[11px] font-normal text-neutral-500">
                {descriptionLength}/{IDEA_DESCRIPTION_MAX}
              </span>
            </span>
            <textarea
              name="description"
              required
              rows={5}
              minLength={IDEA_DESCRIPTION_MIN}
              maxLength={IDEA_DESCRIPTION_MAX}
              onChange={(e) => setDescriptionLength(e.currentTarget.value.length)}
              className={cn(field, "resize-y")}
            />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[13px] font-medium">Kind</legend>
            <div className="flex flex-wrap gap-2">
              {IDEA_KINDS.map((kind, index) => (
                <label
                  key={kind}
                  className="cursor-pointer rounded-full border border-neutral-200 px-3.5 py-1.5 font-mono text-[12px] tracking-[0.06em] text-neutral-700 uppercase has-checked:border-neutral-900 has-checked:bg-neutral-900 has-checked:text-canvas has-focus-visible:ring-2 has-focus-visible:ring-primary-500"
                >
                  <input type="radio" name="kind" value={kind} defaultChecked={index === 0} className="sr-only" />
                  {kind}
                </label>
              ))}
            </div>
          </fieldset>

          <p className="text-[12px] leading-5 text-neutral-500">
            Ideas are reviewed by the team before they appear publicly. Plain text only; your first
            name and last initial are shown with it.
          </p>

          {error ? (
            <p role="alert" className="rounded-md bg-brand-100 px-3 py-2 text-[13px] text-brand-600">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="tertiary" size="md" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
            <Button type="submit" size="md" disabled={submitting}>
              {submitting ? "Posting…" : "Submit idea"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
