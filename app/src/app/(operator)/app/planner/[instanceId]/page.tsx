// IPI-578 — Workspace route. Existence/UUID guard lives in the sibling
// layout.tsx (shared with settings/page.tsx). Server Component with zero
// view-switching logic — all interactive behavior lives in
// PlannerWorkspaceShell.
//
// IPI-579 · PLN-S1B — Timeline ships here from one getInstanceDetail() read.
// IPI-580 · PLN-S1C — Kanban + List reuse that same payload (no view-level
// Supabase calls).
// IPI-581 · PLN-S1D — Calendar: same tasks payload; month matrix builds
// client-side so Previous/Today/Next stay local.
// Mutations ship in IPI-582.
//
// Loading/error states are the route's loading.tsx/error.tsx — a failed
// read (including RLS denying access) throws and lands in
// PlannerErrorBoundary, so view components never fetch.

import { notFound } from "next/navigation";

import { PlannerCalendar } from "@/components/planner/planner-calendar";
import { PlannerKanban } from "@/components/planner/planner-kanban";
import { PlannerList } from "@/components/planner/planner-list";
import { PlannerTimeline } from "@/components/planner/planner-timeline";
import { PlannerWorkspaceShell } from "@/components/planner/planner-workspace-shell";
import {
  buildKanbanModel,
  buildTaskViews,
  buildTimelineModel,
} from "@/lib/planner/planner-view-model";
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

  const todayIso = new Date().toISOString().slice(0, 10);
  const phases = phasesResult.data;
  const tasks = instanceResult.data.tasks;
  const status = instanceResult.data.status;

  const timelineModel = buildTimelineModel(phases, tasks, todayIso, status);
  const kanbanModel = buildKanbanModel(timelineModel, tasks);
  const listRows = buildTaskViews(phases, tasks);

  return (
    <PlannerWorkspaceShell
      instanceId={instanceId}
      timeline={<PlannerTimeline model={timelineModel} />}
      kanban={<PlannerKanban model={kanbanModel} />}
      calendar={<PlannerCalendar tasks={tasks} />}
      list={<PlannerList rows={listRows} />}
    />
  );
}
