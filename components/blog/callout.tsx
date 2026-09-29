import { AlertTriangle, Lightbulb } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const LABELS = { takeaway: "Takeaway", vortex: "In Vortex", caveat: "Caveat" } as const;

/** A boxed aside in a field note: the takeaway, how Vortex applies it, or a caveat. */
export function Callout({ tone, text }: { tone?: string | null; text?: string | null }) {
  if (!text) return null;
  const key = tone === "vortex" || tone === "caveat" ? tone : "takeaway";
  return (
    <aside
      className={cn(
        "my-2 flex gap-4 rounded-lg border p-5",
        key === "caveat" ? "border-brand-500/40 bg-brand-100" : "border-canvas-line bg-surface shadow-sm",
      )}
    >
      <span className="mt-0.5 shrink-0">
        {key === "vortex" ? (
          <LogoMark size={20} />
        ) : key === "caveat" ? (
          <AlertTriangle className="size-5 text-brand-600" strokeWidth={1.75} aria-hidden />
        ) : (
          <Lightbulb className="size-5 text-neutral-900" strokeWidth={1.75} aria-hidden />
        )}
      </span>
      <div>
        <p className="eyebrow text-neutral-500">{LABELS[key]}</p>
        <p className="mt-2 text-[16px] leading-7 text-neutral-900">{text}</p>
      </div>
    </aside>
  );
}
