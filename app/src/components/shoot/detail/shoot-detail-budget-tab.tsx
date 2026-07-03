import type { ShootDetailPayload } from "@/lib/shoot/get-shoot-detail";
import {
  budgetUsedPct,
  formatMoney,
  formatRoleLabel,
} from "@/lib/shoot/shoot-detail-format";
import styles from "../shoot-detail.module.css";
import { ShootDetailEmpty } from "./shoot-detail-empty";

type Props = { data: ShootDetailPayload };

export function ShootDetailBudgetTab({ data }: Props) {
  const { shoot } = data;
  const currency = shoot.currency ?? "USD";
  const total = shoot.estimated_budget;
  const spent = shoot.actual_cost;
  const pct = budgetUsedPct(spent, total);
  const breakdown = shoot.budget_breakdown;
  const lines =
    breakdown && typeof breakdown === "object"
      ? Object.entries(breakdown).filter(([, v]) => typeof v === "number")
      : [];

  const hasBudget =
    total != null || spent != null || lines.length > 0;

  if (!hasBudget) {
    return (
      <ShootDetailEmpty message="No budget recorded for this shoot yet. Set estimated budget in the wizard or shoot settings." />
    );
  }

  const spentLabel = formatMoney(spent, currency) ?? "—";
  const totalLabel = formatMoney(total, currency);

  return (
    <div>
      {(spent != null || total != null) && (
        <div className={styles.budgetCard}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: "0.625rem",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "var(--font-size-xs)",
                  fontWeight: "var(--font-weight-semibold)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--color-text-muted)",
                }}
              >
                Budget used
              </div>
              <div
                style={{
                  marginTop: "0.25rem",
                  fontSize: "var(--font-size-2xl)",
                  fontWeight: "var(--font-weight-semibold)",
                }}
              >
                {spentLabel}
                {totalLabel ? (
                  <span
                    style={{
                      fontSize: "var(--font-size-base)",
                      fontWeight: "var(--font-weight-medium)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {" "}
                    / {totalLabel}
                  </span>
                ) : null}
              </div>
            </div>
            {pct != null ? (
              <span
                className="font-mono"
                style={{
                  fontSize: "var(--font-size-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--color-action)",
                }}
              >
                {pct}%
              </span>
            ) : null}
          </div>
          {pct != null ? (
            <div className={styles.budgetPctBar}>
              <span
                className={styles.budgetPctFill}
                style={{ width: `${pct}%` }}
              />
            </div>
          ) : null}
        </div>
      )}
      {lines.length > 0 ? (
        <div>
          {lines.map(([label, amount]) => (
            <div key={label} className={styles.budgetLine}>
              <span>{formatRoleLabel(label)}</span>
              <span className="font-mono">{formatMoney(amount, currency)}</span>
            </div>
          ))}
        </div>
      ) : total != null && lines.length === 0 ? (
        <ShootDetailEmpty message="No line-item breakdown yet." />
      ) : null}
    </div>
  );
}
