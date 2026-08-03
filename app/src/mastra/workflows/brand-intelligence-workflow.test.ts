import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../agents", () => ({
  socialDiscoveryAgent: { generate: vi.fn() },
  visualIdentityAgent: { generate: vi.fn() },
}));

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { socialDiscoveryAgent, visualIdentityAgent } from "../agents";
import type { BrandProfilePayload } from "@/lib/brand/brand-profile-contract";
import {
  brandIntelligenceWorkflow,
  extractProfile,
  fanOutEnrichment,
  saveDraftAndWait,
  startCrawl,
  validateBrand,
} from "./brand-intelligence-workflow";

const validProfile = JSON.parse(
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "../../../../supabase/functions/_shared/schemas/fixtures/brand-profile-valid.json",
    ),
    "utf8",
  ),
) as BrandProfilePayload;

function draftWithMeta(profile: BrandProfilePayload = validProfile) {
  return {
    ...profile,
    analyzedAt: "2026-08-01T00:00:00.000Z",
    _lifecycle: "scores_complete",
    _draft_scores: [{ score_type: "visual", score: 80 }],
  };
}

function makeMockClient(aiProfileDraft: Record<string, unknown> | null = draftWithMeta()) {
  const upsertPayload: Record<string, unknown>[] = [];
  const mockUpsert = vi.fn((payload: Record<string, unknown>) => {
    upsertPayload.push(payload);
    return { select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: "draft-1" }, error: null }) };
  });
  return {
    from: vi.fn((table: string) => {
      if (table === "brands") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { brand_url: "https://example.com", ai_profile_draft: aiProfileDraft },
            error: null,
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }
      if (table === "brand_intake_drafts") {
        return {
          upsert: mockUpsert,
        };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn(), update: vi.fn() };
    }),
    _upsertPayload: upsertPayload,
    _upsertSpy: mockUpsert,
  } as never;
}

describe("brand-intelligence workflow", () => {
  it("has the correct workflow id", () => {
    expect(brandIntelligenceWorkflow.id).toBe("brand-intelligence");
  });
});

// Enrichment is best-effort: a failing agent must not block HITL approval.
// IPI-834 — step output is the validated profile contract + enrichment flags.
describe("fan-out-enrichment", () => {
  const social = vi.mocked(socialDiscoveryAgent.generate);
  const visual = vi.mocked(visualIdentityAgent.generate);
  const ctx = {
    inputData: { profile: validProfile },
    getInitData: () => ({ brandId: "b1" }),
  } as never;

  beforeEach(() => vi.clearAllMocks());

  it("passes the profile through and reports both agents failed", async () => {
    social.mockRejectedValue(new Error("social boom"));
    visual.mockRejectedValue(new Error("visual boom"));
    const out = await fanOutEnrichment.execute(ctx);
    expect(out.profile.tagline.value).toBe("Clean essentials");
    expect(out.enrichment).toEqual({ socialOk: false, visualOk: false });
  });

  it("reports socialOk when at least one agent succeeds", async () => {
    social.mockResolvedValue({} as never);
    visual.mockRejectedValue(new Error("visual boom"));
    const out = await fanOutEnrichment.execute(ctx);
    expect(out.enrichment).toEqual({ socialOk: true, visualOk: false });
  });

  it("throws when the upstream profile fails the DNA contract", async () => {
    social.mockResolvedValue({} as never);
    visual.mockResolvedValue({} as never);
    await expect(
      fanOutEnrichment.execute({
        inputData: { profile: { ...validProfile, tagline: { value: "x", evidence: [] } } },
        getInitData: () => ({ brandId: "b1" }),
      } as never),
    ).rejects.toThrow(/at least one evidence/);
  });
});

