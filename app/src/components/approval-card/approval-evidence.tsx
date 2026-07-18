import type { ReactNode } from "react";

/** A single label/value fact in an {@link ApprovalEvidence} grid. */
export interface ApprovalEvidenceField {
  key?: string;
  label: ReactNode;
  value: ReactNode;
  /** Per-field wrapper className, e.g. a `col-span-*` override for a wide field. */
  className?: string;
}

/**
 * IPI-304 — generic evidence/fact grid. Maps onto the design source's
 * confidence + evidence row (`ApprovalCard.dc.html`) and, for Brand Hub,
 * the tagline/category/confidence/readiness `<dl>`. Brand-only for v1 — the
 * 3 shoot HITL cards have no evidence concept today.
 */
export function ApprovalEvidence({
  fields,
  className,
  labelClassName,
  valueClassName,
}: {
  fields: ApprovalEvidenceField[];
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}) {
  if (fields.length === 0) return null;
  return (
    <dl className={className}>
      {fields.map((field, index) => (
        <div key={field.key ?? index} className={field.className}>
          <dt className={labelClassName}>{field.label}</dt>
          <dd className={valueClassName}>{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}
