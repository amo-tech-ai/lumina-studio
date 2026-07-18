import type { ReactNode } from "react";

/** A single row in an {@link ApprovalComparison} list. */
export interface ApprovalComparisonRow {
  key: string;
  label: ReactNode;
  value: ReactNode;
  /** Optional delta indicator rendered before `value` (e.g. a +/- badge). */
  delta?: ReactNode;
}

/**
 * IPI-304 — generic comparison list. Maps onto the design source's
 * Before/After diff (`ApprovalCard.dc.html`'s `hasDiff` block) and, for
 * Brand Hub, the draft-vs-live score comparison. Brand-only for v1.
 */
export function ApprovalComparison({
  rows,
  className,
  rowClassName,
  labelClassName,
  valueSlotClassName,
}: {
  rows: ApprovalComparisonRow[];
  className?: string;
  rowClassName?: string;
  labelClassName?: string;
  valueSlotClassName?: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div className={className}>
      {rows.map((row) => (
        <div key={row.key} className={rowClassName}>
          <span className={labelClassName}>{row.label}</span>
          <div className={valueSlotClassName}>
            {row.delta}
            {row.value}
          </div>
        </div>
      ))}
    </div>
  );
}
