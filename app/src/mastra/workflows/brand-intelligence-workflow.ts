// IPI-32 — Brand Intelligence Mastra Workflow
// Orchestrates: crawl → profile → enrichment → HITL approval → commit
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

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
  execute: async ({ inputData }) => {
    const sb = adminClient();
    const { data: brand, error } = await sb
      .from("brands")
      .select("id, brand_url, name")
      .eq("id", inputData.brandId)
      .single();
    if (error || !brand) throw new Error(`Brand not found: ${inputData.brandId}`);
    if (!brand.brand_url) throw new Error("Brand has no website URL");
    await sb
      .from("brands")
      .update({ intake_status: "crawl_running", updated_at: new Date().toISOString() })
      .eq("id", inputData.brandId);
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
    const res = await fetch(edgeFnUrl("start-brand-crawl"), {
      method: "POST",
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
    if (!resumeData) {
      await suspend({ crawlId: inputData.crawlId });
      // unreachable until resumed
      return { crawlId: inputData.crawlId };
    }
    if (resumeData.failed) throw new Error(`Crawl failed: ${resumeData.error ?? "unknown"}`);
    return { crawlId: resumeData.crawlId };
  },
});

// Step 4: run Gemini profile + scoring via brand-intelligence edge fn
const extractProfile = createStep({
  id: "extract-profile",
  inputSchema: z.object({ crawlId: z.string() }),
  outputSchema: z.object({ ok: z.boolean() }),
  execute: async ({ inputData, getInitData }) => {
    const { brandId, accessToken } = getInitData<{ brandId: string; accessToken: string }>();
    const sb = adminClient();

    const { data: brand, error: brandErr } = await sb
      .from("brands")
      .select("brand_url")
      .eq("id", brandId)
      .single();
    if (brandErr || !brand?.brand_url) throw new Error(`Brand URL not found: ${brandErr?.message}`);

    await sb
      .from("brands")
      .update({ intake_status: "analysis_running", updated_at: new Date().toISOString() })
      .eq("id", brandId);

    const res = await fetch(edgeFnUrl("brand-intelligence"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ brandId, url: brand.brand_url, crawlResultId: inputData.crawlId }),
    });
    // ponytail: non-2xx logged but not fatal — brand might still be partially useful
    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      console.warn(`brand-intelligence edge fn ${res.status}: ${msg}`);
    }
    await sb
      .from("brands")
      .update({ intake_status: res.ok ? "scores_complete" : "scores_failed", updated_at: new Date().toISOString() })
      .eq("id", brandId);
    return { ok: res.ok };
  },
});

// Step 5: parallel social + visual enrichment (best-effort)
const fanOutEnrichment = createStep({
  id: "fan-out-enrichment",
  inputSchema: z.object({ ok: z.boolean() }),
  outputSchema: z.object({ enriched: z.boolean() }),
  execute: async ({ mastra, getInitData }) => {
    const { brandId } = getInitData<{ brandId: string }>();
    const prompt = `Discover and save enrichment data for brandId: ${brandId}`;
    // ponytail: allSettled — enrichment failure does not block approval
    const [social, visual] = await Promise.allSettled([
      mastra?.getAgent("social-discovery")?.generate(prompt),
      mastra?.getAgent("visual-identity")?.generate(prompt),
    ]);
    if (social.status === "rejected") console.warn("social-discovery failed:", social.reason);
    if (visual.status === "rejected") console.warn("visual-identity failed:", visual.reason);
    return { enriched: true };
  },
});

// Step 6: write draft record and suspend for HITL approval
const saveDraftAndWait = createStep({
  id: "save-draft-and-wait",
  inputSchema: z.object({ enriched: z.boolean() }),
  outputSchema: z.object({ draftId: z.string() }),
  resumeSchema: z.object({ approved: z.boolean() }),
  suspendSchema: z.object({ brandId: z.string(), draftId: z.string() }),
  execute: async ({ suspend, resumeData, getInitData, runId }) => {
    const { brandId, userId } = getInitData<{
      brandId: string;
      userId: string;
    }>();

    if (!resumeData) {
      const sb = adminClient();
      const { data: brandRow } = await sb.from("brands").select("brand_url").eq("id", brandId).single();
      const { data: draft, error } = await sb
        .from("brand_intake_drafts")
        .upsert(
          {
            brand_id: brandId,
            user_id: userId,
            source_url: brandRow?.brand_url ?? null,
            status: "pending_approval",
            draft_profile: { _workflow_run_id: runId },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "brand_id" },
        )
        .select("id")
        .single();
      if (error || !draft) throw new Error(`Failed to upsert brand_intake_drafts: ${error?.message}`);
      await suspend({ brandId, draftId: draft.id });
      return { draftId: draft.id };
    }
    // resumed — draftId is in suspend data, retrieve via brand_id
    const sb = adminClient();
    const { data: draft } = await sb
      .from("brand_intake_drafts")
      .select("id")
      .eq("brand_id", brandId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();
    return { draftId: draft?.id ?? "unknown" };
  },
});

// Step 7: commit (approved → ready) or reject (failed)
const commitOrReject = createStep({
  id: "commit-or-reject",
  inputSchema: z.object({ draftId: z.string() }),
  outputSchema: z.object({ status: z.string() }),
  execute: async ({ getInitData, runId }) => {
    const { brandId } = getInitData<{ brandId: string }>();
    // resumeData lives on saveDraftAndWait; we read approved from workflow state
    // ponytail: read workflow state via brand_intake_drafts + approved flag passed from approve route
    const sb = adminClient();
    const { data: draft, error: draftErr } = await sb
      .from("brand_intake_drafts")
      .select("status")
      .eq("brand_id", brandId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();
    if (draftErr) throw new Error(`Failed to read draft: ${draftErr.message}`);

    const approved = draft?.status === "approved";
    const finalStatus = approved ? "ready" : "failed";

    const { error: updateErr } = await sb
      .from("brands")
      .update({ intake_status: finalStatus, updated_at: new Date().toISOString() })
      .eq("id", brandId);
    if (updateErr) throw new Error(`Failed to update brand status: ${updateErr.message}`);

    console.info(`[brand-intelligence:${runId}] ${approved ? "committed" : "rejected"} brand ${brandId}`);
    return { status: finalStatus };
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
