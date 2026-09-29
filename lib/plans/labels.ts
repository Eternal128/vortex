/** Display labels for stored plan settings. Safe on client and server. */
export const LEVEL_LABELS: Record<string, string> = { new: "Beginner", some: "Intermediate", advanced: "Advanced" };
export const PACE_LABELS: Record<string, string> = { "15": "15 min a day", "30": "30 min a day", "60": "1 hour a day" };

export function planHref(key: string, lessonKey?: string) {
  return lessonKey ? `/plans/${key}/${lessonKey}` : `/plans/${key}`;
}
