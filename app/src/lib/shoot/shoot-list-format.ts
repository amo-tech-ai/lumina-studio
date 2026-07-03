/** Short card date — DC uses "Apr 12" from start_date. */
export function formatShootCardDate(start: string | null | undefined): string | null {
  if (!start) return null;
  return new Date(`${start}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
