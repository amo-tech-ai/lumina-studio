"use client";

// IPI-725 · AUTH-UI-001 — Operator Sign Out.
// Navigates to /auth/signout so Supabase SSR cookies clear on the server
// (same session the login form established). No new auth architecture.

import { useState } from "react";

import styles from "./nav-sidebar.module.css";

type Props = {
  /** Show the "Sign out" text next to the icon (expanded nav / mobile bar). */
  showLabel?: boolean;
};

/** Module lock — survives re-renders and multiple SignOutButton instances. */
let signingOut = false;

export function SignOutButton({ showLabel = false }: Props) {
  const [busy, setBusy] = useState(false);

  function handleSignOut() {
    if (signingOut) return;
    signingOut = true;
    setBusy(true);
    // Full navigation clears CopilotKit in-memory state and hits the server route.
    window.location.assign("/auth/signout");
  }

  return (
    <button
      type="button"
      className={`${styles.item} ${styles.signOutItem}`}
      onClick={handleSignOut}
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
  );
}

/** Test-only — reset module lock between unit tests. */
export function __resetSignOutLockForTests() {
  signingOut = false;
}
