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
      const res = await fetch("/auth/signout", {
        method: "POST",
        credentials: "same-origin",
        redirect: "manual",
      });

      // 303 → login (or fail URL). Opaque/0 also means the browser got a redirect.
      const redirected =
        res.type === "opaqueredirect" ||
        res.status === 0 ||
        (res.status >= 300 && res.status < 400);

      if (redirected || res.ok) {
        const location = res.headers.get("Location");
        window.location.assign(location || "/login");
        return;
      }

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
