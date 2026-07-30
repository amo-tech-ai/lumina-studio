import { ContactsWorkspace } from "@/components/crm/contacts-workspace";
import { getCurrentOrgId, listCompanies, listContacts, type ContactRow } from "@/lib/crm/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CrmContactsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  let contacts: ContactRow[] = [];
  let companyNames: Record<string, string> = {};
  let fetchError: string | null = null;

  if (authError || !user) {
    fetchError = "Unable to verify your session. Please sign in again.";
  } else {
    try {
      const orgId = await getCurrentOrgId(user.id, supabase);
      if (orgId) {
        // listContacts is the primary data — its failure is the only thing that
        // should surface as fetchError. Company names come from the full org
        // listCompanies() so New person can attach any org company, not only
        // ones already linked on a contact row (IPI-562 review).
        contacts = await listContacts({ orgId }, supabase);
        try {
          const companies = await listCompanies({ orgId }, supabase);
          companyNames = Object.fromEntries(companies.map((c) => [c.id, c.name]));
        } catch {
          companyNames = {};
        }
      } else {
        // Distinct from "org has zero contacts" — no org membership is an
        // access/setup problem, not an empty CRM.
        fetchError = "Your account isn't linked to an organization yet.";
      }
    } catch {
      fetchError = "Unable to load contacts.";
    }
  }

  return <ContactsWorkspace contacts={contacts} companyNames={companyNames} fetchError={fetchError} />;
}
