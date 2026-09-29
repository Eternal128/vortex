import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { IdeaCard, type BoardIdea } from "@/components/ideas/idea-card";
import { PostIdeaDialog } from "@/components/ideas/post-idea-dialog";
import { SproutArt } from "@/components/illustrations/line-art";
import { PageFrame } from "@/components/layout/page-frame";
import { SiteHeader } from "@/components/layout/site-header";
import {
  IDEA_SORT_PARAM,
  IDEA_STATUS_PARAM,
  IDEA_STATUSES,
  type IdeaSort,
  type IdeaStatus,
} from "@/lib/ideas/constants";
import { container } from "@/lib/layout";
import { ideasHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { sanityFetch } from "@/sanity/lib/fetch";
import { IDEAS_BOARD_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "Ideas",
  description: "Suggest features and courses for Vortex, and vote on what gets built next.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function boardHref(sort: IdeaSort, status: IdeaStatus | null) {
  const params = new URLSearchParams();
  if (sort !== "top") params.set(IDEA_SORT_PARAM, sort);
  if (status) params.set(IDEA_STATUS_PARAM, status);
  const query = params.toString();
  return query ? `${ideasHref}?${query}` : ideasHref;
}

export default async function IdeasPage({ searchParams }: PageProps<"/ideas">) {
  const params = await searchParams;
  const sort: IdeaSort = first(params[IDEA_SORT_PARAM]) === "new" ? "new" : "top";
  const rawStatus = first(params[IDEA_STATUS_PARAM]);
  const status = IDEA_STATUSES.find((s) => s === rawStatus) ?? null;

  const { userId } = await auth();

  // Not cached: votes change constantly, and the result depends on who is looking.
  const ideas = (await sanityFetch({
    query: IDEAS_BOARD_QUERY,
    params: { userId: userId ?? "" },
    revalidate: 0,
  })) as BoardIdea[];

  const mine = ideas.filter((idea) => idea.moderation === "pending");
  const approved = ideas.filter((idea) => idea.moderation === "approved");

  const counts = {
    all: approved.length,
    open: approved.filter((i) => i.status === "open").length,
    planned: approved.filter((i) => i.status === "planned").length,
    shipped: approved.filter((i) => i.status === "shipped").length,
  };

  const visible = approved
    .filter((idea) => !status || idea.status === status)
    .sort((a, b) =>
      sort === "new"
        ? (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
        : b.votes - a.votes || (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
    );

  const tab = (active: boolean) =>
    cn(
      "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[14px] leading-5 transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
      active ? "bg-neutral-200/70 font-medium text-neutral-900" : "text-neutral-500 hover:text-neutral-900",
    );

  const statusTabs: { label: string; value: IdeaStatus | null; count: number }[] = [
    { label: "All", value: null, count: counts.all },
    { label: "Open", value: "open", count: counts.open },
    { label: "Planned", value: "planned", count: counts.planned },
    { label: "Shipped", value: "shipped", count: counts.shipped },
  ];

  return (
    <PageFrame>
      <SiteHeader activeHref={ideasHref} />

      <main id="main" className={cn(container, "flex max-w-200 flex-1 flex-col pt-16 pb-24")}>
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="eyebrow text-neutral-500">Feature requests</p>
            <h1 className="mt-3 text-[40px] leading-none font-semibold tracking-[-0.05em] text-neutral-900 sm:text-[48px]">
              Ideas
            </h1>
            <p className="mt-4 max-w-[46ch] text-[16px] leading-7 text-neutral-500">
              Suggest features, courses and improvements, and vote on what we build next.
            </p>
          </div>
          <SproutArt className="hidden w-36 shrink-0 text-neutral-900 sm:block" />
        </div>

        <div className="squiggle mt-10 w-60" aria-hidden />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Sort ideas" className="flex gap-1">
            <Link href={boardHref("top", status)} aria-current={sort === "top" ? "page" : undefined} className={tab(sort === "top")}>
              Top
            </Link>
            <Link href={boardHref("new", status)} aria-current={sort === "new" ? "page" : undefined} className={tab(sort === "new")}>
              New
            </Link>
          </nav>
          <nav aria-label="Filter ideas by status" className="flex flex-wrap gap-1">
            {statusTabs.map(({ label, value, count }) => (
              <Link
                key={label}
                href={boardHref(sort, value)}
                aria-current={status === value ? "page" : undefined}
                className={tab(status === value)}
              >
                {label}
                <span className="tabular font-mono text-[12px] text-neutral-500">{count}</span>
              </Link>
            ))}
          </nav>
          <PostIdeaDialog />
        </div>

        {mine.length > 0 ? (
          <section aria-labelledby="your-ideas" className="mt-8">
            <h2 id="your-ideas" className="eyebrow text-neutral-500">
              Your ideas in review
            </h2>
            <ul className="mt-3 flex flex-col gap-3">
              {mine.map((idea) => (
                <li key={idea._id}>
                  <IdeaCard idea={idea} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-label="Ideas" className="mt-8">
          {visible.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {visible.map((idea) => (
                <li key={idea._id}>
                  <IdeaCard idea={idea} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-neutral-300 px-6 py-14 text-center">
              <p className="text-[17px] font-medium text-neutral-900">No ideas here yet.</p>
              <p className="mt-2 text-[14px] text-neutral-500">Be the first to suggest one.</p>
            </div>
          )}
        </section>
      </main>
    </PageFrame>
  );
}
