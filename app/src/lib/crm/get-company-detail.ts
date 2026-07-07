import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

import {
  getCompany,
  getProfileNames,
  listActivities,
  listContacts,
  listDeals,
  type ActivityRow,
  type CompanyRow,
  type ContactRow,
  type DealRow,
} from "./queries";

type Db = SupabaseClient<Database>;

export type CompanyDetailPayload = {
  company: CompanyRow;
  ownerName: string | null;
  contacts: ContactRow[];
  deals: DealRow[];
  activities: ActivityRow[];
};

/** Assembles the Company Detail page's payload from the Wave 1 query helpers —
 *  no combined RPC exists (IPI-403's convenience RPCs are deferred P3), so this
 *  orchestrates getCompany + the 3 tab-scoped lists + owner-name resolution.
 *  `null` means no matching row (caller should 404) — a real query error
 *  throws and propagates, it is never swallowed into a false 404. */
export async function getCompanyDetail(
  client: Db,
  orgId: string,
  companyId: string,
): Promise<CompanyDetailPayload | null> {
  const company = await getCompany({ id: companyId, orgId }, client);
  if (!company) return null;

  const [contacts, deals, activities, ownerNames] = await Promise.all([
    listContacts({ orgId, companyId }, client),
    listDeals({ orgId, companyId }, client),
    listActivities({ orgId, companyId }, client),
    company.owner ? getProfileNames([company.owner], client) : Promise.resolve<Record<string, string>>({}),
  ]);

  return {
    company,
    ownerName: company.owner ? (ownerNames[company.owner] ?? null) : null,
    contacts,
    deals,
    activities,
  };
}
