import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

import { getCompanyNames, getContact, listActivities, listDeals, type ActivityRow, type ContactRow, type DealRow } from "./queries";

type Db = SupabaseClient<Database>;

export type ContactDetailPayload = {
  contact: ContactRow;
  companyName: string | null;
  deals: DealRow[];
  activities: ActivityRow[];
};

/** Assembles the Contact Detail page's payload — mirrors get-company-detail.ts's
 *  orchestration shape. `deals` is scoped by the contact's linked company_id,
 *  not the contact itself: crm_deals has no contact_id column (see getDeal's
 *  own comment in queries.ts), and the DC design's "via {company}" sub-label
 *  on each deal row confirms these were always meant to be company-scoped
 *  context, not a real per-contact FK. A contact with no company_id gets an
 *  honest empty deals list, not an error. `null` means no matching row
 *  (caller should 404) — a real query error throws and propagates. */
export async function getContactDetail(
  client: Db,
  orgId: string,
  contactId: string,
): Promise<ContactDetailPayload | null> {
  const contact = await getContact({ id: contactId, orgId }, client);
  if (!contact) return null;

  const [deals, activities, companyNames] = await Promise.all([
    contact.company_id ? listDeals({ orgId, companyId: contact.company_id }, client) : Promise.resolve<DealRow[]>([]),
    listActivities({ orgId, contactId }, client),
    contact.company_id
      ? getCompanyNames([contact.company_id], client)
      : Promise.resolve<Record<string, string>>({}),
  ]);

  return {
    contact,
    companyName: contact.company_id ? (companyNames[contact.company_id] ?? null) : null,
    deals,
    activities,
  };
}
