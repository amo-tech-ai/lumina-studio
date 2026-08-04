import { createTool } from "@mastra/core/tools";
import type { RequestContext } from "@mastra/core/request-context";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { getCrmUserClient } from "./crm/_shared";

/**
 * AGENT-CTX-001 — server-side consumer for the context CopilotKit attaches to
 * every agent run.
 *
 * Client side, the operator UI registers page context via `useAgentContext`
 * (`shoot-detail-context.tsx`, `shoot-wizard-context.tsx`, operator-panel
 * brand/route contexts). `@ag-ui/mastra`'s `MastraAgent` writes that payload
 * into the per-run `RequestContext` under the `ag-ui` key (`applyInputContext`),
 * which Mastra forwards to every tool execute as `context.requestContext`.
 *
 * Nothing in the app ever read that key before this tool, so the context
 * travelled to the server and was dropped — the model never saw the open
 * shoot/brand. This tool is the read end of that wire.
 *
 * Trust model: the payload is browser-supplied, so `shoot_id`/`brand_id` are
 * operator CLAIMS, not facts. `verifyPageContextClaims` resolves every claim
 * against the authenticated operator's org (identity from `requestToken` ALS,
 * same pattern as the CRM tools) and marks entries verified only when the
 * claim survives. Unverified entries keep their description but lose their
 * value — the model must never act on an ID it has not been shown to own.
 */

/** One context entry as registered by `useAgentContext` client-side. */
export interface PageContextEntry {
  description: string;
  value: Record<string, unknown>;
}

export interface PageContextResult {
  available: boolean;
  contexts: PageContextEntry[];
}

/** Entry after org verification: `verified: true` means every ID claim held. */
export interface VerifiedPageContextEntry extends PageContextEntry {
  verified: boolean;
}

export interface VerifiedPageContextResult {
  available: boolean;
  contexts: VerifiedPageContextEntry[];
}

const AG_UI_KEY = "ag-ui";

