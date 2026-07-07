import { CompaniesWorkspace } from "@/components/crm/companies-workspace";
import { getCurrentOrgId, listCompanies, type CompanyRow } from "@/lib/crm/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CrmCompaniesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let companies: CompanyRow[] = [];
  let fetchError: string | null = null;
  try {
    const orgId = user ? await getCurrentOrgId(user.id, supabase) : null;
    companies = orgId ? await listCompanies({ orgId }, supabase) : [];
  } catch {
    fetchError = "Unable to load companies.";
  }

  return <CompaniesWorkspace companies={companies} fetchError={fetchError} />;
}
