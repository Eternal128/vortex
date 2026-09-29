import { VortexLoader } from "@/components/ui/vortex-loader";

/** Route fallback while a page's server data streams in. */
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center bg-canvas py-32">
      <VortexLoader label="Loading…" size={56} />
    </div>
  );
}