// IPI-807 P0b — a non-2xx from the brand-intelligence edge fn must abort the run.
// Before this, the step warned, set intake_status="failed" and returned { ok: false };
// save-draft-and-wait then overwrote that with "draft_ready" and filed an approval draft
// whose profile was empty (or stale, since the upsert keys on brand_id). The operator saw
// "draft ready" with nothing behind it. It must fail closed instead.
describe("extract-profile edge-fn failure", () => {
  const BRAND_ID = "44444444-4444-4444-8444-444444444444";
  const ctx = {
    inputData: { crawlId: "crawl-1" },
    getInitData: () => ({ brandId: BRAND_ID }),
  } as never;

  /**
   * Mock client that records every brands.update payload.
   * `failStatusWriteFor` makes the update for that intake_status return an error, so the
   * "we could not even record the failure" branch can be exercised.
   */
  function makeRecordingClient(
    failStatusWriteFor?: string,
    aiProfileDraft: Record<string, unknown> | null = draftWithMeta(),
  ) {
    const updates: Record<string, unknown>[] = [];
    return {
      client: {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { brand_url: "https://example.com", ai_profile_draft: aiProfileDraft },
            error: null,
          }),
          update: vi.fn((payload: Record<string, unknown>) => {
            updates.push(payload);
            const shouldFail =
              failStatusWriteFor !== undefined && payload.intake_status === failStatusWriteFor;
            return {
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: shouldFail ? { message: "row level security violation" } : null,
              }),
            };
          }),
        })),
      } as never,
      updates,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("throws on a non-2xx instead of continuing to the draft step", async () => {
    const { client } = makeRecordingClient();
    vi.mocked(createClient).mockReturnValue(client);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502, text: async () => "upstream boom" }),
    );

    await expect(extractProfile.execute(ctx)).rejects.toThrow(/502/);
  });

  it("marks the brand failed before throwing, so the status survives", async () => {
    const { client, updates } = makeRecordingClient();
    vi.mocked(createClient).mockReturnValue(client);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => "boom" }),
    );

    await expect(extractProfile.execute(ctx)).rejects.toThrow();
    // analysis_running is written first; the failure must be recorded after it.
    expect(updates.map((u) => u.intake_status)).toEqual(["analysis_running", "failed"]);
  });

  // A refused connection / DNS failure rejects the fetch rather than returning a response.
  // This path previously skipped the status write entirely, pinning the brand at
  // "analysis_running" — which reads as "still working" and blocks the start guard from
  // permitting a retry.
  it("marks the brand failed and throws when fetch is rejected outright", async () => {
    const { client, updates } = makeRecordingClient();
    vi.mocked(createClient).mockReturnValue(client);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    await expect(extractProfile.execute(ctx)).rejects.toThrow(/unreachable/);
    expect(updates.map((u) => u.intake_status)).toEqual(["analysis_running", "failed"]);
  });

  // AbortSignal.timeout(120_000) firing surfaces as an AbortError rejection — same outcome.
  it("marks the brand failed and throws on an abort/timeout", async () => {
    const { client, updates } = makeRecordingClient();
    vi.mocked(createClient).mockReturnValue(client);
    const abort = Object.assign(new Error("The operation was aborted"), { name: "AbortError" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abort));

    await expect(extractProfile.execute(ctx)).rejects.toThrow(/AbortError/);
    expect(updates.map((u) => u.intake_status)).toEqual(["analysis_running", "failed"]);
  });

  // Claiming the brand was marked failed when the write was rejected is the same class of
  // lie this step used to tell. Both the upstream cause and the write error must survive.
  it("reports the status write failing without losing the original cause", async () => {
    const { client } = makeRecordingClient("failed");
    vi.mocked(createClient).mockReturnValue(client);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => "gateway down" }),
    );

    await expect(extractProfile.execute(ctx)).rejects.toThrow(
      /503.*gateway down.*NOT recorded.*row level security/s,
    );
  });

  // The edge fn body is untrusted and the error is persisted into workflow run state, so it
  // must not copy an unbounded upstream page in verbatim.
  it("bounds and flattens a huge upstream body in the error", async () => {
    const { client } = makeRecordingClient();
    vi.mocked(createClient).mockReturnValue(client);
    const huge = `<html>\n${"x".repeat(5000)}\n</html>`;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => huge }),
    );

    const err = await extractProfile.execute(ctx).catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    const msg = (err as Error).message;
    expect(msg).toMatch(/truncated, \d+ chars/);
    expect(msg).not.toContain("\n");
    expect(msg.length).toBeLessThan(700);
  });

  it("returns a validated profile on 2xx and leaves intake_status to the edge fn", async () => {
    const { client, updates } = makeRecordingClient();
    vi.mocked(createClient).mockReturnValue(client);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "" }));

    const out = await extractProfile.execute(ctx);
    expect(out.profile.name).toBe("Example Brand");
    expect(out.profile.tagline.evidence[0]?.quote).toMatch(/Clean essentials/);
    // The edge fn sets draft_ready itself — this step must not overwrite it.
    expect(updates.map((u) => u.intake_status)).toEqual(["analysis_running"]);
  });

  it("throws and marks failed when the draft fails the DNA contract (draft untouched)", async () => {
    const badDraft = {
      schemaVersion: 2,
      name: "Bad",
      tagline: { value: "x", evidence: [] },
      category: validProfile.category,
      visualIdentity: validProfile.visualIdentity,
      targetAudience: validProfile.targetAudience,
      sourceUrl: "https://example.com",
      scores: validProfile.scores,
    };
    const { client, updates } = makeRecordingClient(undefined, badDraft);
    vi.mocked(createClient).mockReturnValue(client);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "" }));

    await expect(extractProfile.execute(ctx)).rejects.toThrow(/contract validation failed/);
    expect(updates.map((u) => u.intake_status)).toEqual(["analysis_running", "failed"]);
    // failAnalysis only writes intake_status — never patches ai_profile_draft.
    expect(updates.every((u) => !("ai_profile_draft" in u))).toBe(true);
  });
});

