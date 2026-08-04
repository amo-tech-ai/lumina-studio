import type { HTMLAttributes, ReactNode } from "react";

/**
 * IPI-304 — shared outer container for the 4 ApprovalCard forks (Brand Hub,
 * Budget/Deliverable/ShotList HITL). Deliberately style-free: Brand Hub and
 * the Shoot HITL cards use two different visual systems today (Tailwind
 * utility classes vs `shoot-wizard.module.css` tokens) and this ticket is a
 * structural de-fork, not a redesign — every surface keeps its exact current
 * appearance by passing its own `className`.
 *
 * IPI-483 — also accepts standard div attributes (data-testid, aria-*) for
 * Planner GateApprovalCard without inventing a second shell.
 */
export function ApprovalCardShell({
  className,
  children,
  ...rest
}: {
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}
