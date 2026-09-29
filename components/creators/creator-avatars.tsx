import Image from "next/image";
import { Avatar } from "@/components/ui/avatar";
import type { Creator } from "@/lib/creators";
import { cn } from "@/lib/utils";

interface CreatorAvatarsProps {
  creators: readonly Creator[];
  /** How many faces to stack before stopping. */
  max?: number;
  /** Diameter in px. */
  size?: number;
  className?: string;
}

/** The real channels behind a course, as an overlapping stack of their YouTube avatars. */
export function CreatorAvatars({ creators, max = 3, size = 28, className }: CreatorAvatarsProps) {
  const shown = creators.slice(0, max);
  if (shown.length === 0) return null;
  return (
    <span className={cn("flex shrink-0", className)} aria-hidden>
      {shown.map((creator, index) => (
        <span
          key={creator.id}
          className="relative rounded-full ring-2 ring-surface"
          style={{ width: size, height: size, marginLeft: index ? -size * 0.3 : 0, zIndex: shown.length - index }}
        >
          {creator.avatar ? (
            <Image
              src={creator.avatar}
              alt=""
              width={size}
              height={size}
              className="size-full rounded-full object-cover"
            />
          ) : (
            <Avatar name={creator.name} size={size} />
          )}
        </span>
      ))}
    </span>
  );
}