describe("save-draft-and-wait stale-timestamp clearing", () => {
  const BRAND_ID = "22222222-2222-4222-8222-222222222222";
  const ACTOR_ID = "33333333-3333-4333-8333-333333333333";
  const RUN_ID = "run-test-1";

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const enrichmentInput = {
    profile: validProfile,
    enrichment: { socialOk: true, visualOk: false },
  };

  it("clears approved_at, rejected_at, and expires_at on upsert", async () => {
    const mockClient = makeMockClient();
    vi.mocked(createClient).mockReturnValue(mockClient);

    await saveDraftAndWait.execute(
      {
        inputData: enrichmentInput,
        suspend: vi.fn().mockResolvedValue(undefined),
        getInitData: () => ({ brandId: BRAND_ID, actorId: ACTOR_ID }),
        runId: RUN_ID,
      } as never,
    );

    const upsertPayload = mockClient._upsertPayload[0] as Record<string, unknown>;
    expect(upsertPayload).toBeDefined();
    expect(upsertPayload.brand_id).toBe(BRAND_ID);
    expect(upsertPayload.user_id).toBe(ACTOR_ID);
    expect(upsertPayload.status).toBe("pending_approval");
    expect(upsertPayload.approved_at).toBeNull();
    expect(upsertPayload.rejected_at).toBeNull();
    expect(upsertPayload.expires_at).toBeNull();
    expect(upsertPayload.draft_profile).toBeDefined();
  });

  it("stores profile fields at the top level of draft_profile", async () => {
    const aiProfileDraft = draftWithMeta({
      ...validProfile,
      name: "Test Brand",
    });
    const mockClient = makeMockClient(aiProfileDraft);
    vi.mocked(createClient).mockReturnValue(mockClient);

    await saveDraftAndWait.execute(
      {
        inputData: enrichmentInput,
        suspend: vi.fn().mockResolvedValue(undefined),
        getInitData: () => ({ brandId: BRAND_ID, actorId: ACTOR_ID }),
        runId: RUN_ID,
      } as never,
    );

    const p = mockClient._upsertPayload[0] as Record<string, unknown>;
    const df = p.draft_profile as Record<string, unknown>;
    expect(df.name).toBe("Test Brand");
    expect((df.tagline as { value: string }).value).toBe("Clean essentials");
    // _draft_scores stripped from draft_profile
    expect(df).not.toHaveProperty("_draft_scores");
    // _workflow_run_id present
    expect(df._workflow_run_id).toBe(RUN_ID);
  });

  it("populates draft_scores column", async () => {
    const scores = [{ score_type: "visual_identity", score: 85, rationale: "Solid" }];
    const aiProfileDraft = { ...draftWithMeta(), _draft_scores: scores };
    const mockClient = makeMockClient(aiProfileDraft);
    vi.mocked(createClient).mockReturnValue(mockClient);

    await saveDraftAndWait.execute(
      {
        inputData: enrichmentInput,
        suspend: vi.fn().mockResolvedValue(undefined),
        getInitData: () => ({ brandId: BRAND_ID, actorId: ACTOR_ID }),
        runId: RUN_ID,
      } as never,
    );

    const p = mockClient._upsertPayload[0] as Record<string, unknown>;
    expect(Array.isArray(p.draft_scores)).toBe(true);
    expect(p.draft_scores).toHaveLength(1);
    expect((p.draft_scores as Array<Record<string, unknown>>)[0].score_type).toBe("visual_identity");
  });

  it("throws before upsert when stored draft fails the DNA contract", async () => {
    const badDraft = {
      schemaVersion: 2,
      name: "Bad",
      tagline: { value: "x", evidence: [] },
      category: validProfile.category,
      visualIdentity: validProfile.visualIdentity,
      targetAudience: validProfile.targetAudience,
      sourceUrl: "https://example.com",
      scores: validProfile.scores,
    };
    const mockClient = makeMockClient(badDraft);
    vi.mocked(createClient).mockReturnValue(mockClient);

    await expect(
      saveDraftAndWait.execute(
        {
          inputData: enrichmentInput,
          suspend: vi.fn().mockResolvedValue(undefined),
          getInitData: () => ({ brandId: BRAND_ID, actorId: ACTOR_ID }),
          runId: RUN_ID,
        } as never,
      ),
    ).rejects.toThrow(/at least one evidence/);
    expect(mockClient._upsertPayload).toHaveLength(0);
  });
});

