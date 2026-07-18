import type { ReactNode } from "react";

/**
 * IPI-304 — shared header row: title (+ optional subtitle) on the left,
 * arbitrary content (badge / button / ApprovalActions) on the right.
 * Matches the design source's title row (`ApprovalCard.dc.html`) and is
 * structurally identical across all 4 forks — only the classNames differ
 * per surface, passed in by the caller so each keeps its exact styling.
 */
export function ApprovalHeader({
  className,
  title,
  titleClassName,
  subtitle,
  subtitleClassName,
  right,
}: {
  className?: string;
  title: ReactNode;
  titleClassName?: string;
  subtitle?: ReactNode;
  subtitleClassName?: string;
  right?: ReactNode;
}) {
  return (
    <div className={className}>
      {subtitle ? (
        <div>
          <div className={titleClassName}>{title}</div>
          <div className={subtitleClassName}>{subtitle}</div>
        </div>
      ) : (
        <div className={titleClassName}>{title}</div>
      )}
      {right}
    </div>
  );
}
