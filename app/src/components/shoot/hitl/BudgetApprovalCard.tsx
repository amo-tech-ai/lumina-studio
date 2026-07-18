"use client";

// IPI-150 SHOOT-AI-003 — Gate 3 approval card
// IPI-304 — renders through the shared ApprovalCardShell/ApprovalHeader;
// no ApprovalActions (this card has no approve/reject UI today).

import styles from "@/components/shoot/shoot-wizard.module.css";
import { ApprovalCardShell, ApprovalHeader } from "@/components/approval-card";

type Budget = { crew: number; studio: number; equipment: number; post: number; total: number };

const LINES: [keyof Budget, string][] = [
  ["crew", "Crew"],
  ["studio", "Studio / location"],
  ["equipment", "Equipment"],
  ["post", "Post-production"],
];

interface Props {
  budget: Budget;
  override: string;
  onOverrideChange: (val: string) => void;
}

export function BudgetApprovalCard({ budget, override, onOverrideChange }: Props) {
  const overrideActive = !!override && Number.isFinite(Number(override)) && Number(override) > 0;
  const displayTotal = overrideActive ? Number(override) : budget.total;

  return (
    <ApprovalCardShell className={styles.card}>
      <ApprovalHeader
        className={styles.cardHeader}
        title="Budget estimate"
        titleClassName={styles.cardTitle}
        right={overrideActive ? <span className={styles.cardNote}>Override active</span> : undefined}
      />

      <div className={styles.budgetLines}>
        {LINES.map(([key, label]) => (
          <div key={key} className={styles.budgetRow}>
            <span className={styles.budgetLabel}>{label}</span>
            <span className={styles.budgetValue}>${budget[key].toLocaleString()}</span>
          </div>
        ))}

        <div className={styles.budgetRow}>
          <span className={styles.budgetTotal}>Total</span>
          <span className={styles.budgetTotal}>${displayTotal.toLocaleString()}</span>
        </div>
      </div>

      <div className={styles.budgetOverride}>
        <label className={styles.label} htmlFor="budget-override">Override total (optional)</label>
        <div className={styles.overrideRow}>
          <span className={styles.budgetLabel}>$</span>
          <input
            id="budget-override"
            type="number"
            placeholder={String(budget.total)}
            value={override}
            onChange={(e) => onOverrideChange(e.target.value)}
            className={styles.overrideInput}
          />
        </div>
      </div>
    </ApprovalCardShell>
  );
}