// IPI-812 — all five production runs died here with actor "dev-unauthenticated".
// The step must authorize the real JWT subject, and must accept an org *editor*,
// not only the brand's owner.
describe("validate-brand authorization", () => {
  const BRAND_ID = "00000000-0000-0000-0000-000000000202";
  const ORG_ID = "44444444-4444-4444-8444-444444444444";
  const EDITOR_ID = "55555555-5555-4555-8555-555555555555";
  const OWNER_ID = "66666666-6666-4666-8666-666666666666";

  const okBrand = {
    id: BRAND_ID,
    brand_url: "https://adidas.com",
    name: "Adidas",
    org_id: ORG_ID,
    user_id: OWNER_ID,
  };

  function makeClient(opts: {
    brand?: Record<string, unknown> | null;
    brandError?: { message: string } | null;
    member?: { role: string } | null;
    memberError?: { message: string } | null;
  }) {
    const { brand = okBrand, brandError = null, member = null, memberError = null } = opts;
    return {
      from: vi.fn((table: string) => {
        if (table === "brands") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: brand, error: brandError }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { id: BRAND_ID }, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "org_members") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: member, error: memberError }),
          };
        }
        return {};
      }),
    } as never;
  }

  const run = (actorId: string) =>
    validateBrand.execute({
      inputData: { brandId: BRAND_ID },
      getInitData: () => ({ actorId }),
    } as never);

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("starts for an org editor who does not own the brand", async () => {
    vi.mocked(createClient).mockReturnValue(makeClient({ member: { role: "editor" } }));
    await expect(run(EDITOR_ID)).resolves.toEqual({
      brandId: BRAND_ID,
      brandUrl: "https://adidas.com",
      brandName: "Adidas",
    });
  });

  it("starts for the org owner", async () => {
    vi.mocked(createClient).mockReturnValue(makeClient({ member: { role: "owner" } }));
    await expect(run(OWNER_ID)).resolves.toMatchObject({ brandId: BRAND_ID });
  });

  it("rejects a viewer", async () => {
    vi.mocked(createClient).mockReturnValue(makeClient({ member: { role: "viewer" } }));
    await expect(run(EDITOR_ID)).rejects.toThrow("Not authorized");
  });

  it("rejects a non-member", async () => {
    vi.mocked(createClient).mockReturnValue(makeClient({ member: null }));
    await expect(run(EDITOR_ID)).rejects.toThrow("Not authorized");
  });

  // A failed membership *query* is not a membership *denial*. Both produce
  // `member === null`, so without this the non-member case above would happily
  // pass while a database outage was being reported to the operator as a
  // permissions problem. Same guarantee the brand read below already has.
  it("reports an org_members lookup failure as a failure, not as a rejection", async () => {
    vi.mocked(createClient).mockReturnValue(
      makeClient({ member: null, memberError: { message: "connection reset" } }),
    );
    const err = (await run(EDITOR_ID).catch((e: unknown) => e)) as Error;
    expect(err.message).toContain("Failed to check org membership");
    expect(err.message).not.toContain("Not authorized");
  });

  it("reports a read failure as a failure, not as 'not found'", async () => {
    vi.mocked(createClient).mockReturnValue(
      makeClient({ brand: null, brandError: { message: "connection reset" } }),
    );
    await expect(run(EDITOR_ID)).rejects.toThrow("Failed to read brand");
  });

  it("reports a genuinely missing brand as not found", async () => {
    vi.mocked(createClient).mockReturnValue(makeClient({ brand: null }));
    await expect(run(EDITOR_ID)).rejects.toThrow("Brand not found");
  });

  it("falls back to owner check for a personal brand with no org", async () => {
    vi.mocked(createClient).mockReturnValue(
      makeClient({ brand: { ...okBrand, org_id: null } }),
    );
    await expect(run(OWNER_ID)).resolves.toMatchObject({ brandId: BRAND_ID });
    vi.mocked(createClient).mockReturnValue(
      makeClient({ brand: { ...okBrand, org_id: null } }),
    );
    await expect(run(EDITOR_ID)).rejects.toThrow("Not authorized");
  });
});

