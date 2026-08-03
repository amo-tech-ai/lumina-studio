// IPI-32 — Brand Intelligence Mastra Workflow
// Orchestrates: crawl → profile → enrichment → HITL approval → commit
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { socialDiscoveryAgent, visualIdentityAgent } from "../agents";
import {
  assertBrandProfile,
  brandProfileContractSchema,
  brandProfileStepOutputSchema,
  enrichmentStepOutputSchema,
  stripBrandProfileMeta,
  type BrandProfilePayload,
} from "@/lib/brand/brand-profile-contract";
import { discardBrandDraft } from "@/lib/brand/discard-draft";
import { promoteBrandDraft } from "@/lib/brand/promote-draft";

const IDEMPOTENT_DRAFT_STATE_ERROR = "Brand is not in draft_ready state";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
<<<<<<< HEAD
  if (!url || !key) throw new Error("Supabase service-role env vars not set");
=======
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — brand-intelligence start-crawl requires the service-role key after IPI-817 (operator JWTs are no longer passed into the workflow)",
    );
  }
>>>>>>> origin/main
  return createClient(url, key, { auth: { persistSession: false } });
}

function edgeFnUrl(fn: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL not set");
  return `${url}/functions/v1/${fn}`;
}

/** Upper bound on upstream text copied into a workflow error. */
const FAILURE_DETAIL_LIMIT = 500;

/**
 * Flatten and cap untrusted upstream text before it goes into an Error message.
 *
 * The edge fn body is not guaranteed to be small or safe to echo — a gateway can return a
 * multi-megabyte HTML page, and the workflow error is persisted in Mastra run state and read
 * back into the UI, so an unbounded copy is both a storage and a disclosure problem (see
 * IPI-817 on keeping credentials out of brand analysis snapshots). Whitespace is collapsed so
 * a stack trace or HTML block cannot smuggle newlines into a single-line log record.
 */
function boundDetail(raw: string): string {
  const flat = raw.replace(/\s+/g, " ").trim();
  if (!flat) return "(empty response body)";
  return flat.length > FAILURE_DETAIL_LIMIT
    ? `${flat.slice(0, FAILURE_DETAIL_LIMIT)}… [truncated, ${flat.length} chars]`
    : flat;
}

/**
 * Record the analysis as failed, then build the error to throw.
 *
 * Returns rather than throws so callers keep an explicit `throw`, which is what makes the
 * control flow readable at the call site. If the status write itself fails, that is surfaced
 * alongside the original cause instead of replacing it — losing the upstream reason would
 * make the failure much harder to diagnose, and silently reporting "marked failed" when the
 * write did not land is exactly the kind of lie this step used to tell.
 */
async function failAnalysis(
  sb: ReturnType<typeof adminClient>,
  brandId: string,
  summary: string,
  detail: string,
): Promise<Error> {
  const { error: writeErr } = await sb
    .from("brands")
    .update({ intake_status: "failed", updated_at: new Date().toISOString() })
    .eq("id", brandId);
  const parts = [`${summary}: ${boundDetail(detail)}`];
  if (writeErr) {
    parts.push(`intake_status=failed was NOT recorded: ${boundDetail(writeErr.message)}`);
  }
  return new Error(parts.join(" — "));
}

