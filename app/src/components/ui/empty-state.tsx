import type { ReactNode } from "react";

import styles from "./empty-state.module.css";

/** Generic empty state — ported from EmptyState.dc.html (RF-A7b). Domain-free:
 *  the caller supplies copy plus optional visual (icon OR preview fan), CTA, and
 *  AI hint. Required by EntityList and every list template (RF-02 follow-on).
 *
 *  Server-safe (no interactivity) — the CTA is passed in as a node, so a caller
 *  can hand it a <Link>, a client button, etc. */
type Props = {
  heading: string;
  body?: string;
  /** Icon variant — rendered inside the 64px muted circle. Mutually exclusive with `preview`. */
  icon?: ReactNode;
  /** Preview-fan variant — caller passes the tilted photo nodes. Wins over `icon` if both set. */
  preview?: ReactNode;
  /** CTA slot (e.g. a <Link> or client button). */
  action?: ReactNode;
  /** Optional AI-suggestion line under the CTA. */
  hint?: string;
};

export function EmptyState({ heading, body, icon, preview, action, hint }: Props) {
  return (
    <div className={styles.root} data-testid="empty-state">
      {preview ? (
        <div className={styles.previewFan} aria-hidden>
          {preview}
        </div>
      ) : icon ? (
        <div className={styles.iconCircle} aria-hidden>
          {icon}
        </div>
      ) : null}
      <h2 className={styles.heading}>{heading}</h2>
      {body ? <p className={styles.body}>{body}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}
