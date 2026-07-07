import { ContactsWorkspace } from "@/components/crm/contacts-workspace";
import { getCurrentOrgId, listCompanies, listContacts, type ContactRow } from "@/lib/crm/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CrmContactsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let contacts: ContactRow[] = [];
  let companyNames: Record<string, string> = {};
  let fetchError: string | null = null;
  try {
    const orgId = user ? await getCurrentOrgId(user.id, supabase) : null;
    if (orgId) {
      const [contactRows, companyRows] = await Promise.all([
        listContacts({ orgId }, supabase),
        listCompanies({ orgId }, supabase),
      ]);
      contacts = contactRows;
      companyNames = Object.fromEntries(companyRows.map((c) => [c.id, c.name]));
    }
  } catch {
    fetchError = "Unable to load contacts.";
  }

  return <ContactsWorkspace contacts={contacts} companyNames={companyNames} fetchError={fetchError} />;
}
