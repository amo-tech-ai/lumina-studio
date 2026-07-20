"use server";

// IPI-562 · CRM-UX-005 Phase 1 — thin Server Action wrappers.
// Auth → getCurrentOrgId (server-derived org) → creates.ts → revalidatePath.
// Never trust client-supplied org_id.

import { revalidatePath } from "next/cache";

import {
  createCompany,
  createContact,
  createDeal,
  type CreateCompanyInput,
  type CreateContactInput,
  type CreateDealInput,
  type CreateResult,
} from "@/lib/crm/creates";
import { getCurrentOrgId } from "@/lib/crm/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type CompanyRow = Database["public"]["Tables"]["crm_companies"]["Row"];
type ContactRow = Database["public"]["Tables"]["crm_contacts"]["Row"];
type DealRow = Database["public"]["Tables"]["crm_deals"]["Row"];

async function authedOrgContext(): Promise<
  CreateResult<{ client: Awaited<ReturnType<typeof createSupabaseServerClient>>; orgId: string }>
> {
  const client = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) {
    return { ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in to continue." } };
  }
  const orgId = await getCurrentOrgId(user.id, client);
  if (!orgId) {
    return { ok: false, error: { code: "FORBIDDEN", message: "No organization membership found." } };
  }
  return { ok: true, data: { client, orgId } };
}

export async function createCompanyAction(input: CreateCompanyInput): Promise<CreateResult<CompanyRow>> {
  const ctx = await authedOrgContext();
  if (!ctx.ok) return ctx;
  const result = await createCompany(input, ctx.data);
  if (result.ok) {
    revalidatePath("/app/crm/companies");
    revalidatePath("/app/crm");
  }
  return result;
}

export async function createContactAction(input: CreateContactInput): Promise<CreateResult<ContactRow>> {
  const ctx = await authedOrgContext();
  if (!ctx.ok) return ctx;
  const result = await createContact(input, ctx.data);
  if (result.ok) {
    revalidatePath("/app/crm/contacts");
    revalidatePath("/app/crm");
    if (input.company_id) revalidatePath(`/app/crm/companies/${input.company_id}`);
  }
  return result;
}

export async function createDealAction(input: CreateDealInput): Promise<CreateResult<DealRow>> {
  const ctx = await authedOrgContext();
  if (!ctx.ok) return ctx;
  const result = await createDeal(input, ctx.data);
  if (result.ok) {
    revalidatePath("/app/crm/pipeline");
    revalidatePath(`/app/crm/companies/${input.company_id}`);
    revalidatePath("/app/crm");
  }
  return result;
}
