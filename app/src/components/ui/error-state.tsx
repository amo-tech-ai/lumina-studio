"use client";

import { TriangleAlert } from "lucide-react";

import styles from "./error-state.module.css";

/** Generic error state with an optional retry action (RF-A7b). Required by
 *  EntityList and every list template.
 *
 *  Client component: `onRetry` should re-run the server fetch — pass
 *  `() => router.refresh()`, never a <Link> to the current route (a no-op). */
type Props = {
  message: string;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorState({
  message,
  title = "Something went wrong",
  onRetry,
  retryLabel = "Try again",
}: Props) {
  return (
    <div className={styles.root} role="alert" data-testid="error-state">
      <TriangleAlert size={28} strokeWidth={1.7} className={styles.icon} aria-hidden />
      <p className={styles.title}>{title}</p>
      <p className={styles.message}>{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className={styles.retry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
