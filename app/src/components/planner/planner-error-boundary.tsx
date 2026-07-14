"use client";

// IPI-536 — shared error boundary for all 4 Planner route stubs. First
// error.tsx in the repo (no prior convention existed to follow) — kept
// deliberately minimal per the App Router contract (client component,
// error + reset props, a retry button).
//
// A segment-level error.tsx intercepts before global-error.tsx ever sees the
// error, so it needs its own Sentry.captureException — otherwise a real
// failure (the whole point of the P1/error-swallowing fixes this ticket
// shipped) throws correctly but is invisible in Sentry (found by
// silent-failure-hunter, PR #347 review). Mirrors app/src/app/global-error.tsx.
// Raw error.message isn't rendered to the user for the same reason: a thrown
// Postgres/Supabase error can carry driver-internal text — logged to Sentry,
// shown to the user as a generic message only.

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export function PlannerErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }} role="alert">
      <h1>Something went wrong</h1>
      <p>Please try again in a moment.</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