// The old schema was `userId: z.string()`, which happily accepted the operator-gate
// fallback string. Requiring a UUID makes that class of bug unrepresentable.
describe("start-crawl (IPI-817 service-role + actorId)", () => {
  const ACTOR = "55555555-5555-4555-8555-555555555555";
  const BRAND = "00000000-0000-0000-0000-000000000202";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("calls start-brand-crawl with service-role Authorization and actorId body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: { crawlId: "crawl-1" } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(createClient).mockReturnValue({
      from: () => ({
        update: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      }),
    } as never);

    const result = await startCrawl.execute({
      inputData: { brandId: BRAND, brandUrl: "https://brand.example", brandName: "Brand" },
      runId: "run-1",
      getInitData: () => ({ actorId: ACTOR }),
    } as never);

    expect(result).toEqual({ crawlId: "crawl-1" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/functions/v1/start-brand-crawl");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer test-service-role-key",
    });
    expect(init.headers).not.toHaveProperty("apikey");
    const body = JSON.parse(String(init.body));
    expect(body).toEqual({
      brandId: BRAND,
      url: "https://brand.example",
      actorId: ACTOR,
      workflowId: "run-1",
    });
    expect(body).not.toHaveProperty("accessToken");
  });

  it("throws a descriptive error when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    await expect(
      startCrawl.execute({
        inputData: { brandId: BRAND, brandUrl: "https://brand.example", brandName: "Brand" },
        runId: "run-1",
        getInitData: () => ({ actorId: ACTOR }),
      } as never),
    ).rejects.toThrow(/SUPABASE_SERVICE_ROLE_KEY is not set.*IPI-817/);
  });
});

describe("workflow input schema", () => {
  it("rejects the dev-unauthenticated fallback as actorId", () => {
    const parsed = brandIntelligenceWorkflow.inputSchema.safeParse({
      brandId: "00000000-0000-0000-0000-000000000202",
      actorId: "dev-unauthenticated",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a real UUID actorId without accessToken (IPI-817)", () => {
    const parsed = brandIntelligenceWorkflow.inputSchema.safeParse({
      brandId: "00000000-0000-0000-0000-000000000202",
      actorId: "55555555-5555-4555-8555-555555555555",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty("accessToken");
    }
  });

  it("does not require accessToken in the workflow input schema", () => {
    const shape = brandIntelligenceWorkflow.inputSchema.shape;
    expect(shape).not.toHaveProperty("accessToken");
    expect(shape).toHaveProperty("brandId");
    expect(shape).toHaveProperty("actorId");
  });
});
