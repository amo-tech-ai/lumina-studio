import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

import { getDeal, listActivities, type ActivityRow, type DealRow } from "./queries";

type Db = SupabaseClient<Database>;

export type DealDetailPayload = {
  deal: DealRow;
  companyName: string | null;
  /** Real brand link only when the company has already been converted — a deal
   *  being `stage: "won"` alone does NOT imply a brand exists (the convert
   *  route that would create/link one, IPI-367, isn't built yet). */
  companyBrandId: string | null;
  activities: ActivityRow[];
};

/** Assembles the Deal Detail page's payload — mirrors get-company-detail.ts /
 *  get-contact-detail.ts's orchestration shape.
 *
 *  `crm_deals` has no `contact_id` column (see getDeal's own comment in
 *  queries.ts) — there is no real "primary contact" to resolve, so this
 *  payload never includes one. `crm_deals` also has no `name`/`title` column
 *  at all — the DC mockup's deal-name header ("SS26 Editorial") assumes a
 *  field the schema doesn't have. The caller derives a display label instead
 *  of fabricating one (see deal-detail-workspace.tsx's `displayTitle`).
 *
 *  No shoot-name lookup: `crm_deals_shoot_id_fkey` references `public.shoots`
 *  (the legacy booking table — no name column, no consuming page anywhere in
 *  app/src/). `shoot_portfolio_view` is a different table (`shoot.shoots`,
 *  the brand-intelligence portfolio) with a disjoint id space, so querying it
 *  with a `public.shoots` id would always silently miss. The workspace shows
 *  an honest "Linked" indicator instead of resolving a name/link it can't
 *  get right.
 *
 *  Company name + brand_id are fetched in one org-scoped query rather than
 *  via the shared `getCompanyNames` helper — that helper is intentionally
 *  unscoped (meant for ids already sourced from an org-scoped list), and
 *  `crm_deals.company_id` is a plain FK with no DB constraint tying its org
 *  to the deal's own `org_id`. Scoping here directly closes that gap. */
export async function getDealDetail(client: Db, orgId: string, dealId: string): Promise<DealDetailPayload | null> {
  const deal = await getDeal({ id: dealId, orgId }, client);
  if (!deal) return null;

  const [companyRow, activities] = await Promise.all([
    client
      .from("crm_companies")
      .select("name, brand_id")
      .eq("id", deal.company_id)
      .eq("org_id", orgId)
      .maybeSingle(),
    listActivities({ orgId, dealId }, client),
  ]);

  if (companyRow.error) throw companyRow.error;

  return {
    deal,
    companyName: companyRow.data?.name ?? null,
    companyBrandId: companyRow.data?.brand_id ?? null,
    activities,
  };
}
