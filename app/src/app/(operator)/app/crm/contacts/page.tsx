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
        // should surface as fetchError. The company-name lookup is auxiliary:
        // ContactsWorkspace already falls back to "—" for a missing entry, so a
        // transient failure there shouldn't wipe out the whole contacts list.
        contacts = await listContacts({ orgId }, supabase);
        try {
          const companyRows = await listCompanies({ orgId }, supabase);
          companyNames = Object.fromEntries(companyRows.map((c) => [c.id, c.name]));
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
