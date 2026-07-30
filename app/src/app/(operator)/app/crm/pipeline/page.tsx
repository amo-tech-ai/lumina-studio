import { PipelineWorkspace } from "@/components/crm/pipeline-workspace";
import {
  getCompanyNames,
  getCurrentOrgId,
  getProfileNames,
  listDeals,
  type DealRow,
} from "@/lib/crm/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CrmPipelinePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  let deals: DealRow[] = [];
  let companyNames: Record<string, string> = {};
  let ownerNames: Record<string, string> = {};
  let fetchError: string | null = null;

  if (authError || !user) {
    fetchError = "Unable to verify your session. Please sign in again.";
  } else {
    try {
      const orgId = await getCurrentOrgId(user.id, supabase);
      if (orgId) {
        // listDeals with no stage filter returns every deal for the org —
        // the board groups by stage client-side (pipeline-workspace.tsx).
        deals = await listDeals({ orgId }, supabase);
        try {
          const companyIds = [...new Set(deals.map((d) => d.company_id))];
          companyNames = await getCompanyNames(companyIds, supabase);
        } catch {
          companyNames = {};
        }
        // Same id→name pattern as companies list (getProfileNames).
        try {
          const ownerIds = deals.map((d) => d.owner).filter((id): id is string => id != null);
          ownerNames = await getProfileNames(ownerIds, supabase);
        } catch {
          ownerNames = {};
        }
      } else {
        // Distinct from "org has zero deals" — no org membership is an
        // access/setup problem, not an empty pipeline.
        fetchError = "Your account isn't linked to an organization yet.";
      }
    } catch {
      fetchError = "Unable to load the pipeline.";
    }
  }

  // Computed once, server-side, and passed down rather than called inside
  // the client component — the identical value serializes through props and
  // hydrates client-side, so "Updated Xd ago"/at-risk can never flip between
  // server HTML and client hydration near a day boundary.
  return (
    <PipelineWorkspace
      deals={deals}
      companyNames={companyNames}
      ownerNames={ownerNames}
      fetchError={fetchError}
      now={Date.now()}
    />
  );
}
