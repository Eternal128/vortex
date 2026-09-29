import { PortableText, type PortableTextComponents } from "@portabletext/react";
import Image from "next/image";
import type { BlockContent } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";

/** Article prose at the reference's reading size: 18px body, generous leading, tight headings. */
function components(anchors: Map<string, string>): PortableTextComponents {
  return {
    block: {
      normal: ({ children }) => (
        <p className="text-[17px] leading-[1.8] text-neutral-700 sm:text-[18px]">{children}</p>
      ),
      h2: ({ children, value }) => (
        <h2
          id={value._key ? anchors.get(value._key) : undefined}
          className="mt-8 scroll-mt-24 text-[24px] leading-8 font-semibold tracking-[-0.03em] text-neutral-900"
        >
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="mt-4 text-[19px] leading-7 font-semibold tracking-[-0.02em] text-neutral-900">
          {children}
        </h3>
      ),
      h4: ({ children }) => (
        <h4 className="mt-2 text-[17px] leading-7 font-semibold text-neutral-900">{children}</h4>
      ),
      blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-brand-500 pl-5 text-[18px] leading-8 text-neutral-900">
          {children}
        </blockquote>
      ),
    },
    list: {
      bullet: ({ children }) => (
        <ul className="list-disc space-y-2 pl-6 text-[17px] leading-[1.8] text-neutral-700 marker:text-neutral-500 sm:text-[18px]">
          {children}
        </ul>
      ),
      number: ({ children }) => (
        <ol className="list-decimal space-y-2 pl-6 text-[17px] leading-[1.8] text-neutral-700 marker:font-mono marker:text-neutral-500 sm:text-[18px]">
          {children}
        </ol>
      ),
    },
    marks: {
      strong: ({ children }) => <strong className="font-semibold text-neutral-900">{children}</strong>,
      em: ({ children }) => <em className="italic">{children}</em>,
      code: ({ children }) => (
        <code className="rounded-xs bg-neutral-100 px-1.5 py-0.5 font-mono text-[0.88em] text-neutral-900">
          {children}
        </code>
      ),
      link: ({ children, value }) => {
        const href = typeof value?.href === "string" ? value.href : null;
        // The schema already allows only http(s); anything else renders as plain text.
        if (!href || !/^https?:\/\//i.test(href)) return <>{children}</>;
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xs font-medium text-neutral-900 underline decoration-neutral-400 underline-offset-4 transition-colors hover:decoration-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {children}
            <span aria-hidden className="ml-0.5 text-[0.8em] text-neutral-500">
              ↗
            </span>
          </a>
        );
      },
    },
    types: {
      image: ({ value }) => {
        if (!value?.asset) return null;
        return (
          <figure className="my-4">
            <Image
              src={urlFor(value).width(1600).fit("max").url()}
              alt={typeof value.alt === "string" ? value.alt : ""}
              width={1600}
              height={900}
              className="h-auto w-full rounded-lg border border-canvas-line"
            />
          </figure>
        );
      },
    },
  };
}

export function PostBody({ body, anchors }: { body: BlockContent; anchors: Map<string, string> }) {
  return (
    <div className="flex flex-col gap-6">
      <PortableText value={body} components={components(anchors)} />
    </div>
  );
}
