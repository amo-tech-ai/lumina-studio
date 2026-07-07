import { DollarSign } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney } from "@/lib/format";
import type { ShootDetailPayload } from "@/lib/shoot/get-shoot-detail";
import styles from "../shoot-detail.module.css";

type Props = {
  shoot: ShootDetailPayload["shoot"];
};

function pctColor(pct: number): string {
  if (pct > 100) return "var(--color-blocked)";
  if (pct >= 80) return "var(--color-warning-text)";
  return "var(--color-action)";
}

export function BudgetTab({ shoot }: Props) {
  const { estimated_budget, actual_cost, currency, budget_breakdown } = shoot;
  const lines = budget_breakdown ? Object.entries(budget_breakdown) : [];

  if (estimated_budget == null && actual_cost == null && lines.length === 0) {
    return (
      <EmptyState heading="No budget set yet" body="Estimated budget and line items will appear here." icon={<DollarSign />} />
    );
  }

  const pct =
    estimated_budget != null && estimated_budget > 0 && actual_cost != null
      ? Math.round((actual_cost / estimated_budget) * 100)
      : null;
  const color = pct != null ? pctColor(pct) : "var(--color-action)";

  return (
    <div>
      {estimated_budget != null || actual_cost != null ? (
        <div className={`${styles.card} ${styles.budgetCard}`}>
          <div className={styles.budgetTop}>
            <div>
              <div className={styles.budgetUsedLabel}>Budget used</div>
              <div className={styles.budgetAmount}>
                {formatMoney(actual_cost, currency)}
                {estimated_budget != null ? (
                  <span className={styles.budgetTotal}> / {formatMoney(estimated_budget, currency)}</span>
                ) : null}
              </div>
            </div>
            {pct != null ? (
              <span className={`${styles.mono} ${styles.budgetPct}`} style={{ color }}>
                {pct}%
              </span>
            ) : null}
          </div>
          {pct != null ? (
            <div className={styles.budgetTrack}>
              <span className={styles.budgetFill} style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
            </div>
          ) : null}
        </div>
      ) : null}
      {lines.length > 0 ? (
        <div className={styles.budgetLines}>
          {lines.map(([label, amount]) => (
            <div key={label} className={styles.budgetLine}>
              <span className={styles.budgetLineLabel}>{label}</span>
              <span className={`${styles.mono} ${styles.budgetLineAmount}`}>{formatMoney(amount, currency)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