function isEntry(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Pure, exported so the `ag-ui` contract is unit-testable without building a
 * full tool execution context. Returns every context entry attached to the
 * turn (there is usually one — e.g. the shoot-detail context — but the route
 * and active-brand contexts also flow in on operator pages).
 */
export function readPageContextFromRequestContext(
  requestContext?: RequestContext,
): PageContextResult {
  const agUi = requestContext?.get(AG_UI_KEY) as { context?: unknown } | undefined;
  const raw = Array.isArray(agUi?.context) ? agUi.context : [];
  const contexts = raw
    .filter(isEntry)
    .map((entry) => ({
      description: typeof entry.description === "string" ? entry.description : "",
      value:
        isEntry(entry.value) && !Array.isArray(entry.value)
          ? (entry.value as Record<string, unknown>)
          : {},
    }))
    .filter((entry) => entry.description !== "" || Object.keys(entry.value).length > 0);
  return { available: contexts.length > 0, contexts };
}

type IdClaims = { shootId?: string; brandId?: string };

function claimsOf(value: Record<string, unknown>): IdClaims {
  return {
    shootId: typeof value.shoot_id === "string" && value.shoot_id ? value.shoot_id : undefined,
    brandId: typeof value.brand_id === "string" && value.brand_id ? value.brand_id : undefined,
  };
}

function hasClaims(claims: IdClaims): boolean {
  return Boolean(claims.shootId || claims.brandId);
}

export type PageContextIdentity = { client: SupabaseClient; orgId: string };

type ShootRow = { id: string; brand_id: string | null };
type BrandRow = { id: string; org_id: string | null };

/** Fail-closed conversion: entries carrying ID claims are stripped of value. */
function stripUnverified(
  available: boolean,
  claims: { entry: PageContextEntry; claims: IdClaims }[],
): VerifiedPageContextResult {
  return {
    available,
    contexts: claims.map(({ entry, claims: c }) =>
      hasClaims(c) ? { ...entry, value: {}, verified: false } : { ...entry, verified: true },
    ),
  };
}

/**
 * Org-verification for browser-supplied context claims. Batches all `shoot_id`
 * claims through `shoot_portfolio_view` (RLS user-scoped) cross-checked against
 * the operator's full `brands.org_id` membership, and every `brand_id` claim
 * directly against that same membership — the same belt-and-suspenders pattern
 * as planner/queries.ts `listEligibleEntities`. The org brand set is loaded
 * wholesale (not just the claimed IDs) so a shoot-only claim can still resolve
 * its own brand: a shoot the operator can see is only trustworthy when its
 * brand belongs to their org. Any DB error fails closed (claims → unverified).
 */
export async function verifyPageContextClaims(
  result: PageContextResult,
  identity: PageContextIdentity | null,
): Promise<VerifiedPageContextResult> {
  const { contexts } = result;

  const claims = contexts.map((entry) => ({ entry, claims: claimsOf(entry.value) }));
  const shootIds = [
    ...new Set(
      claims
        .map((c) => c.claims.shootId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  if (!identity) {
    return stripUnverified(result.available, claims);
  }

  const [shootsRes, brandsRes] = await Promise.all([
    shootIds.length
      ? identity.client
          .from("shoot_portfolio_view")
          .select("id, brand_id")
          .in("id", shootIds)
      : Promise.resolve({ data: [] as ShootRow[], error: null }),
    identity.client.from("brands").select("id, org_id").eq("org_id", identity.orgId),
  ]);

  if (shootsRes.error || brandsRes.error) {
    return stripUnverified(result.available, claims);
  }

  const orgBrandIds = new Set((brandsRes.data ?? []).map((row) => row.id));
  const shootRows = new Map((shootsRes.data ?? []).map((row) => [row.id, row]));

  const verifiedContexts: VerifiedPageContextEntry[] = claims.map(({ entry, claims: c }) => {
    if (!hasClaims(c)) return { ...entry, verified: true };
    let ok = true;
    if (c.brandId) ok = ok && orgBrandIds.has(c.brandId);
    if (ok && c.shootId) {
      const row = shootRows.get(c.shootId);
      ok = Boolean(row) && (!row!.brand_id || orgBrandIds.has(row!.brand_id));
      // The claimed brand must be the shoot's actual brand — a foreign brand
      // claim alongside a real shoot_id must not survive either.
      if (ok && c.brandId) ok = row!.brand_id === c.brandId;
    }
    return ok ? { ...entry, verified: true } : { ...entry, value: {}, verified: false };
  });

  return { available: result.available, contexts: verifiedContexts };
}

/** Resolve the authenticated operator identity for claim verification. */
async function resolvePageContextIdentity(): Promise<PageContextIdentity | null> {
  const ctx = await getCrmUserClient();
  if (!ctx.client) return null;
  return { client: ctx.client, orgId: ctx.orgId };
}

export const getCurrentPageContext = createTool({
  id: "getCurrentPageContext",
  description:
    "Read the page context CopilotKit attached to this conversation turn — the screen the operator is viewing right now (e.g. the open shoot, its brand, status, shot/deliverable counts). Pure read, no side effects. Call this FIRST whenever the operator refers to 'this shoot', 'the current shoot', 'the open brand', or asks about the page they are on, so you never ask them to paste IDs the context already has. shoot_id / brand_id values are org-verified server-side (verified: true); never act on unverified IDs.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    available: z.boolean(),
    contexts: z.array(
      z.object({
        description: z.string(),
        value: z.record(z.string(), z.unknown()),
        verified: z.boolean(),
      }),
    ),
  }),
  execute: async (_input, { requestContext }) => {
    const raw = readPageContextFromRequestContext(requestContext);
    if (!raw.available) return { available: false, contexts: [] };
    const identity = await resolvePageContextIdentity();
    return verifyPageContextClaims(raw, identity);
  },
});
