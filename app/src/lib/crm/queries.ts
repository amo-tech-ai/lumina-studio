import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

import { sanitizeCrmSearchTerm } from "./search";

type Db = SupabaseClient<Database>;

export type CompanyRow = Database["public"]["Tables"]["crm_companies"]["Row"];
export type ContactRow = Database["public"]["Tables"]["crm_contacts"]["Row"];

/** First org the user belongs to. CRM is single-org-per-user for MVP — no org switcher yet. */
export async function getCurrentOrgId(userId: string, client: Db): Promise<string | null> {
  const { data, error } = await client
    .from("org_members")
    .select("org_id")
    .eq("user_id", userId)
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
    if (term) q = q.ilike("name", `%${term}%`);
  }
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
