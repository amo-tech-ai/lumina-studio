"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function OperatorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Operator route error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
        Something went wrong
      </p>
      <h1 className="mb-3 text-3xl font-light">Unexpected Error</h1>
      <p className="mb-2 max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
        An unexpected error occurred. Try again or return to the dashboard.
      </p>
      {error.digest && (
        <p className="mb-8 max-w-md text-xs text-[var(--color-muted)] opacity-60">
          Error digest: {error.digest}
        </p>
      )}
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="rounded-[var(--radius-md)] bg-[var(--color-text)] px-6 py-3 text-sm font-medium text-[var(--color-bg)] transition-opacity hover:opacity-80"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-6 py-3 text-sm font-medium transition-opacity hover:opacity-80"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
