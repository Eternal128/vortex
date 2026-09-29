/** A centred mono label between two squiggle rules: `RELATED NOTES`, `CONTINUE LEARNING`. */
export function DividerLabel({ children, id }: { children: string; id?: string }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="squiggle w-28" aria-hidden />
      <h2 id={id} className="eyebrow shrink-0 text-neutral-500">
        {children}
      </h2>
      <span className="squiggle w-28" aria-hidden />
    </div>
  );
}
