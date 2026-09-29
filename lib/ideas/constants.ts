/** Shared between the server routes and the client form, so both enforce the same limits. */

export const IDEA_KINDS = ["feature", "content", "improvement"] as const;
export type IdeaKind = (typeof IDEA_KINDS)[number];

export const IDEA_STATUSES = ["open", "planned", "shipped"] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

export const IDEA_TITLE_MIN = 8;
export const IDEA_TITLE_MAX = 90;
export const IDEA_DESCRIPTION_MIN = 20;
export const IDEA_DESCRIPTION_MAX = 600;

/** How many ideas one learner may submit in a rolling 24 hours. */
export const IDEAS_PER_DAY = 3;

/** More links than this reads as spam, not an idea. */
export const IDEA_MAX_LINKS = 2;

export const IDEA_SORT_PARAM = "sort";
export const IDEA_STATUS_PARAM = "status";
export type IdeaSort = "top" | "new";
