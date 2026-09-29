import type { BlockContent, PostContent } from "@/sanity.types";

type Block = BlockContent[number];

/** The plain text of a Portable Text block, ignoring marks and non-span children. */
function blockText(block: Extract<Block, { _type: "block" }>) {
  return (block.children ?? [])
    .map((child) => (typeof child.text === "string" ? child.text : ""))
    .join("")
    .trim();
}

/**
 * The first body paragraph of a Portable Text field, used where a document has no summary field of
 * its own. Returns null when there is no prose to show.
 */
export function firstParagraph(blocks: BlockContent | null | undefined) {
  if (!blocks) return null;

  for (const block of blocks) {
    if (block._type !== "block" || block.style !== "normal" || block.listItem) continue;
    const text = blockText(block);
    if (text) return text;
  }

  return null;
}

/**
 * Splits the lead paragraph off a Portable Text field: the lesson page shows it as the summary
 * under the title, so the body must not repeat it.
 */
export function splitLeadParagraph(blocks: BlockContent | null | undefined) {
  const lead = firstParagraph(blocks);
  if (!blocks || !lead) return { lead: null, rest: blocks ?? null };

  const index = blocks.findIndex(
    (block) =>
      block._type === "block" &&
      block.style === "normal" &&
      !block.listItem &&
      blockText(block) === lead,
  );

  const rest = index < 0 ? blocks : [...blocks.slice(0, index), ...blocks.slice(index + 1)];
  return { lead, rest: rest.length > 0 ? rest : null };
}

/** Truncates to a whole word, for metadata descriptions. */
export function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  const clipped = text.slice(0, maxLength);
  return `${clipped.slice(0, clipped.lastIndexOf(" "))}…`;
}

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "section"
  );
}

/**
 * The h2 outline of a Portable Text field, with stable, unique anchor ids. Keyed by block `_key`
 * so the renderer and the "On this page" list agree on every id.
 */
export function headingOutline(blocks: BlockContent | PostContent | null | undefined) {
  const seen = new Map<string, number>();
  const items: { key: string; id: string; text: string }[] = [];

  for (const block of blocks ?? []) {
    if (block._type !== "block" || block.style !== "h2") continue;
    const text = blockText(block);
    if (!text) continue;
    const base = slugify(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    items.push({ key: block._key, id: count ? `${base}-${count + 1}` : base, text });
  }

  return items;
}
