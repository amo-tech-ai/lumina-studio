import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { normalizeContactFields } from "@/lib/crm/jsonb-contact-fields";
import type { Database, Json } from "@/types/supabase";

type Db = SupabaseClient<Database>;

export type CreateError = { code: string; message: string };
export type CreateResult<T> = { ok: true; data: T } | { ok: false; error: CreateError };

export type CreateCtx = { orgId: string; client: Db };

const COMPANY_STATUSES = ["prospect", "active", "inactive", "lost"] as const;
const DEAL_STAGES = ["lead", "qualified", "proposal", "negotiation", "won", "lost"] as const;

export const createCompanySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  domain: z
    .string()
    .trim()
    .max(253)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  industry: z
    .string()
    .trim()
    .max(120)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  status: z.enum(COMPANY_STATUSES).default("prospect"),
});

export const createContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  email: z
    .union([z.string().trim().email("Enter a valid email."), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  role_title: z
    .string()
    .trim()
    .max(120)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  company_id: z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export const createDealSchema = z.object({
  company_id: z.string().uuid("Company is required."),
  stage: z.enum(DEAL_STAGES).default("lead"),
  value: z
    .number()
    .finite()
    .nonnegative()
    .optional()
    .nullable()
    .transform((v) => (v === undefined ? null : v)),
  currency: z.string().trim().min(1).max(8).default("GBP"),
});

export type CreateCompanyInput = z.input<typeof createCompanySchema>;
export type CreateContactInput = z.input<typeof createContactSchema>;
export type CreateDealInput = z.input<typeof createDealSchema>;

/** Strip protocol/www/trailing slash and lowercase for duplicate checks. */
export function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function zodFail(error: z.ZodError): CreateResult<never> {
  return { ok: false, error: { code: "VALIDATION", message: error.issues[0]?.message ?? "Invalid input." } };
}

export async function createCompany(
  input: CreateCompanyInput,
  { orgId, client }: CreateCtx,
): Promise<CreateResult<Database["public"]["Tables"]["crm_companies"]["Row"]>> {
  const parsed = createCompanySchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);

  const { name, domain, industry, status } = parsed.data;
  const normalized = domain ? normalizeDomain(domain) : null;

  if (normalized) {
    const { data: existing, error: dupErr } = await client
      .from("crm_companies")
      .select("id, domain")
      .eq("org_id", orgId)
      .not("domain", "is", null);
    if (dupErr) {
      console.error("[crm/creates] company duplicate scan failed:", dupErr.message);
      return { ok: false, error: { code: "INTERNAL_ERROR", message: "Failed to create company." } };
    }
    const clash = (existing ?? []).some((row) => row.domain && normalizeDomain(row.domain) === normalized);
    if (clash) {
      return {
        ok: false,
        error: { code: "DUPLICATE", message: "A company with this domain already exists in your organization." },
      };
    }
  }

  const { data, error } = await client
    .from("crm_companies")
    .insert({
      org_id: orgId,
      name,
      domain: normalized,
      industry,
      status,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[crm/creates] company insert failed:", error?.message);
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "Failed to create company." } };
  }
  return { ok: true, data };
}

export async function createContact(
  input: CreateContactInput,
  { orgId, client }: CreateCtx,
): Promise<CreateResult<Database["public"]["Tables"]["crm_contacts"]["Row"]>> {
  const parsed = createContactSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);

  const { name, email, role_title, company_id } = parsed.data;
  const normalizedEmail = email ? normalizeEmail(email) : null;

  if (company_id) {
    const { data: company, error: companyErr } = await client
      .from("crm_companies")
      .select("id")
      .eq("id", company_id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (companyErr) {
      console.error("[crm/creates] contact company check failed:", companyErr.message);
      return { ok: false, error: { code: "INTERNAL_ERROR", message: "Failed to create contact." } };
    }
    if (!company) {
      return { ok: false, error: { code: "VALIDATION", message: "Company not found in your organization." } };
    }
  }

  if (normalizedEmail) {
    const { data: existing, error: dupErr } = await client
      .from("crm_contacts")
      .select("id, email")
      .eq("org_id", orgId);
    if (dupErr) {
      console.error("[crm/creates] contact duplicate scan failed:", dupErr.message);
      return { ok: false, error: { code: "INTERNAL_ERROR", message: "Failed to create contact." } };
    }
    const clash = (existing ?? []).some((row) =>
      normalizeContactFields(row.email).some((entry) => normalizeEmail(entry.value) === normalizedEmail),
    );
    if (clash) {
      return {
        ok: false,
        error: { code: "DUPLICATE", message: "A contact with this email already exists in your organization." },
      };
    }
  }

  const emailJson: Json = normalizedEmail ? [{ value: normalizedEmail, type: "work", primary: true }] : [];

  const { data, error } = await client
    .from("crm_contacts")
    .insert({
      org_id: orgId,
      name,
      email: emailJson,
      phone: [],
      role_title,
      company_id,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[crm/creates] contact insert failed:", error?.message);
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "Failed to create contact." } };
  }
  return { ok: true, data };
}

export async function createDeal(
  input: CreateDealInput,
  { orgId, client }: CreateCtx,
): Promise<CreateResult<Database["public"]["Tables"]["crm_deals"]["Row"]>> {
  const parsed = createDealSchema.safeParse(input);
  if (!parsed.success) return zodFail(parsed.error);

  const { company_id, stage, value, currency } = parsed.data;

  const { data: company, error: companyErr } = await client
    .from("crm_companies")
    .select("id")
    .eq("id", company_id)
    .eq("org_id", orgId)
    .maybeSingle();
  if (companyErr) {
    console.error("[crm/creates] deal company check failed:", companyErr.message);
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "Failed to create deal." } };
  }
  if (!company) {
    return { ok: false, error: { code: "VALIDATION", message: "Company not found in your organization." } };
  }

  const { data, error } = await client
    .from("crm_deals")
    .insert({
      org_id: orgId,
      company_id,
      stage,
      value,
      currency,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[crm/creates] deal insert failed:", error?.message);
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "Failed to create deal." } };
  }
  return { ok: true, data };
}
