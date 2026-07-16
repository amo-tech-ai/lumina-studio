// IPI-576 — Planner Dashboard route. Server-first: two bounded, parallel
// server reads (getPlannerDashboardSummary/listPlannerInstances({limit:3})),
// no caller-supplied identity, no per-KPI/per-card fan-out. Auth is enforced
// two ways: the operator middleware redirects an unauthenticated request
// before this ever runs, and each read's own authenticatedPlannerClient()
// check is honored below as defense in depth.

import { redirect } from "next/navigation";

import { PlannerDashboardWorkspace } from "@/components/planner/dashboard-workspace";
import { getPlannerDashboardSummary, listPlannerInstances } from "@/lib/planner/queries";

export const dynamic = "force-dynamic";

const DASHBOARD_PATH = "/app/planner/dashboard";

export default async function PlannerDashboardPage() {
  const [summaryResult, instancesResult] = await Promise.all([
    getPlannerDashboardSummary(),
    listPlannerInstances({ limit: 3 }),
  ]);

  if (!summaryResult.ok) {
    if (summaryResult.error.code === "UNAUTHENTICATED") {
      redirect(`/login?redirect=${encodeURIComponent(DASHBOARD_PATH)}`);
    }
    throw new Error(summaryResult.error.message);
  }
  if (!instancesResult.ok) {
    if (instancesResult.error.code === "UNAUTHENTICATED") {
      redirect(`/login?redirect=${encodeURIComponent(DASHBOARD_PATH)}`);
    }
    throw new Error(instancesResult.error.message);
  }

  return (
    <PlannerDashboardWorkspace summary={summaryResult.data} items={instancesResult.data.items} />
  );
}
