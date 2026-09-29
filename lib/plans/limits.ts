/** Plan goal length, shared by the composer, the `?goal=` handoff and the API schema. Client-safe. */
export const GOAL_MIN = 3;
export const GOAL_MAX = 300;

/** The plan builder's URL with a goal prefilled. */
export function newPlanHrefFor(goal: string) {
  const trimmed = goal.trim().slice(0, GOAL_MAX);
  return trimmed ? `/plans/new?goal=${encodeURIComponent(trimmed)}` : "/plans/new";
}
