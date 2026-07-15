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
  fanOutEnrichment,
  saveDraftAndWait,
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

describe("save-draft-and-wait stale-timestamp clearing", () => {
  const BRAND_ID = "22222222-2222-4222-8222-222222222222";
  const USER_ID = "33333333-3333-4333-8333-333333333333";
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
        getInitData: () => ({ brandId: BRAND_ID, userId: USER_ID }),
        runId: RUN_ID,
      } as never,
    );

    const upsertPayload = mockClient._upsertPayload[0] as Record<string, unknown>;
    expect(upsertPayload).toBeDefined();
    expect(upsertPayload.brand_id).toBe(BRAND_ID);
    expect(upsertPayload.user_id).toBe(USER_ID);
    expect(upsertPayload.status).toBe("pending_approval");
    expect(upsertPayload.approved_at).toBeNull();
    expect(upsertPayload.rejected_at).toBeNull();
    expect(upsertPayload.expires_at).toBeNull();
    expect(upsertPayload.draft_profile).toBeDefined();
  });
});
