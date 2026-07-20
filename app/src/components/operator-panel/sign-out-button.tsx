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

function unlockSignOut() {
  signingOut = false;
}

export function SignOutButton({ showLabel = false }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (signingOut) return;

    signingOut = true;
    setBusy(true);

    try {
      // Follow redirects (default). Do NOT use redirect:"manual" — same-origin
      // manual redirects become opaqueredirect with no readable Location header,
      // which forced a /login fallback and masked /app?signoutError=1 failures.
      const res = await fetch("/auth/signout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (res.redirected && res.url) {
        window.location.assign(res.url);
        return;
      }

      // Unexpected non-redirect response — allow retry; do not fake success.
      unlockSignOut();
      setBusy(false);
    } catch {
      // Network failure — allow retry without a full page refresh.
      unlockSignOut();
      setBusy(false);
    }
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
  unlockSignOut();
}
