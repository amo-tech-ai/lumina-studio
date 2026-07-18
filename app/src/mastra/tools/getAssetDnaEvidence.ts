// IPI-261 · DESIGN-077 — getAssetDnaEvidence Mastra tool
// Read-only, RLS-scoped lookup of EXISTING asset DNA scores for the
// creative-director agent's /app/assets asset-intelligence flow.
//
// Critical safety rule (from the Linear spec): this tool must never call the
// `audit-asset-dna` edge function — that function performs new Gemini vision
// inference AND writes dna_score/dna_status/dna_pillars in the same request
// (supabase/functions/audit-asset-dna/handler.ts:287,358-364). Calling it
// here would be an unapproved write. getAssetDnaEvidence only ever reads
// columns that already exist on `assets`.
//
// RLS scoping: Mastra tools run outside the Next.js request/cookie context,
// so the cookie-based createSupabaseServerClient() (app/src/lib/supabase/server.ts)
// is not reachable here (see lookupChannelSpecs.ts's note on the same
// limitation). Instead this follows the established Mastra-tool RLS pattern
// used by talent-match-tools.ts, crm/_shared.ts, and booking-tools.ts:
// requestToken (AsyncLocalStorage, populated per-request in
// app/api/copilotkit/[[...slug]]/route.ts) + createUserScopedClient() builds
// a Supabase client authenticated as the operator's own JWT, so Postgres RLS
// (assets_select_via_brand) enforces brand ownership — not application code.
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createUserScopedClient } from "@/lib/shoot/commit-shoot-draft";
import { requestToken } from "@/lib/request-token";
import {
  AssetDnaEvidenceSchema,
  DNA_PILLAR_KEYS,
  type AssetDnaPillars,
} from "./asset-intelligence-schemas";

type AssetRow = {
  id: string;
  brand_id: string | null;
  dna_score: number | string | null;
  dna_status: string | null;
  dna_pillars: unknown;
};

/**
 * Pure, deterministic parser for the `assets.dna_pillars` jsonb column.
 * Exported for isolated unit testing — never assumes the DB payload is
 * well-formed (asset never audited → `{}`, partial legacy rows, or
 * hand-edited jsonb with the wrong shape).
 */
export function parseDnaPillars(raw: unknown): {
  pillars: AssetDnaPillars | null;
  malformed: boolean;
} {
  if (raw === null || raw === undefined) {
    return { pillars: null, malformed: false };
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { pillars: null, malformed: true };
  }

  const obj = raw as Record<string, unknown>;
  if (Object.keys(obj).length === 0) {
    // Asset registered but never audited — not malformed, just no data yet.
    return { pillars: null, malformed: false };
  }

  const hasAnyPillarKey = DNA_PILLAR_KEYS.some((key) => key in obj);
  let malformed = !hasAnyPillarKey;

  const pillars: AssetDnaPillars = {
    brandConsistency: null,
    compositionQuality: null,
    channelReadiness: null,
    productClarity: null,
    rationale: null,
  };

  for (const key of DNA_PILLAR_KEYS) {
    const value = obj[key];
    if (value === undefined || value === null) continue;
    if (typeof value === "number" && Number.isFinite(value)) {
      pillars[key] = value;
    } else {
      malformed = true;
    }
  }

  if (typeof obj.rationale === "string") {
    pillars.rationale = obj.rationale;
  } else if (obj.rationale !== undefined && obj.rationale !== null) {
    malformed = true;
  }

  return { pillars, malformed };
}

export const getAssetDnaEvidence = createTool({
  id: "getAssetDnaEvidence",
  description:
    "Read the EXISTING brand-DNA score, status, and pillar breakdown for one or more assets. " +
    "Read-only and RLS-scoped to the operator's own brands — zero model calls, zero writes. " +
    "Does NOT run a new DNA audit or change any stored score; use this to explain data that already exists. " +
    "Requires explicit assetIds (no implicit bulk-selection).",
  inputSchema: z.object({
    assetIds: z
      .array(z.string().uuid())
      .min(1)
      .max(50)
      .describe("Explicit asset IDs to look up"),
  }),
  outputSchema: z.object({
    evidence: z.array(AssetDnaEvidenceSchema),
    notFoundCount: z.number(),
  }),
  execute: async ({ assetIds }) => {
    const accessToken = requestToken.getStore();
    if (!accessToken) throw new Error("Access token not available in request context");

    const supabase = createUserScopedClient(accessToken);
    const { data, error } = await supabase
      .from("assets")
      .select("id, brand_id, dna_score, dna_status, dna_pillars")
      .in("id", assetIds);

    if (error) throw new Error(`getAssetDnaEvidence failed: ${error.message}`);

    const rows = (data ?? []) as AssetRow[];
    const byId = new Map(rows.map((row) => [row.id, row]));

    const evidence = assetIds.map((assetId) => {
      const row = byId.get(assetId);
      if (!row) {
        return {
          assetId,
          brandId: null,
          found: false,
          dnaScore: null,
          dnaStatus: null,
          pillars: null,
          pillarsMalformed: false,
          error: "Asset not found or not accessible",
        };
      }

      const { pillars, malformed } = parseDnaPillars(row.dna_pillars);
      return {
        assetId: row.id,
        brandId: row.brand_id,
        found: true,
        dnaScore: row.dna_score === null ? null : Number(row.dna_score),
        dnaStatus: row.dna_status,
        pillars,
        pillarsMalformed: malformed,
        error: null,
      };
    });

    return {
      evidence,
      notFoundCount: evidence.filter((item) => !item.found).length,
    };
  },
});
