import { Map, Newspaper, Wrench, type LucideIcon } from "lucide-react";
import { blogHref, roadmapHref, toolsHref } from "@/lib/routes";

export interface ExploreItem {
  label: string;
  href: string;
  Icon: LucideIcon;
}

/**
 * The Explore dropdown's destinations. A plain module, not the client menu, so server components
 * (the header's mobile menu, the navbar's active state) can read it too.
 */
export const exploreItems: ExploreItem[] = [
  { label: "Blog", href: blogHref, Icon: Newspaper },
  { label: "Roadmap", href: roadmapHref, Icon: Map },
  { label: "Tools", href: toolsHref, Icon: Wrench },
];
