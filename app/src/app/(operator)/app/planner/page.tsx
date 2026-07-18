// IPI-526 — Planner Hub route. Server-first: parses/validates URL filters,
// calls the Slice A read contract (listPlannerInstances, IPI-538), and
// renders the returned cursor page. Every filter or page change is a real
// navigation — no client-side filtering, no client-side pagination append.
// Auth is enforced two ways: the operator middleware redirects an
// unauthenticated request before this ever runs, and
// listPlannerInstances's own authenticatedPlannerClient() check is honored
// below as defense in depth (never rendered as an empty portfolio).

import { redirect } from "next/navigation";

import { buildHubUrl, parseHubSearchParams, type RawHubSearchParams } from "@/components/planner/hub-params";
import { PlannerHubWorkspace } from "@/components/planner/hub-workspace";
import { getCurrentOrgId } from "@/lib/crm/queries";
import { listEligibleEntities, listPlannerInstances, listWorkflowTemplates } from "@/lib/planner/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      // Preserve the attempted filters/search/cursor through the login
      // round-trip — safe-redirect.ts's safeRedirect() already accepts any
      // `/app/*` target including its own query string, and login-form.tsx
      // reads it via URLSearchParams.get() (auto-decoding), so the full
      // canonical Hub URL round-trips correctly.
      redirect(`/login?redirect=${encodeURIComponent(buildHubUrl(filters))}`);
    }
    // By this point search/limit/entityType/status are already normalized
    // to values listPlannerInstances accepts (parseHubSearchParams mirrors
    // its exact bounds) — the only remaining source of INVALID_INPUT is a
    // cursor with valid base64url charset but content that doesn't decode
    // (a stale, tampered, or otherwise malformed pagination URL). Fall back
    // to page 1 rather than crashing to the error boundary — this never
    // decodes the cursor, it just stops forwarding one that already failed.
    if (result.error.code === "INVALID_INPUT" && filters.cursor) {
      redirect(buildHubUrl({ ...filters, cursor: undefined }));
    }
    throw new Error(result.error.message);
  }

  // IPI-650 — "New plan" CTA data. result.ok above proves the caller is
  // authenticated (listPlannerInstances already redirected otherwise), so
  // this second auth round-trip only resolves *which* org — same
  // single-org-per-user MVP assumption getCurrentOrgId's own doc comment
  // states (crm/queries.ts), reused rather than duplicated here. A caller
  // with no organization yet (null) still gets the CTA — never pre-filtered
  // client-side — the dialog itself explains there's nothing to attach a
  // plan to.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const orgId = user ? await getCurrentOrgId(user.id, supabase) : null;

  const [eligibleEntitiesResult, workflowTemplatesResult] = orgId
    ? await Promise.all([listEligibleEntities(orgId), listWorkflowTemplates(orgId)])
    : [null, null];

  return (
    <PlannerHubWorkspace
      filters={filters}
      items={result.data.items}
      nextCursor={result.data.nextCursor}
      orgId={orgId}
      eligibleEntities={eligibleEntitiesResult?.ok ? eligibleEntitiesResult.data : []}
      workflowTemplates={workflowTemplatesResult?.ok ? workflowTemplatesResult.data : []}
    />
  );
}
