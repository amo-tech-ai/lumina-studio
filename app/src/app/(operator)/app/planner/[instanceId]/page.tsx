// IPI-578 — Workspace route. Existence/UUID guard lives in the sibling
// layout.tsx (shared with settings/page.tsx). Server Component with zero
// view-switching logic — all interactive behavior lives in
// PlannerWorkspaceShell. Real view content (Timeline/Kanban/Calendar/List)
// ships in PLN-S1B–D (IPI-579/580/581); mutations ship in PLN-S1E (IPI-582).
//
// IPI-579 · PLN-S1B — the Timeline ships here: the RSC loads the instance
// detail + workflow phases, builds the read-only TimelineModel server-side,
// and hands it to the shell as the Timeline tab's content. Loading/error
// states are the route's loading.tsx/error.tsx — a failed read (including
// RLS denying access) throws and lands in PlannerErrorBoundary, so the
// timeline component itself never fetches.

import { notFound } from "next/navigation";

import { PlannerTimeline } from "@/components/planner/planner-timeline";
import { PlannerWorkspaceShell } from "@/components/planner/planner-workspace-shell";
import { buildTimelineModel } from "@/lib/planner/planner-view-model";
import { getInstanceDetail, listWorkflowPhases } from "@/lib/planner/queries";

export default async function PlannerWorkspacePage({
  params,
}: {
  params: Promise<{ instanceId: string }>;
}) {
  const { instanceId } = await params;

  const instanceResult = await getInstanceDetail(instanceId);
  if (!instanceResult.ok) {
    // Missing / unreadable plans share INVALID_INPUT with the layout's
    // notFound() path — do not surface them as a generic error boundary.
    if (instanceResult.error.code === "INVALID_INPUT") notFound();
    throw new Error(instanceResult.error.message);
  }
  const phasesResult = await listWorkflowPhases(instanceResult.data.workflowId);
  if (!phasesResult.ok) {
    throw new Error(phasesResult.error.message);
  }

  const model = buildTimelineModel(
    phasesResult.data,
    instanceResult.data.tasks,
    new Date().toISOString().slice(0, 10),
    instanceResult.data.status,
  );

  return (
    <PlannerWorkspaceShell
      instanceId={instanceId}
      timeline={<PlannerTimeline model={model} />}
    />
  );
}
