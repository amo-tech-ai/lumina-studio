import { CompaniesWorkspace } from "@/components/crm/companies-workspace";
import { getCurrentOrgId, getProfileNames, listCompanies, type CompanyRow } from "@/lib/crm/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CrmCompaniesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  let companies: CompanyRow[] = [];
  let ownerNames: Record<string, string> = {};
  let fetchError: string | null = null;

  if (authError || !user) {
    // Distinct from "org has zero companies" — an expired/invalid session
    // shouldn't render as a silent empty list (middleware normally redirects
    // before this point; this is the belt-and-suspenders case).
    fetchError = "Unable to verify your session. Please sign in again.";
  } else {
    try {
      const orgId = await getCurrentOrgId(user.id, supabase);
      if (orgId) {
        companies = await listCompanies({ orgId }, supabase);
        const ownerIds = companies.map((c) => c.owner).filter((id): id is string => id != null);
        // Owner-name resolution failing shouldn't cost the whole list — rows
        // just fall back to "—" for owner (see CompaniesWorkspace).
        try {
          ownerNames = await getProfileNames(ownerIds, supabase);
        } catch {
          ownerNames = {};
        }
      } else {
        // Distinct from "org has zero companies" — no org membership at all is
        // an access/setup problem, not an empty CRM. Same signal the CRM detail
        // page stubs give via notFound(); here we use the list's own ErrorState
        // since the route itself is valid and a retry can genuinely resolve
        // this (e.g. an admin just added the user to an org).
        fetchError = "Your account isn't linked to an organization yet.";
      }
    } catch {
      fetchError = "Unable to load companies.";
    }
  }

  return <CompaniesWorkspace companies={companies} ownerNames={ownerNames} fetchError={fetchError} />;
}
