"use client";

// IPI-725 — Sign out only when the left rail is CSS-hidden (≤768px).
// NavSidebar omits its SignOutButton in that case so data-testid stays unique.

import { SignOutButton } from "./sign-out-button";
import { useMobileRailHidden } from "./use-mobile-rail-hidden";
import styles from "./operator-shell.module.css";

export function MobileSignOutBar() {
  const railHidden = useMobileRailHidden();
  if (railHidden !== true) return null;

  return (
    <div className={styles.mobileAuthBar}>
      <SignOutButton showLabel />
    </div>
  );
}
