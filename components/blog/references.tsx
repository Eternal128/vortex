interface Citation {
  _key: string;
  authors: string | null;
  year: number | null;
  title: string | null;
  venue: string | null;
  url: string | null;
}

/** The numbered source list at the end of a field note. Links open the publisher or DOI page. */
export function References({ items }: { items: Citation[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="references" className="mt-16 border-t border-canvas-line pt-10">
      <h2 id="references" className="eyebrow text-neutral-500">
        References
      </h2>
      <ol className="mt-6 flex list-none flex-col gap-4">
        {items.map((item, index) => {
          const safeUrl = item.url && /^https:\/\//i.test(item.url) ? item.url : null;
          return (
            <li key={item._key} className="flex gap-4 text-[15px] leading-6 text-neutral-700">
              <span className="w-6 shrink-0 font-mono text-[12px] leading-6 text-neutral-500 tabular">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                {item.authors} ({item.year}).{" "}
                {safeUrl ? (
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
                  >
                    {item.title}
                  </a>
                ) : (
                  <span className="text-neutral-900">{item.title}</span>
                )}
                .{item.venue ? <em className="not-italic text-neutral-500"> {item.venue}.</em> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
