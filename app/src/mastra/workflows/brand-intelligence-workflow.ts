// IPI-32 — Brand Intelligence Mastra Workflow
// Orchestrates: crawl → profile → enrichment → HITL approval → commit
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { socialDiscoveryAgent, visualIdentityAgent } from "../agents";
import { discardBrandDraft } from "@/lib/brand/discard-draft";
import { promoteBrandDraft } from "@/lib/brand/promote-draft";

const IDEMPOTENT_DRAFT_STATE_ERROR = "Brand is not in draft_ready state";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service-role env vars not set");
  return createClient(url, key, { auth: { persistSession: false } });
}

function edgeFnUrl(fn: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL not set");
  return `${url}/functions/v1/${fn}`;
}

// Step 1: validate brand exists and return basic info
const validateBrand = createStep({
  id: "validate-brand",
  inputSchema: z.object({
    brandId: z.string().uuid(),
    accessToken: z.string(),
  }),
  outputSchema: z.object({
    brandId: z.string(),
    brandUrl: z.string(),
    brandName: z.string(),
  }),
  execute: async ({ inputData, getInitData }) => {
    const { userId } = getInitData<{ userId: string }>();
    const sb = adminClient();
    const { data: brand, error } = await sb
      .from("brands")
      .select("id, brand_url, name")
      .eq("id", inputData.brandId)
      .eq("user_id", userId)
      .single();
    if (error || !brand) throw new Error(`Brand not found or not owned by this user: ${inputData.brandId}`);
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

// Step 2: start Firecrawl crawl, pass runId as workflowId for webhook resume
const startCrawl = createStep({
  id: "start-crawl",
  inputSchema: z.object({
    brandId: z.string(),
    brandUrl: z.string(),
    brandName: z.string(),
  }),
  outputSchema: z.object({ crawlId: z.string() }),
  execute: async ({ inputData, runId, getInitData }) => {
    const { accessToken } = getInitData<{ accessToken: string }>();
    try {
      const res = await fetch(edgeFnUrl("start-brand-crawl"), {
        method: "POST",
        signal: AbortSignal.timeout(30_000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          brandId: inputData.brandId,
          url: inputData.brandUrl,
          workflowId: runId,
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        throw new Error(`start-brand-crawl failed ${res.status}: ${msg}`);
      }
      const data = (await res.json()) as { crawlId: string };
      if (!data.crawlId) throw new Error("start-brand-crawl returned no crawlId");
      return { crawlId: data.crawlId };
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
const extractProfile = createStep({
  id: "extract-profile",
  inputSchema: z.object({ crawlId: z.string() }),
  outputSchema: z.object({ ok: z.boolean() }),
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
    const res = await fetch(edgeFnUrl("brand-intelligence"), {
      method: "POST",
      signal: AbortSignal.timeout(120_000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ brandId, url: brand.brand_url, crawlResultId: inputData.crawlId, draft_mode: true }),
    });
    // ponytail: non-2xx logged but not fatal — brand might still be partially useful.
    // On success, the edge fn sets intake_status: "draft_ready" itself — don't overwrite.
    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      console.warn(`brand-intelligence edge fn ${res.status}: ${msg}`);
      await sb
        .from("brands")
        .update({ intake_status: "failed", updated_at: new Date().toISOString() })
        .eq("id", brandId);
    }
    return { ok: res.ok };
  },
});

// Step 5: parallel social + visual enrichment (best-effort)
// Exported for unit tests (enriched-result branches).
export const fanOutEnrichment = createStep({
  id: "fan-out-enrichment",
  inputSchema: z.object({ ok: z.boolean() }),
  outputSchema: z.object({ enriched: z.boolean() }),
  execute: async ({ getInitData }) => {
    const { brandId } = getInitData<{ brandId: string }>();
    const prompt = `Discover and save enrichment data for brandId: ${brandId}`;
    // ponytail: allSettled — enrichment failure must not block HITL approval
    const [social, visual] = await Promise.allSettled([
      socialDiscoveryAgent.generate(prompt),
      visualIdentityAgent.generate(prompt),
    ]);
    if (social.status === "rejected") console.warn("social-discovery failed:", social.reason);
    if (visual.status === "rejected") console.warn("visual-identity failed:", visual.reason);
    return { enriched: social.status === "fulfilled" || visual.status === "fulfilled" };
  },
});

// Step 6: write draft record and suspend for HITL approval
export const saveDraftAndWait = createStep({
  id: "save-draft-and-wait",
  inputSchema: z.object({ enriched: z.boolean() }),
  outputSchema: z.object({ draftId: z.string() }),
  resumeSchema: z.object({ approved: z.boolean() }),
  suspendSchema: z.object({ brandId: z.string(), draftId: z.string() }),
  execute: async ({ suspend, resumeData, suspendData, getInitData, runId }) => {
    const { brandId, userId } = getInitData<{
      brandId: string;
      userId: string;
    }>();

    if (!resumeData) {
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
            user_id: userId,
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
    userId: z.string(),
    brandUrl: z.string().optional(),
    accessToken: z.string(),
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
