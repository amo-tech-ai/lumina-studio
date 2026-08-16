/**
 * IPI-1015 — one Workers+pg regression per workflow HTTP family.
 * Proves getMastra() / getMastraStorage() runs inside withWorkflowMastraPg.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const HD_URL = "postgres://hd:secret@hyperdrive.local:5432/db";
const ids = vi.hoisted(() => ({
  BRAND_ID: "00000000-0000-0000-0000-000000000202",
  ORG_ID: "44444444-4444-4444-8444-444444444444",
  EDITOR_ID: "55555555-5555-4555-8555-555555555555",
}));
const BRAND_ID = ids.BRAND_ID;
const ORG_ID = ids.ORG_ID;
const EDITOR_ID = ids.EDITOR_ID;

const mockWithOperatorAuth = vi.fn();
const mockExtractAccessToken = vi.fn();
const mockCreateUserScopedClient = vi.fn();
const mockGetUser = vi.fn();
const mockMaybeSingle = vi.fn();
const mockRpc = vi.fn();
const mockStart = vi.fn();
const mockResume = vi.fn();
const mockFrom = vi.fn();
const mockPromote = vi.fn();
const mockDiscard = vi.fn();

const storageProbe = vi.hoisted(() => ({
  getMastraStorage: null as null | (() => unknown),
}));

vi.mock("@/lib/operator-gate", () => ({
  withOperatorAuth: (...args: unknown[]) => mockWithOperatorAuth(...args),
  OperatorAuthError: class OperatorAuthError extends Error {
    constructor(m: string) {
      super(m);
      this.name = "OperatorAuthError";
    }
  },
}));

vi.mock("@/lib/auth", () => ({
  extractAccessToken: (...args: unknown[]) => mockExtractAccessToken(...args),
}));

vi.mock("@/lib/shoot/commit-shoot-draft", () => ({
  createUserScopedClient: (...args: unknown[]) => mockCreateUserScopedClient(...args),
}));

vi.mock("@/lib/jwt-actor", () => ({
  resolveJwtActor: async () => ({
    ok: true as const,
    userId: ids.EDITOR_ID,
    client: {
      auth: { getUser: mockGetUser },
      from: () => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle,
      }),
      rpc: mockRpc,
    },
  }),
}));

vi.mock("@/app/api/_lib/supabase-admin", () => ({
  createSupabaseAdminClient: () => ({ from: (...args: unknown[]) => mockFrom(...args) }),
}));

vi.mock("@/lib/brand/promote-draft", () => ({
  promoteBrandDraft: (...args: unknown[]) => mockPromote(...args),
}));

vi.mock("@/lib/brand/discard-draft", () => ({
  discardBrandDraft: (...args: unknown[]) => mockDiscard(...args),
}));

vi.mock("@/mastra", () => ({
  getMastra: () => {
    if (!storageProbe.getMastraStorage) {
      throw new Error("storage probe not installed");
    }
    storageProbe.getMastraStorage();
    return {
      getWorkflow: () => ({
        createRun: async () => ({
          runId: "run-1",
          start: mockStart,
          resume: mockResume,
        }),
      }),
      getStorage: async () => null,
    };
  },
}));

describe("IPI-1015 workflow HTTP Workers+pg scope", () => {
  const originalWebSocketPair = (globalThis as { WebSocketPair?: unknown }).WebSocketPair;

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    (globalThis as { WebSocketPair?: unknown }).WebSocketPair = class WebSocketPair {};
    vi.stubEnv("MASTRA_STORAGE_MODE", "pg");
    vi.stubEnv("MASTRA_SCHEMA", "mastra");
    vi.stubEnv("INTERNAL_WEBHOOK_SECRET", "test-secret");
    mockWithOperatorAuth.mockResolvedValue({ id: EDITOR_ID, name: "QA" });
    mockExtractAccessToken.mockReturnValue("valid.jwt.token");
    mockGetUser.mockResolvedValue({ data: { user: { id: EDITOR_ID } }, error: null });
    mockMaybeSingle.mockResolvedValue({
      data: { id: BRAND_ID, org_id: ORG_ID, user_id: "other" },
      error: null,
    });
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockStart.mockResolvedValue({ status: "suspended", suspendPayload: {} });
    mockResume.mockResolvedValue({ status: "suspended", suspendPayload: {} });
    mockPromote.mockResolvedValue({ ok: true });
    mockDiscard.mockResolvedValue({ ok: true });
    mockCreateUserScopedClient.mockReturnValue({
      auth: { getUser: mockGetUser },
      from: () => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle,
      }),
      rpc: mockRpc,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.doUnmock("@mastra/pg");
    vi.doUnmock("@opennextjs/cloudflare");
    storageProbe.getMastraStorage = null;
    if (originalWebSocketPair === undefined) {
      delete (globalThis as { WebSocketPair?: unknown }).WebSocketPair;
    } else {
      (globalThis as { WebSocketPair?: unknown }).WebSocketPair = originalWebSocketPair;
    }
  });

  async function installHyperdrive() {
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: function FakePostgresStore(this: { close: () => Promise<void> }) {
        this.close = async () => {};
      },
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.doMock("@opennextjs/cloudflare", () => ({
      getCloudflareContext: async () => ({
        env: { HYPERDRIVE_FRESH: { connectionString: HD_URL } },
        ctx: { waitUntil: vi.fn() },
      }),
    }));
    vi.resetModules();
    const { getMastraStorage } = await import("@/mastra/storage");
    storageProbe.getMastraStorage = getMastraStorage;
  }

  it("shoot-wizard: getMastra() runs inside Workers pg scope", async () => {
    await installHyperdrive();
    const { POST } = await import("../workflows/shoot-wizard/route");
    const res = await POST(
      new Request("http://localhost/api/workflows/shoot-wizard", {
        method: "POST",
        body: JSON.stringify({ brandId: BRAND_ID }),
      }) as never,
    );
    expect(res.status).toBe(202);
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it("brand-intelligence start: getMastra() runs inside Workers pg scope", async () => {
    await installHyperdrive();
    const { POST } = await import("../workflows/brand-intelligence/start/route");
    const res = await POST(
      new Request("http://localhost/api/workflows/brand-intelligence/start", {
        method: "POST",
        body: JSON.stringify({ brandId: BRAND_ID }),
      }),
    );
    expect(res.status).toBe(200);
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it("brand-intelligence resume: getMastra() runs inside Workers pg scope", async () => {
    await installHyperdrive();
    const { POST } = await import("../workflows/brand-intelligence/resume/route");
    const res = await POST(
      new Request("http://localhost/api/workflows/brand-intelligence/resume", {
        method: "POST",
        headers: { "X-Internal-Secret": "test-secret" },
        body: JSON.stringify({ runId: "run-1", crawlId: "crawl-1" }),
      }),
    );
    expect(res.status).toBe(200);
    expect(mockResume).toHaveBeenCalledTimes(1);
  });

  it("generic workflow resume: getMastra() runs inside Workers pg scope", async () => {
    await installHyperdrive();
    const { POST } = await import("../workflows/resume/route");
    const res = await POST(
      new Request("http://localhost/api/workflows/resume", {
        method: "POST",
        body: JSON.stringify({
          workflowId: "shoot-wizard",
          runId: "run-1",
          stepId: "deliverable-gate",
          resumeData: {},
        }),
      }) as never,
    );
    expect(res.status).toBe(200);
    expect(mockResume).toHaveBeenCalledTimes(1);
  });

  it("draft-approval deferred resume: getMastra() runs inside Workers pg scope", async () => {
    await installHyperdrive();
    function chain(result: { data: unknown; error: unknown }) {
      const self: Record<string, unknown> = {};
      self.select = () => self;
      self.update = () => self;
      self.eq = () => self;
      self.single = async () => result;
      self.maybeSingle = async () => result;
      return self;
    }
    mockFrom.mockImplementation((table: string) => {
      if (table === "brand_intake_drafts") {
        return chain({
          data: {
            id: "d1",
            brand_id: BRAND_ID,
            user_id: EDITOR_ID,
            status: "pending_approval",
          },
          error: null,
        });
      }
      return chain({ data: null, error: null });
    });

    const { processBrandIntelligenceDraftApproval } = await import("./process-draft-approval");
    const result = await processBrandIntelligenceDraftApproval({
      runId: "run-1",
      approved: true,
      operatorId: EDITOR_ID,
    });
    expect(result).toEqual({ ok: true, approved: true, brandId: BRAND_ID });
    await vi.waitFor(() => expect(mockResume).toHaveBeenCalledTimes(1));
  });
});
