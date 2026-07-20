"use client";

// IPI-725 — Mount Sign out only when the left rail is CSS-hidden (≤768px),
// so desktop does not get a duplicate control / duplicate data-testid.

import { useEffect, useState } from "react";

import { SignOutButton } from "./sign-out-button";
import styles from "./operator-shell.module.css";

export function MobileSignOutBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setShow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!show) return null;

  return (
    <div className={styles.mobileAuthBar}>
      <SignOutButton showLabel />
    </div>
  );
}
