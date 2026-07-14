// IPI-578 — Workspace route. Existence/UUID guard lives in the sibling
// layout.tsx (shared with settings/page.tsx). Server Component with zero
// view-switching logic — all interactive behavior lives in
// PlannerWorkspaceShell. Real view content (Timeline/Kanban/Calendar/List)
// ships in PLN-S1B–D (IPI-579/580/581); mutations ship in PLN-S1E (IPI-582).

import { PlannerWorkspaceShell } from "@/components/planner/planner-workspace-shell";

export default function PlannerWorkspacePage() {
  return <PlannerWorkspaceShell />;
}
