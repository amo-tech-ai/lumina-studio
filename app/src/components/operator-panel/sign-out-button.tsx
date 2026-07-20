"use client";

// IPI-725 · AUTH-UI-001 — Operator Sign Out.
// POSTs to /auth/signout (Supabase SSR cookie clear). No GET logout —
// avoids CSRF-via-navigation. No new auth architecture.

import { useState, type FormEvent } from "react";

import styles from "./nav-sidebar.module.css";

type Props = {
  /** Show the "Sign out" text next to the icon (expanded nav / mobile bar). */
  showLabel?: boolean;
};

/** Module lock — survives re-renders and multiple SignOutButton instances. */
let signingOut = false;

export function SignOutButton({ showLabel = false }: Props) {
  const [busy, setBusy] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (signingOut) {
      event.preventDefault();
      return;
    }
    signingOut = true;
    setBusy(true);
    // Native form POST navigates; server clears cookies and redirects.
  }

  return (
    <form
      action="/auth/signout"
      method="post"
      onSubmit={handleSubmit}
      className={styles.signOutForm}
    >
      <button
        type="submit"
        className={`${styles.item} ${styles.signOutItem}`}
        disabled={busy}
        data-testid="operator-sign-out"
        aria-label="Sign out"
        title="Sign out"
      >
        <span className={styles.icon} aria-hidden="true">
          ⎋
        </span>
        {showLabel && (
          <span className={styles.label}>{busy ? "Signing out…" : "Sign out"}</span>
        )}
      </button>
    </form>
  );
}

/** Test-only — reset module lock between unit tests. */
export function __resetSignOutLockForTests() {
  signingOut = false;
}
