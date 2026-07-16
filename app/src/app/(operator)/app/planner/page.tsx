// IPI-526 — Planner Hub route. Server-first: parses/validates URL filters,
// calls the Slice A read contract (listPlannerInstances, IPI-538), and
// renders the returned cursor page. Every filter or page change is a real
// navigation — no client-side filtering, no client-side pagination append.
// Auth is enforced two ways: the operator middleware redirects an
// unauthenticated request before this ever runs, and
// listPlannerInstances's own authenticatedPlannerClient() check is honored
// below as defense in depth (never rendered as an empty portfolio).

import { redirect } from "next/navigation";

import { parseHubSearchParams, type RawHubSearchParams } from "@/components/planner/hub-params";
import { PlannerHubWorkspace } from "@/components/planner/hub-workspace";
import { listPlannerInstances } from "@/lib/planner/queries";

export const dynamic = "force-dynamic";

export default async function PlannerHubPage({
  searchParams,
}: {
  searchParams: Promise<RawHubSearchParams>;
}) {
  const raw = await searchParams;
  const filters = parseHubSearchParams(raw);

  const result = await listPlannerInstances({
    cursor: filters.cursor,
    limit: filters.limit,
    search: filters.search || undefined,
    entityType: filters.entityType,
    status: filters.status,
    includeArchived: filters.includeArchived,
  });

  if (!result.ok) {
    if (result.error.code === "UNAUTHENTICATED") {
      redirect("/login?redirect=/app/planner");
    }
    throw new Error(result.error.message);
  }

  return (
    <PlannerHubWorkspace filters={filters} items={result.data.items} nextCursor={result.data.nextCursor} />
  );
}
