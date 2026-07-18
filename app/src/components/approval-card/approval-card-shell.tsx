import type { ReactNode } from "react";

/**
 * IPI-304 — shared outer container for the 4 ApprovalCard forks (Brand Hub,
 * Budget/Deliverable/ShotList HITL). Deliberately style-free: Brand Hub and
 * the Shoot HITL cards use two different visual systems today (Tailwind
 * utility classes vs `shoot-wizard.module.css` tokens) and this ticket is a
 * structural de-fork, not a redesign — every surface keeps its exact current
 * appearance by passing its own `className`.
 */
export function ApprovalCardShell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={className}>{children}</div>;
}
