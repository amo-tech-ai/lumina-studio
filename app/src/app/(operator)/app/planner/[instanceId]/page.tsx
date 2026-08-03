// IPI-578 — Workspace route. Existence/UUID guard lives in the sibling
// layout.tsx (shared with settings/page.tsx). Server Component with zero
// view-switching logic — all interactive behavior lives in
<<<<<<< HEAD
// PlannerWorkspaceShell. Real view content (Timeline/Kanban/Calendar/List)
// ships in PLN-S1B–D (IPI-579/580/581); mutations ship in PLN-S1E (IPI-582).

import { PlannerWorkspaceShell } from "@/components/planner/planner-workspace-shell";
=======
// PlannerWorkspaceShell.
//
// IPI-579 · PLN-S1B — Timeline ships here from one getInstanceDetail() read.
// IPI-580 · PLN-S1C — Kanban + List reuse that same payload (no view-level
// Supabase calls).
// IPI-581 · PLN-S1D — Calendar: same tasks payload; month matrix builds
// client-side so Previous/Today/Next stay local.
// IPI-588 · PLN-S1G — Now & Next uses the same tasks + phase names; viewer
// id comes from the session (settings-page pattern).
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
import { getInstanceDetail, getViewConfig, listWorkflowPhases } from "@/lib/planner/queries";
import type { ViewType } from "@/lib/planner/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
>>>>>>> origin/main

export default async function PlannerWorkspacePage({
  params,
}: {
  params: Promise<{ instanceId: string }>;
}) {
  const { instanceId } = await params;
<<<<<<< HEAD
  return <PlannerWorkspaceShell instanceId={instanceId} />;
=======

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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  // Transient Auth/network failures must hit the error boundary (retryable),
  // not notFound() — only a missing session after a successful Auth call is 404.
  if (authError) throw new Error(authError.message);
  if (!user) notFound();

  // IPI-582 — per-user preference; failure/missing → Timeline. Never "list"
  // (PersistedViewType excludes it). Soft-fail: a view_config read error must
  // not block the workspace.
  let initialView: ViewType = "timeline";
  const viewConfigResult = await getViewConfig(instanceId);
  if (viewConfigResult.ok && viewConfigResult.data?.defaultView) {
    initialView = viewConfigResult.data.defaultView;
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const phases = phasesResult.data;
  const tasks = instanceResult.data.tasks;
  const status = instanceResult.data.status;

  const timelineModel = buildTimelineModel(phases, tasks, todayIso, status);
  const kanbanModel = buildKanbanModel(timelineModel, tasks);
  const listRows = buildTaskViews(phases, tasks);

  const phaseNames = Object.fromEntries(phases.map((phase) => [phase.id, phase.name]));

  return (
    <PlannerWorkspaceShell
      instanceId={instanceId}
      initialView={initialView}
      timeline={<PlannerTimeline model={timelineModel} />}
      kanban={<PlannerKanban model={kanbanModel} />}
      calendar={<PlannerCalendar tasks={tasks} />}
      list={<PlannerList rows={listRows} />}
      tasks={tasks}
      viewerId={user.id}
      phaseNames={phaseNames}
      today={todayIso}
    />
  );
>>>>>>> origin/main
}
