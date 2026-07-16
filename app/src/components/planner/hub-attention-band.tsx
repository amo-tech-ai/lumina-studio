// IPI-526 — page-scoped attention band. Summarizes at-risk plans on the
// *current returned page only* (Slice A has no portfolio-wide risk query) —
// copy must say "On this page" per the resolved design decision.

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import type { PlannerInstanceSummary } from "@/lib/planner/queries";

import styles from "./hub-workspace.module.css";

type Props = { atRiskItems: PlannerInstanceSummary[] };

export function HubAttentionBand({ atRiskItems }: Props) {
  if (atRiskItems.length === 0) return null;

  const headline =
    atRiskItems.length === 1
      ? "On this page: 1 plan needs attention"
      : `On this page: ${atRiskItems.length} plans need attention`;

  return (
    <div className={styles.attentionBand} data-testid="hub-attention-band">
      <AlertTriangle size={18} aria-hidden className={styles.attentionIcon} />
      <div className={styles.attentionBody}>
        <p className={styles.attentionHeadline}>{headline}</p>
        <div className={styles.attentionLinks}>
          {atRiskItems.slice(0, 3).map((item) => (
            <Link
              key={item.id}
              href={`/app/planner/${item.id}`}
              className={styles.attentionChip}
              aria-label={`Open ${item.name} planner`}
            >
              {item.name}
            </Link>
          ))}
          {atRiskItems.length > 3 ? (
            <span className={styles.attentionMore}>+{atRiskItems.length - 3} more</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
