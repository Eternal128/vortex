import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/blog/post-card";
import { ClipboardArt } from "@/components/illustrations/line-art";
import { PageFrame } from "@/components/layout/page-frame";
import { SiteHeader } from "@/components/layout/site-header";
import { container } from "@/lib/layout";
import { TOPIC_PARAM, blogHref, blogIndexHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import { POSTS_LIST_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "Field notes",
  description: "Short, precise articles from Vortex instructors. One idea at a time.",
};

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const posts = await sanityFetch({
    query: POSTS_LIST_QUERY,
    tags: [CACHE_TAGS.post, CACHE_TAGS.category],
  });

  // Topics come from the notes themselves, so a filter never leads to an empty page.
  const topics = new Map<string, { title: string; count: number }>();
  for (const post of posts) {
    const slug = post.topic?.slug;
    if (!slug) continue;
    const entry = topics.get(slug) ?? { title: post.topic?.title ?? slug, count: 0 };
    entry.count += 1;
    topics.set(slug, entry);
  }

  const raw = (await searchParams)[TOPIC_PARAM];
  const requested = Array.isArray(raw) ? raw[0] : raw;
  const active = requested && topics.has(requested) ? requested : null;
  const visible = active ? posts.filter((post) => post.topic?.slug === active) : posts;

  const chip = (selected: boolean) =>
    cn(
      "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[14px] leading-5 transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
      selected ? "bg-neutral-200/70 font-medium text-neutral-900" : "text-neutral-500 hover:text-neutral-900",
    );

  return (
    <PageFrame header={<SiteHeader activeHref={blogHref} />}>

      <main id="main" className={cn(container, "flex flex-1 flex-col pt-16 pb-24")}>
        <div className="flex items-end justify-between gap-8">
          <div>
            <p className="eyebrow text-neutral-500">Field notes</p>
            <h1 className="mt-3 max-w-[16ch] text-[40px] leading-[1.02] font-semibold tracking-[-0.05em] text-balance text-neutral-900 sm:text-[56px]">
              One idea at a time.
            </h1>
            <p className="mt-5 max-w-[52ch] text-[16px] leading-7 text-neutral-500">
              Short, precise articles from the instructors, each tied to the course it belongs to.
            </p>
          </div>
          <ClipboardArt className="hidden w-44 shrink-0 text-neutral-900 md:block" />
        </div>

        {topics.size > 1 ? (
          <nav aria-label="Filter by topic" className="mt-10">
            <ul className="flex flex-wrap gap-1">
              <li>
                <Link href={blogIndexHref()} aria-current={!active ? "page" : undefined} className={chip(!active)}>
                  All
                  <span className="tabular font-mono text-[12px] text-neutral-500">{posts.length}</span>
                </Link>
              </li>
              {[...topics].map(([slug, { title, count }]) => (
                <li key={slug}>
                  <Link
                    href={blogIndexHref(slug)}
                    aria-current={active === slug ? "page" : undefined}
                    className={chip(active === slug)}
                  >
                    {title}
                    <span className="tabular font-mono text-[12px] text-neutral-500">{count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {visible.length > 0 ? (
          <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((post) => (
              <li key={post._id}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-10 rounded-lg border border-dashed border-neutral-300 px-6 py-16 text-center">
            <p className="text-[17px] font-medium text-neutral-900">No field notes published yet.</p>
            <p className="mt-2 text-[14px] text-neutral-500">
              Notes published in the Studio appear here as soon as they go live.
            </p>
          </div>
        )}
      </main>
    </PageFrame>
  );
}