// Step 1: validate brand exists and return basic info
export const validateBrand = createStep({
  id: "validate-brand",
  inputSchema: z.object({
    brandId: z.string().uuid(),
    actorId: z.string().uuid(),
<<<<<<< HEAD
    accessToken: z.string(),
=======
>>>>>>> origin/main
  }),
  outputSchema: z.object({
    brandId: z.string(),
    brandUrl: z.string(),
    brandName: z.string(),
  }),
  execute: async ({ inputData, getInitData }) => {
    // actorId is verified at the request boundary; re-checked here as defense in
    // depth so a run can never outlive the caller's authorization (IPI-812).
    const { actorId } = getInitData<{ actorId: string }>();
    const sb = adminClient();
    const { data: brand, error } = await sb
      .from("brands")
      .select("id, brand_url, name, org_id, user_id")
      .eq("id", inputData.brandId)
      .maybeSingle();
    // Split the two cases: a DB/network failure must not be reported as "not found".
    if (error) throw new Error(`Failed to read brand ${inputData.brandId}: ${error.message}`);
    if (!brand) throw new Error(`Brand not found: ${inputData.brandId}`);

    // Service role bypasses RLS and auth.uid() is NULL here, so is_org_editor_or_above
    // would always return false — check membership against actorId directly instead.
    if (brand.org_id) {
      const { data: member, error: memberErr } = await sb
        .from("org_members")
        .select("role")
        .eq("org_id", brand.org_id)
        .eq("user_id", actorId)
        .maybeSingle();
      if (memberErr) throw new Error(`Failed to check org membership: ${memberErr.message}`);
      if (!member || !["owner", "editor"].includes(member.role)) {
        throw new Error("Not authorized to analyze this brand");
      }
    } else if (brand.user_id !== actorId) {
      throw new Error("Not authorized to analyze this brand");
    }

    if (!brand.brand_url) throw new Error("Brand has no website URL");
    // Atomic guard: only proceed if brand is not already in a running/ready state.
    // Mirrors the reanalyzeBrand action pattern to prevent concurrent run corruption.
    const { error: statusErr } = await sb
      .from("brands")
      .update({ intake_status: "crawl_running", updated_at: new Date().toISOString() })
      .eq("id", inputData.brandId)
      .not("intake_status", "in", "(crawl_running,crawl_complete,analysis_running,scores_complete,draft_ready)")
      .select("id")
      .single();
    if (statusErr) throw new Error("Brand analysis already in progress or has an approved draft — duplicate run prevented");
    return { brandId: brand.id, brandUrl: brand.brand_url, brandName: brand.name };
  },
});

