"use client";

// IPI-536 — shared error boundary for all 4 Planner route stubs. First
// error.tsx in the repo (no prior convention existed to follow) — kept
// deliberately minimal per the App Router contract (client component,
// error + reset props, a retry button).

export function PlannerErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }} role="alert">
      <h1>Something went wrong</h1>
      <p>{error.message || "An unexpected error occurred."}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
