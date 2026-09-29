import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTracker } from "@/components/analytics/view-tracker";
import { DividerLabel } from "@/components/blog/divider-label";
import { PostBody } from "@/components/blog/post-body";
import { PostCard } from "@/components/blog/post-card";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { PageFrame } from "@/components/layout/page-frame";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonClasses } from "@/components/ui/button";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { formatDate, formatReadingTime } from "@/lib/format";
import { container } from "@/lib/layout";
import { headingOutline } from "@/lib/portable-text";
import { blogHref, courseHref, instructorHref, searchPageHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { CACHE_TAGS, sanityFetch } from "@/sanity/lib/fetch";
import { POST_BY_SLUG_QUERY, POST_SLUGS_QUERY } from "@/sanity/lib/queries";

const tags = [CACHE_TAGS.post, CACHE_TAGS.course, CACHE_TAGS.instructor, CACHE_TAGS.category];

async function getPost(slug: string) {
  return sanityFetch({ query: POST_BY_SLUG_QUERY, params: { slug }, tags });
}

export async function generateStaticParams() {
  const posts = await sanityFetch({ query: POST_SLUGS_QUERY, tags: [CACHE_TAGS.post] });
  return posts.filter((post) => post.slug !== null).map((post) => ({ slug: post.slug as string }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title ?? "Field note",
    description: post.excerpt ?? undefined,
    openGraph: { type: "article", publishedTime: post.publishedAt ?? undefined },
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const outline = headingOutline(post.body);
  const anchors = new Map(outline.map((item) => [item.key, item.id]));
  const related = post.related ?? [];
  const course = post.relatedCourse;
  const meta = [formatDate(post.publishedAt), post.topic?.title].filter(Boolean);
  const byline = [post.author?.name ? `By ${post.author.name}` : null, formatReadingTime(post.wordCount)].filter(Boolean);

  return (
    <PageFrame>
      <SiteHeader activeHref={blogHref} />

      <ViewTracker
        event={ANALYTICS_EVENTS.blogPostViewed}
        viewKey={slug}
        properties={{ post_slug: slug, topic: post.topic?.slug ?? null }}
      />

      <main id="main" className={cn(container, "flex flex-1 flex-col pt-12 pb-24")}>
        <Link
          href={blogHref}
          className="inline-flex w-fit items-center gap-2 rounded-xs text-[14px] text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
          All field notes
        </Link>

        <header className="mx-auto mt-12 flex max-w-3xl flex-col items-center text-center">
          {meta.length > 0 ? (
            <p className="font-mono text-[13px] text-neutral-500">{meta.join("  ·  ")}</p>
          ) : null}
          <h1 className="mt-6 text-[36px] leading-[1.05] font-semibold tracking-[-0.05em] text-balance text-neutral-900 sm:text-[52px]">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mt-6 max-w-[58ch] text-[17px] leading-8 text-balance text-neutral-500 sm:text-[18px]">
              {post.excerpt}
            </p>
          ) : null}
          {byline.length > 0 ? (
            <p className="mt-6 font-mono text-[13px] text-neutral-500">
              {post.author?.slug ? (
                <>
                  By{" "}
                  <Link
                    href={instructorHref(post.author.slug)}
                    className="text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
                  >
                    {post.author.name}
                  </Link>
                  {formatReadingTime(post.wordCount) ? ` · ${formatReadingTime(post.wordCount)}` : null}
                </>
              ) : (
                byline.join(" · ")
              )}
            </p>
          ) : null}
        </header>

        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
          <article className="min-w-0">
            {post.body ? <PostBody body={post.body} anchors={anchors} /> : null}
          </article>
          {outline.length > 1 ? (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <TableOfContents items={outline.map(({ id, text }) => ({ id, text }))} />
              </div>
            </aside>
          ) : null}
        </div>

        {related.length > 0 ? (
          <section aria-labelledby="related-notes" className="mt-24">
            <DividerLabel id="related-notes">Related notes</DividerLabel>
            <ul className="mt-10 grid gap-5 md:grid-cols-3">
              {related.map((note) => (
                <li key={note._id}>
                  <PostCard post={note} variant="compact" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="continue-learning" className="mt-24">
          <DividerLabel id="continue-learning">Continue learning</DividerLabel>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {course?.slug ? (
              <div className="flex flex-col rounded-lg border border-canvas-line bg-surface p-7 shadow-sm">
                <p className="eyebrow text-neutral-500">{course.category?.title ?? "Course"}</p>
                <p className="mt-4 text-[22px] leading-7 font-semibold tracking-[-0.03em] text-neutral-900">
                  Put this idea into a structured path
                </p>
                <p className="mt-3 text-[15px] leading-6 text-neutral-500">
                  Continue into {course.title}.
                </p>
                <Link
                  href={courseHref(course.slug)}
                  className={buttonClasses({ size: "lg", className: "mt-8 w-fit" })}
                >
                  Open {course.title}
                  <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
                </Link>
              </div>
            ) : null}
            <div className="flex flex-col rounded-lg border border-canvas-line bg-surface p-7 shadow-sm">
              <p className="eyebrow text-neutral-500">Search</p>
              <p className="mt-4 text-[22px] leading-7 font-semibold tracking-[-0.03em] text-neutral-900">
                Find the exact moment it is taught
              </p>
              <p className="mt-3 text-[15px] leading-6 text-neutral-500">
                Ask in plain English and jump straight to the second in the lesson video.
              </p>
              <Link
                href={searchPageHref}
                className="mt-8 inline-flex w-fit items-center gap-1.5 rounded-xs font-mono text-[13px] text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                Open search <ArrowRight className="size-3.5" strokeWidth={2} aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PageFrame>
  );
}