<<<<<<< HEAD
// Step 2: start Firecrawl crawl, pass runId as workflowId for webhook resume
const startCrawl = createStep({
=======
// Step 2: start Firecrawl crawl, pass runId as workflowId for webhook resume.
// Uses the service-role credential + verified actorId (IPI-817) — never the
// operator JWT, which Mastra would otherwise persist in workflow snapshots.
export const startCrawl = createStep({
>>>>>>> origin/main
  id: "start-crawl",
  inputSchema: z.object({
    brandId: z.string(),
    brandUrl: z.string(),
    brandName: z.string(),
  }),
  outputSchema: z.object({ crawlId: z.string() }),
  execute: async ({ inputData, runId, getInitData }) => {
<<<<<<< HEAD
    const { accessToken } = getInitData<{ accessToken: string }>();
    try {
=======
    const { actorId } = getInitData<{ actorId: string }>();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is not set — start-crawl calls start-brand-crawl with the service-role credential + actorId after IPI-817",
      );
    }
    try {
      // Mirror extract-profile: Bearer service key only — do not send anon apikey
      // alongside it (gateway rejects conflicting API keys on this project).
      // adminClient() is the local helper above (not @/lib/supabase/admin).
>>>>>>> origin/main
      const res = await fetch(edgeFnUrl("start-brand-crawl"), {
        method: "POST",
        signal: AbortSignal.timeout(30_000),
        headers: {
          "Content-Type": "application/json",
<<<<<<< HEAD
          Authorization: `Bearer ${accessToken}`,
=======
          Authorization: `Bearer ${serviceKey}`,
>>>>>>> origin/main
        },
        body: JSON.stringify({
          brandId: inputData.brandId,
          url: inputData.brandUrl,
<<<<<<< HEAD
=======
          actorId,
>>>>>>> origin/main
          workflowId: runId,
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        throw new Error(`start-brand-crawl failed ${res.status}: ${msg}`);
      }
<<<<<<< HEAD
      const data = (await res.json()) as { crawlId: string };
      if (!data.crawlId) throw new Error("start-brand-crawl returned no crawlId");
      return { crawlId: data.crawlId };
=======
      const body = (await res.json()) as {
        crawlId?: string;
        data?: { crawlId?: string };
      };
      // Edge returns `{ ok: true, data: { crawlId } }`; tolerate a flat shape too.
      const crawlId = body.data?.crawlId ?? body.crawlId;
      if (!crawlId) throw new Error("start-brand-crawl returned no crawlId");
      return { crawlId };
>>>>>>> origin/main
    } catch (err) {
      // Reset status so the brand isn't permanently locked in crawl_running
      await adminClient()
        .from("brands")
        .update({ intake_status: "failed", updated_at: new Date().toISOString() })
        .eq("id", inputData.brandId);
      throw err;
    }
  },
});

// Step 3: suspend until firecrawl-webhook resumes us
const waitForCrawl = createStep({
  id: "wait-for-crawl",
  inputSchema: z.object({ crawlId: z.string() }),
  outputSchema: z.object({ crawlId: z.string() }),
  resumeSchema: z.object({ crawlId: z.string(), failed: z.boolean().optional(), error: z.string().optional() }),
  suspendSchema: z.object({ crawlId: z.string() }),
  execute: async ({ inputData, suspend, resumeData }) => {
    if (!resumeData) return await suspend({ crawlId: inputData.crawlId });
    if (resumeData.failed) throw new Error(`Crawl failed: ${resumeData.error ?? "unknown"}`);
    if (resumeData.crawlId !== inputData.crawlId) {
      throw new Error(`Crawl ID mismatch: expected ${inputData.crawlId}, got ${resumeData.crawlId}`);
    }
    return { crawlId: resumeData.crawlId };
  },
});

// Step 4: run Gemini profile + scoring via brand-intelligence edge fn
// Exported for unit tests (edge-fn non-2xx must abort the run).
// IPI-834 — output is the validated Brand DNA contract (not { ok: boolean }).
export const extractProfile = createStep({
  id: "extract-profile",
  inputSchema: z.object({ crawlId: z.string() }),
  outputSchema: brandProfileStepOutputSchema,
  execute: async ({ inputData, getInitData }) => {
    const { brandId } = getInitData<{ brandId: string }>();
    const sb = adminClient();

    const { data: brand, error: brandErr } = await sb
      .from("brands")
      .select("brand_url")
      .eq("id", brandId)
      .single();
    if (brandErr || !brand?.brand_url) throw new Error(`Brand URL not found: ${brandErr?.message}`);

    const { error: statusErr } = await sb
      .from("brands")
      .update({ intake_status: "analysis_running", updated_at: new Date().toISOString() })
      .eq("id", brandId);
    if (statusErr) throw new Error(`intake_status update: ${statusErr.message}`);

    // Use service role key — user JWT may be expired after a long crawl (>1h)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
    let res: Response;
    try {
      res = await fetch(edgeFnUrl("brand-intelligence"), {
        method: "POST",
        signal: AbortSignal.timeout(120_000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ brandId, url: brand.brand_url, crawlResultId: inputData.crawlId, draft_mode: true }),
      });
    } catch (cause) {
      // A refused connection, a DNS failure or the 120s AbortSignal.timeout firing all land
      // here. The product outcome is identical to a non-2xx — the analysis did not happen —
      // but this path used to skip the status write entirely and leave the brand pinned at
      // "analysis_running" forever, which reads as "still working" in the UI and blocks the
      // start guard from ever allowing a retry.
      throw await failAnalysis(
        sb,
        brandId,
        "brand-intelligence edge fn unreachable",
        cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause),
      );
    }
    // On success, the edge fn sets intake_status: "draft_ready" itself — don't overwrite.
    //
    // IPI-807 P0b — a non-2xx aborts the run. This previously warned, marked the brand
    // failed and returned { ok: false }, on the stated grounds that a partial brand
    // "might still be partially useful". It never delivered that:
    //   * save-draft-and-wait (step 6) then set intake_status: "draft_ready", overwriting
    //     the "failed" written here, so the failure signal was erased and the update
    //     below was dead code;
    //   * the draft it filed read ai_profile_draft, which only the edge fn writes — so on
    //     failure the profile was empty, or worse, stale output from an earlier
    //     successful run, because the upsert keys on brand_id;
    //   * the { ok } flag was never read — fan-out-enrichment accepts it and ignores it.
    // So the operator saw "draft ready" with nothing behind it. Failing closed keeps
    // "failed" visible, files no draft, and gives IPI-813's onError hook something to fire
    // on. Presenting a clearly-marked incomplete draft is a real feature (persisted flag
    // plus brand detail UI) and is tracked separately.
    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText);
      throw await failAnalysis(sb, brandId, `brand-intelligence edge fn ${res.status}`, detail);
    }

    // IPI-834 — re-read draft and fail closed on contract mismatch. Do not rewrite
    // ai_profile_draft here (leave Edge's write untouched on invalid shapes).
    const { data: draftRow, error: draftReadErr } = await sb
      .from("brands")
      .select("ai_profile_draft")
      .eq("id", brandId)
      .single();
    if (draftReadErr) {
      throw await failAnalysis(sb, brandId, "Failed to read ai_profile_draft", draftReadErr.message);
    }
    const stripped = stripBrandProfileMeta(
      draftRow?.ai_profile_draft as Record<string, unknown> | null,
    );
    try {
      const profile = assertBrandProfile(stripped);
      return { profile };
    } catch (cause) {
      throw await failAnalysis(
        sb,
        brandId,
        "Brand DNA contract validation failed",
        cause instanceof Error ? cause.message : String(cause),
      );
    }
  },
});

