import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

import { getCompanyNames, getDeal, listActivities, type ActivityRow, type DealRow } from "./queries";

type Db = SupabaseClient<Database>;

export type DealDetailPayload = {
  deal: DealRow;
  companyName: string | null;
  /** Real shoot title when `deal.shoot_id` is set, else null — never a placeholder. */
  shootName: string | null;
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
 *  shootName resolves via `shoot_portfolio_view` (the same view
 *  command-center/queries.ts already reads — shoots has no plain display-name
 *  column of its own). The view itself filters by `auth.uid()`; the id we
 *  query with here was already sourced from an org-scoped `deal` row, so this
 *  follows the same defense-in-depth spirit as fetchRecentShoots's brand_id
 *  scoping, not an unscoped lookup. */
export async function getDealDetail(client: Db, orgId: string, dealId: string): Promise<DealDetailPayload | null> {
  const deal = await getDeal({ id: dealId, orgId }, client);
  if (!deal) return null;

  const [companyNames, companyRows, shootName, activities] = await Promise.all([
    getCompanyNames([deal.company_id], client),
    client.from("crm_companies").select("brand_id").eq("id", deal.company_id).maybeSingle(),
    deal.shoot_id ? getShootName(deal.shoot_id, client) : Promise.resolve<string | null>(null),
    listActivities({ orgId, dealId }, client),
  ]);

  if (companyRows.error) throw companyRows.error;

  return {
    deal,
    companyName: companyNames[deal.company_id] ?? null,
    shootName,
    companyBrandId: companyRows.data?.brand_id ?? null,
    activities,
  };
}

async function getShootName(shootId: string, client: Db): Promise<string | null> {
  const { data, error } = await client.from("shoot_portfolio_view").select("name").eq("id", shootId).maybeSingle();
  if (error) throw error;
  return data?.name ?? null;
}
