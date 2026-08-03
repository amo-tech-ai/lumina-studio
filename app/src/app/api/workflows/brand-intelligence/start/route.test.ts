import { beforeEach, describe, expect, it, vi } from "vitest";

const BRAND_ID = "00000000-0000-0000-0000-000000000202";
const ORG_ID = "44444444-4444-4444-8444-444444444444";
// qa@ipix.test — an org *editor*, not the brand owner. This is the identity that
// produced all five failed production runs (IPI-812).
const EDITOR_ID = "55555555-5555-4555-8555-555555555555";

const mockWithOperatorAuth = vi.fn();
const mockExtractAccessToken = vi.fn();
const mockCreateUserScopedClient = vi.fn();
const mockGetUser = vi.fn();
const mockMaybeSingle = vi.fn();
const mockRpc = vi.fn();
const mockStart = vi.fn();

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

vi.mock("@/mastra", () => ({
  getMastra: () => ({
    getWorkflow: () => ({
      createRun: async () => ({ runId: "run-1", start: mockStart }),
    }),
  }),
}));

function req(body: unknown = { brandId: BRAND_ID }) {
  return new Request("http://localhost/api/workflows/brand-intelligence/start", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Gate disabled — returns its fallback without inspecting the request. This is the
  // configuration the five failed runs ran under.
  mockWithOperatorAuth.mockResolvedValue({ id: "dev-unauthenticated", name: "Dev (auth disabled)" });
  mockExtractAccessToken.mockReturnValue("valid.jwt.token");
  mockGetUser.mockResolvedValue({ data: { user: { id: EDITOR_ID } }, error: null });
  mockMaybeSingle.mockResolvedValue({
    data: { id: BRAND_ID, org_id: ORG_ID, user_id: "some-other-owner" },
    error: null,
  });
  mockRpc.mockResolvedValue({ data: true, error: null });
  mockStart.mockResolvedValue({ status: "suspended" });
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

async function post(body?: unknown) {
  const { POST } = await import("./route");
  return POST(req(body));
}

describe("POST /api/workflows/brand-intelligence/start", () => {
  // The regression test for IPI-812: operator gate disabled + a valid editor JWT.
  // Previously the route took identity from withOperatorAuth, passed
  // userId: "dev-unauthenticated", and validate-brand rejected every run.
  it("starts the workflow with the JWT subject, not the operator-gate fallback", async () => {
    const res = await post();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ runId: "run-1" });
    expect(mockStart).toHaveBeenCalledTimes(1);

    const { inputData } = mockStart.mock.calls[0][0];
    expect(inputData.actorId).toBe(EDITOR_ID);
    expect(inputData.actorId).not.toBe("dev-unauthenticated");
    expect(inputData.brandId).toBe(BRAND_ID);
    // No `userId` key survives — validate-brand reads actorId only.
    expect(inputData).not.toHaveProperty("userId");
<<<<<<< HEAD
=======
    // IPI-817 — operator JWT must never enter Mastra workflow input / snapshots.
    expect(inputData).not.toHaveProperty("accessToken");
    expect(Object.keys(inputData).sort()).toEqual(["actorId", "brandId"]);
>>>>>>> origin/main
  });

  it("awaits run.start (not startAsync) so storage stays open through suspend", async () => {
    let resolveStart!: () => void;
    mockStart.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveStart = () => resolve({ status: "suspended" });
        }),
    );

    const pending = post();
    // start must still be in flight before the HTTP response settles.
    await vi.waitFor(() => expect(mockStart).toHaveBeenCalledTimes(1));
    resolveStart();
    const res = await pending;
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ runId: "run-1" });
  });

  it("authorizes against the brand's org, not brand ownership", async () => {
    await post();
    expect(mockRpc).toHaveBeenCalledWith("is_org_editor_or_above", { p_org_id: ORG_ID });
  });

  it("rejects a viewer with 403 and never starts a run", async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });
    const res = await post();
    expect(res.status).toBe(403);
    expect(mockStart).not.toHaveBeenCalled();
  });

  // A failed role *check* is not a role *denial*. Same call as the viewer case above,
  // but `error` set instead of `data: false` — 403 here would tell the caller they
  // lack permission when the truth is the database could not answer.
  it("returns 500, not 403, when the role RPC itself fails", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "connection reset" } });
    const res = await post();
    expect(res.status).toBe(500);
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("returns 401 when no access token is present", async () => {
    mockExtractAccessToken.mockReturnValue(null);
    const res = await post();
    expect(res.status).toBe(401);
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("returns 401 when the JWT is invalid or expired", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "bad jwt" } });
    const res = await post();
    expect(res.status).toBe(401);
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("returns 401 when the enforced gate rejects the caller", async () => {
    const { OperatorAuthError } = await import("@/lib/operator-gate");
    mockWithOperatorAuth.mockRejectedValue(new OperatorAuthError("Unauthorized"));
    const res = await post();
    expect(res.status).toBe(401);
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-UUID brandId", async () => {
    const res = await post({ brandId: "not-a-uuid" });
    expect(res.status).toBe(400);
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("returns 404 when the brand is invisible to the caller", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await post();
    expect(res.status).toBe(404);
  });

  // A DB/RLS outage must not masquerade as "brand not found".
  it("returns 500 when the brand lookup itself fails", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: "connection reset" } });
    const res = await post();
    expect(res.status).toBe(500);
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("falls back to owner check for a personal brand with no org", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: BRAND_ID, org_id: null, user_id: EDITOR_ID },
      error: null,
    });
    const res = await post();
    expect(res.status).toBe(200);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("403s a non-owner on a personal brand with no org", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: BRAND_ID, org_id: null, user_id: "someone-else" },
      error: null,
    });
    const res = await post();
    expect(res.status).toBe(403);
    expect(mockStart).not.toHaveBeenCalled();
    // A personal brand has no roles — don't tell the caller to become an org editor.
    const { error } = (await res.json()) as { error: string };
    expect(error).toMatch(/own this brand/);
    expect(error).not.toMatch(/organization/);
  });
});