// Step 5: parallel social + visual enrichment (best-effort)
// Exported for unit tests. IPI-834 — passes the validated profile through (not { enriched }).
export const fanOutEnrichment = createStep({
  id: "fan-out-enrichment",
  inputSchema: brandProfileStepOutputSchema,
  outputSchema: enrichmentStepOutputSchema,
  execute: async ({ inputData, getInitData }) => {
    const { brandId } = getInitData<{ brandId: string }>();
    // Re-assert at the step boundary so a corrupted upstream cannot skip the contract.
    const profile = assertBrandProfile(inputData.profile);
    const prompt = `Discover and save enrichment data for brandId: ${brandId}`;
    // ponytail: allSettled — enrichment failure must not block HITL approval
    const [social, visual] = await Promise.allSettled([
      socialDiscoveryAgent.generate(prompt),
      visualIdentityAgent.generate(prompt),
    ]);
    if (social.status === "rejected") console.warn("social-discovery failed:", social.reason);
    if (visual.status === "rejected") console.warn("visual-identity failed:", visual.reason);
    return {
      profile,
      enrichment: {
        socialOk: social.status === "fulfilled",
        visualOk: visual.status === "fulfilled",
      },
    };
  },
});

// Step 6: write draft record and suspend for HITL approval
export const saveDraftAndWait = createStep({
  id: "save-draft-and-wait",
  inputSchema: enrichmentStepOutputSchema,
  outputSchema: z.object({ draftId: z.string() }),
  resumeSchema: z.object({ approved: z.boolean() }),
  suspendSchema: z.object({ brandId: z.string(), draftId: z.string() }),
  execute: async ({ inputData, suspend, resumeData, suspendData, getInitData, runId }) => {
    const { brandId, actorId } = getInitData<{
      brandId: string;
      actorId: string;
    }>();

    if (!resumeData) {
      // Contract already enforced upstream — re-check so invalid agent output never upserts.
      assertBrandProfile(inputData.profile);

      const sb = adminClient();
      const { data: brandRow, error: brandRowErr } = await sb
        .from("brands")
        .select("brand_url, ai_profile_draft")
        .eq("id", brandId)
        .single();
      if (brandRowErr) throw new Error(`Failed to fetch brand for draft: ${brandRowErr.message}`);
      // edge fn writes ai_profile_draft + embeds _draft_scores when draft_mode:true
      const draftProfile = brandRow?.ai_profile_draft as Record<string, unknown> | null ?? null;
      const scores = Array.isArray(draftProfile?._draft_scores) ? draftProfile._draft_scores : [];

      // Fail closed before upsert when the stored draft no longer matches the contract.
      const storedContract = stripBrandProfileMeta(draftProfile);
      assertBrandProfile(storedContract);

      // Strip _draft_scores from profile — it belongs in the dedicated column.
      const cleanDraftProfile =
        draftProfile && typeof draftProfile === "object"
          ? Object.fromEntries(
              Object.entries(draftProfile).filter(([key]) => key !== "_draft_scores"),
            )
          : {};
      const { data: draft, error } = await sb
        .from("brand_intake_drafts")
        .upsert(
          {
            brand_id: brandId,
            user_id: actorId,
            source_url: brandRow?.brand_url ?? "",
            status: "pending_approval",
            approved_at: null,
            rejected_at: null,
            expires_at: null,
            draft_profile: {
              ...cleanDraftProfile,
              _workflow_run_id: runId,
            },
            draft_scores: scores,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "brand_id" },
        )
        .select("id")
        .single();
      if (error || !draft) throw new Error(`Failed to upsert brand_intake_drafts: ${error?.message}`);
      // Mark draft_ready so the start guard blocks concurrent runs during HITL suspension
      const { error: draftReadyErr } = await sb
        .from("brands")
        .update({ intake_status: "draft_ready", updated_at: new Date().toISOString() })
        .eq("id", brandId);
      if (draftReadyErr) throw new Error(`Failed to mark draft ready: ${draftReadyErr.message}`);
      return await suspend({ brandId, draftId: draft.id });
    }
    // suspendData is persisted by Mastra from the suspend() call above — no DB query needed.
    if (!suspendData?.draftId) throw new Error(`Draft not found for run: ${runId}`);
    return { draftId: suspendData.draftId };
  },
});

