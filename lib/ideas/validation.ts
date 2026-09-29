import { z } from "zod";
import {
  IDEA_DESCRIPTION_MAX,
  IDEA_DESCRIPTION_MIN,
  IDEA_KINDS,
  IDEA_MAX_LINKS,
  IDEA_TITLE_MAX,
  IDEA_TITLE_MIN,
} from "@/lib/ideas/constants";

/** Control characters other than tab and newline; invisible, and a common spam and spoofing trick. */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g;

function clean(value: string) {
  return value.replace(CONTROL_CHARS, "").replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function countLinks(value: string) {
  return (value.match(/https?:\/\/|www\./gi) ?? []).length;
}

/**
 * The only fields a learner controls. `strict()` rejects anything else, so a client cannot smuggle
 * in `status`, `moderation`, `origin` or an author. Text is stored and rendered as plain text.
 */
export const newIdeaSchema = z
  .object({
    title: z
      .string()
      .transform(clean)
      .pipe(z.string().min(IDEA_TITLE_MIN).max(IDEA_TITLE_MAX))
      .refine((v) => !v.includes("\n"), "The title must be a single line."),
    description: z
      .string()
      .transform(clean)
      .pipe(z.string().min(IDEA_DESCRIPTION_MIN).max(IDEA_DESCRIPTION_MAX)),
    kind: z.enum(IDEA_KINDS),
  })
  .strict()
  .refine(
    (idea) => countLinks(`${idea.title} ${idea.description}`) <= IDEA_MAX_LINKS,
    `Please include at most ${IDEA_MAX_LINKS} links.`,
  );

export type NewIdea = z.infer<typeof newIdeaSchema>;

/** Sanity document ids: letters, digits, dots, dashes, underscores. Anything else is not an idea. */
export const ideaIdSchema = z.string().regex(/^[A-Za-z0-9._-]{1,128}$/);
