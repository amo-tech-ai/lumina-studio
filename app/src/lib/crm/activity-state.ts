export type TaskState = "done" | "overdue" | "upcoming" | null;

/** Task-type activities derive their state from due_at/completed_at — there is no stored status column. */
export function deriveTaskState(
  dueAt: string | null,
  completedAt: string | null,
  now: Date = new Date(),
): TaskState {
  if (completedAt) return "done";
  if (!dueAt) return null;
  return new Date(dueAt) < now ? "overdue" : "upcoming";
}