// Re-export for structuredOutput / callers that want the fail-closed Zod wrapper
// (delegates to validateBrandProfilePayload — same rules as Edge).
export { brandProfileContractSchema };
export type { BrandProfilePayload };

// Step 7: commit (approved → promote) or reject (discard) — idempotent with HITL handlers
const commitOrReject = createStep({
  id: "commit-or-reject",
  inputSchema: z.object({ draftId: z.string() }),
  outputSchema: z.object({ status: z.string() }),
  execute: async ({ inputData, getInitData, runId }) => {
    const { draftId } = inputData;
    const { brandId } = getInitData<{ brandId: string }>();
    const sb = adminClient();
    const { data: draft, error: draftErr } = await sb
      .from("brand_intake_drafts")
      .select("status")
      .eq("id", draftId)
      .single();
    if (draftErr) throw new Error(`Failed to read draft: ${draftErr.message}`);

    const approved = draft?.status === "approved";

    if (approved) {
      const promoteResult = await promoteBrandDraft(sb, brandId);
      if (!promoteResult.ok && promoteResult.error !== IDEMPOTENT_DRAFT_STATE_ERROR) {
        throw new Error(`Failed to promote draft: ${promoteResult.error}`);
      }
    } else {
      const discardResult = await discardBrandDraft(sb, brandId);
      if (!discardResult.ok && discardResult.error !== IDEMPOTENT_DRAFT_STATE_ERROR) {
        throw new Error(`Failed to discard draft: ${discardResult.error}`);
      }
    }

    const { data: brand, error: brandErr } = await sb
      .from("brands")
      .select("intake_status")
      .eq("id", brandId)
      .single();
    if (brandErr) throw new Error(`Failed to read brand status: ${brandErr.message}`);

    const status = brand?.intake_status ?? (approved ? "ready" : "brand_created");
    console.info(
      `[brand-intelligence:${runId}] ${approved ? "committed" : "rejected"} brand ${brandId} → ${status}`,
    );
    return { status };
  },
});

export const brandIntelligenceWorkflow = createWorkflow({
  id: "brand-intelligence",
  description: "Crawl → profile → enrichment → HITL approval → commit",
  inputSchema: z.object({
    brandId: z.string().uuid(),
    // Verified JWT subject. Must be a real UUID — the old `userId: z.string()`
    // accepted the "dev-unauthenticated" operator-gate fallback (IPI-812).
<<<<<<< HEAD
    actorId: z.string().uuid(),
    brandUrl: z.string().optional(),
    accessToken: z.string(),
=======
    // No accessToken: start-crawl uses SUPABASE_SERVICE_ROLE_KEY + actorId (IPI-817).
    actorId: z.string().uuid(),
    brandUrl: z.string().optional(),
>>>>>>> origin/main
  }),
  outputSchema: z.object({ status: z.string() }),
  steps: [validateBrand, startCrawl, waitForCrawl, extractProfile, fanOutEnrichment, saveDraftAndWait, commitOrReject],
})
  .then(validateBrand)
  .then(startCrawl)
  .then(waitForCrawl)
  .then(extractProfile)
  .then(fanOutEnrichment)
  .then(saveDraftAndWait)
  .then(commitOrReject)
  .commit();
