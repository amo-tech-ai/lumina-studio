import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../agents", () => ({
  socialDiscoveryAgent: { generate: vi.fn() },
  visualIdentityAgent: { generate: vi.fn() },
}));

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

import { createClient } from "@supabase/supabase-js";
import { socialDiscoveryAgent, visualIdentityAgent } from "../agents";
import {
  brandIntelligenceWorkflow,
  extractProfile,
  fanOutEnrichment,
  saveDraftAndWait,
  validateBrand,
} from "./brand-intelligence-workflow";

function makeMockClient() {
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
            data: { brand_url: "https://example.com", ai_profile_draft: null },
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

// Enrichment is best-effort: a failing agent must not block HITL approval, but the
// step must report whether anything actually succeeded (not a blanket enriched:true).
describe("fan-out-enrichment", () => {
  const social = vi.mocked(socialDiscoveryAgent.generate);
  const visual = vi.mocked(visualIdentityAgent.generate);
  const ctx = { getInitData: () => ({ brandId: "b1" }) } as never;

  beforeEach(() => vi.clearAllMocks());

  it("reports enriched=false when both agents reject", async () => {
    social.mockRejectedValue(new Error("social boom"));
    visual.mockRejectedValue(new Error("visual boom"));
    expect((await fanOutEnrichment.execute(ctx)).enriched).toBe(false);
  });

  it("reports enriched=true when at least one agent succeeds", async () => {
    social.mockResolvedValue({} as never);
    visual.mockRejectedValue(new Error("visual boom"));
    expect((await fanOutEnrichment.execute(ctx)).enriched).toBe(true);
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

  /** Mock client that records every brands.update payload. */
  function makeRecordingClient() {
    const updates: Record<string, unknown>[] = [];
    return {
      client: {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { brand_url: "https://example.com", ai_profile_draft: null },
            error: null,
          }),
          update: vi.fn((payload: Record<string, unknown>) => {
            updates.push(payload);
            return { eq: vi.fn().mockResolvedValue({ data: null, error: null }) };
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

  it("resolves ok on a 2xx and leaves intake_status to the edge fn", async () => {
    const { client, updates } = makeRecordingClient();
    vi.mocked(createClient).mockReturnValue(client);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "" }));

    await expect(extractProfile.execute(ctx)).resolves.toEqual({ ok: true });
    // The edge fn sets draft_ready itself — this step must not overwrite it.
    expect(updates.map((u) => u.intake_status)).toEqual(["analysis_running"]);
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

  it("clears approved_at, rejected_at, and expires_at on upsert", async () => {
    const mockClient = makeMockClient();
    vi.mocked(createClient).mockReturnValue(mockClient);

    await saveDraftAndWait.execute(
      {
        enriched: true,
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
    const aiProfileDraft = {
      name: "Test Brand",
      tagline: "A test",
      overview: "Just testing",
      _draft_scores: [{ score_type: "visual_identity", score: 85, rationale: "Solid" }],
    };
    const mockClient = makeMockClient();
    // Return an ai_profile_draft with actual profile data
    mockClient.from = vi.fn((table: string) => {
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
        } as never;
      }
      if (table === "brand_intake_drafts") {
        return { upsert: mockClient._upsertSpy };
      }
      return {};
    });
    vi.mocked(createClient).mockReturnValue(mockClient);

    await saveDraftAndWait.execute(
      {
        enriched: true,
        suspend: vi.fn().mockResolvedValue(undefined),
        getInitData: () => ({ brandId: BRAND_ID, actorId: ACTOR_ID }),
        runId: RUN_ID,
      } as never,
    );

    const p = mockClient._upsertPayload[0] as Record<string, unknown>;
    const df = p.draft_profile as Record<string, unknown>;
    // Profile fields at top level
    expect(df.name).toBe("Test Brand");
    expect(df.tagline).toBe("A test");
    expect(df.overview).toBe("Just testing");
    // _draft_scores stripped from draft_profile
    expect(df).not.toHaveProperty("_draft_scores");
    // _workflow_run_id present
    expect(df._workflow_run_id).toBe(RUN_ID);
  });

  it("populates draft_scores column", async () => {
    const scores = [{ score_type: "visual_identity", score: 85, rationale: "Solid" }];
    const aiProfileDraft = { name: "Test", _draft_scores: scores };
    const mockClient = makeMockClient();
    mockClient.from = vi.fn((table: string) => {
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
        } as never;
      }
      if (table === "brand_intake_drafts") {
        return { upsert: mockClient._upsertSpy };
      }
      return {};
    });
    vi.mocked(createClient).mockReturnValue(mockClient);

    await saveDraftAndWait.execute(
      {
        enriched: true,
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
describe("workflow input schema", () => {
  it("rejects the dev-unauthenticated fallback as actorId", () => {
    const parsed = brandIntelligenceWorkflow.inputSchema.safeParse({
      brandId: "00000000-0000-0000-0000-000000000202",
      actorId: "dev-unauthenticated",
      accessToken: "jwt",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a real UUID actorId", () => {
    const parsed = brandIntelligenceWorkflow.inputSchema.safeParse({
      brandId: "00000000-0000-0000-0000-000000000202",
      actorId: "55555555-5555-4555-8555-555555555555",
      accessToken: "jwt",
    });
    expect(parsed.success).toBe(true);
  });
});
