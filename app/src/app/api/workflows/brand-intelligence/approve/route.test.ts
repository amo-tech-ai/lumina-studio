import { beforeEach, describe, expect, it, vi } from "vitest";

const RUN_ID = "run-abc";
// The operator approving the draft — the same identity shape validate-brand now
// writes into brand_intake_drafts.user_id (IPI-812).
const OPERATOR_ID = "55555555-5555-4555-8555-555555555555";

const mockWithOperatorAuth = vi.fn();
const mockExtractAccessToken = vi.fn();
const mockCreateUserScopedClient = vi.fn();
const mockGetUser = vi.fn();
const mockProcessApproval = vi.fn();

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

vi.mock("@/app/api/_lib/process-draft-approval", () => ({
  processBrandIntelligenceDraftApproval: (...args: unknown[]) => mockProcessApproval(...args),
}));

function req(body: unknown = { runId: RUN_ID, approved: true }) {
  return new Request("http://localhost/api/workflows/brand-intelligence/approve", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Gate disabled — returns its fallback without inspecting the request.
  mockWithOperatorAuth.mockResolvedValue({ id: "dev-unauthenticated", name: "Dev (auth disabled)" });
  mockExtractAccessToken.mockReturnValue("valid.jwt.token");
  mockGetUser.mockResolvedValue({ data: { user: { id: OPERATOR_ID } }, error: null });
  mockCreateUserScopedClient.mockReturnValue({ auth: { getUser: mockGetUser } });
  mockProcessApproval.mockResolvedValue({ ok: true, approved: true, brandId: "b1" });
});

async function post(body?: unknown) {
  const { POST } = await import("./route");
  return POST(req(body));
}

describe("POST /api/workflows/brand-intelligence/approve", () => {
  // Regression for IPI-812: validate-brand now writes a real JWT subject into
  // brand_intake_drafts.user_id, so passing the operator-gate fallback as operatorId
  // made processBrandIntelligenceDraftApproval's ownership check 403 every approval.
  it("passes the JWT subject as operatorId, not the operator-gate fallback", async () => {
    const res = await post();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, approved: true });
    expect(mockProcessApproval).toHaveBeenCalledWith({
      runId: RUN_ID,
      approved: true,
      operatorId: OPERATOR_ID,
    });
    expect(mockProcessApproval.mock.calls[0][0].operatorId).not.toBe("dev-unauthenticated");
  });

  it("forwards a rejection with the same verified identity", async () => {
    mockProcessApproval.mockResolvedValue({ ok: true, approved: false, brandId: "b1" });
    const res = await post({ runId: RUN_ID, approved: false });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, approved: false });
    expect(mockProcessApproval).toHaveBeenCalledWith({
      runId: RUN_ID,
      approved: false,
      operatorId: OPERATOR_ID,
    });
  });

  it("returns 401 when no access token is present", async () => {
    mockExtractAccessToken.mockReturnValue(undefined);
    const res = await post();
    expect(res.status).toBe(401);
    expect(mockProcessApproval).not.toHaveBeenCalled();
  });

  it("returns 401 when the JWT is invalid or expired", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "bad jwt" } });
    const res = await post();
    expect(res.status).toBe(401);
    expect(mockProcessApproval).not.toHaveBeenCalled();
  });

  it("returns 401 when the session subject is not a UUID", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "dev-unauthenticated" } }, error: null });
    const res = await post();
    expect(res.status).toBe(401);
    expect(mockProcessApproval).not.toHaveBeenCalled();
  });

  it("returns 401 when the enforced gate rejects the caller", async () => {
    const { OperatorAuthError } = await import("@/lib/operator-gate");
    mockWithOperatorAuth.mockRejectedValue(new OperatorAuthError("Unauthorized"));
    const res = await post();
    expect(res.status).toBe(401);
    expect(mockProcessApproval).not.toHaveBeenCalled();
  });

  it("returns 400 when runId or approved is missing", async () => {
    const res = await post({ runId: RUN_ID });
    expect(res.status).toBe(400);
    expect(mockProcessApproval).not.toHaveBeenCalled();
  });

  it("maps a draft owned by someone else to 403", async () => {
    mockProcessApproval.mockResolvedValue({ ok: false, error: "Forbidden" });
    const res = await post();
    expect(res.status).toBe(403);
  });

  it("maps a missing draft to 404", async () => {
    mockProcessApproval.mockResolvedValue({ ok: false, error: "No pending draft found for this workflow run" });
    const res = await post();
    expect(res.status).toBe(404);
  });

  it("maps a duplicate approve to 409", async () => {
    mockProcessApproval.mockResolvedValue({ ok: false, error: "Draft already processed — possible duplicate approve request" });
    const res = await post();
    expect(res.status).toBe(409);
  });
});
