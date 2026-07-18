// IPI-304 — De-fork ApprovalCard: shared shell + presentation primitives
// consumed by BrandApprovalCard, BudgetApprovalCard, DeliverableApprovalCard,
// and ShotListApprovalCard. See tasks/design-docs/handoff/03-component-map.md
// (or Universal-design-prompt-4/docs/handoff/03-component-map.md) for the
// agreed prop names.
export { ApprovalCardShell } from "./approval-card-shell";
export { ApprovalHeader } from "./approval-header";
export { ApprovalEvidence, type ApprovalEvidenceField } from "./approval-evidence";
export { ApprovalComparison, type ApprovalComparisonRow } from "./approval-comparison";
export { ApprovalActions } from "./approval-actions";
