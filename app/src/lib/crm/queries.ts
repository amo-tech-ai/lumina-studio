import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

import { sanitizeCrmSearchTerm } from "./search";

type Db = SupabaseClient<Database>;

export type CompanyRow = Database["public"]["Tables"]["crm_companies"]["Row"];
export type ContactRow = Database["public"]["Tables"]["crm_contacts"]["Row"];

/** First org the user belongs to. CRM is single-org-per-user for MVP — no org switcher yet.
 *  Uses `joined_at` for ordering because `org_members` does not have a `created_at` column. */
export async function getCurrentOrgId(userId: string, client: Db): Promise<string | null> {
  const { data, error } = await client
    .from("org_members")
    .select("org_id")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.org_id ?? null;
}

export async function listCompanies(
  {
    orgId,
    status,
    owner,
    industry,
    search,
  }: {
    orgId: string;
    status?: string;
    owner?: string;
    industry?: string;
    search?: string;
  },
  client: Db,
): Promise<CompanyRow[]> {
  let q = client.from("crm_companies").select("*").eq("org_id", orgId);
  if (status) q = q.eq("status", status);
  if (owner) q = q.eq("owner", owner);
  if (industry) q = q.eq("industry", industry);
  if (search) {
    const term = sanitizeCrmSearchTerm(search);
    if (term) q = q.or(`name.ilike.%${term}%,domain.ilike.%${term}%`);
  }
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** crm_companies.owner is a uuid FK to profiles(id), not a display name — resolves
 *  id→full_name (falling back to email) for the given ids. Empty input short-circuits
 *  without a query. Missing/unresolvable ids are simply absent from the returned map;
 *  callers already render "—" for a lookup miss (see CompaniesWorkspace). */
export async function getProfileNames(ids: string[], client: Db): Promise<Record<string, string>> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return {};
  const { data, error } = await client.from("profiles").select("id, full_name, email").in("id", uniqueIds);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name ?? p.email]));
}

/** Resolves id→name only for the given company ids (not the whole org's
 *  company list) — callers pass the distinct company_ids off their own
 *  contacts result. Empty input short-circuits without a query. */
export async function getCompanyNames(ids: string[], client: Db): Promise<Record<string, string>> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return {};
  const { data, error } = await client.from("crm_companies").select("id, name").in("id", uniqueIds);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((c) => [c.id, c.name]));
}

export async function listContacts(
  {
    orgId,
    companyId,
    role,
    search,
  }: {
    orgId: string;
    companyId?: string;
    role?: string;
    search?: string;
  },
  client: Db,
): Promise<ContactRow[]> {
  let q = client.from("crm_contacts").select("*").eq("org_id", orgId);
  if (companyId) q = q.eq("company_id", companyId);
  if (role) q = q.eq("role_title", role);
  if (search) {
    const term = sanitizeCrmSearchTerm(search);
    // Name-only search for MVP — jsonb email/phone partial match needs a dedicated RPC (IPI-373+).
    if (term) q = q.ilike("name", `%${term}%`);
  }
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
