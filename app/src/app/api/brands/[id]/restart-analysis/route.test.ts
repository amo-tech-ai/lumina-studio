import { beforeEach, describe, expect, it, vi } from "vitest";

const BRAND_ID = "00000000-0000-4000-8000-000000000901";
const ACTOR = "00000000-0000-4000-8000-000000000903";

const mockWithOperatorAuth = vi.fn();
const mockResolveJwtActor = vi.fn();
const mockRestart = vi.fn();

vi.mock("@/lib/operator-gate", () => ({
  withOperatorAuth: (...args: unknown[]) => mockWithOperatorAuth(...args),
  OperatorAuthError: class OperatorAuthError extends Error {
    constructor(m: string) {
      super(m);
      this.name = "OperatorAuthError";
    }
  },
}));

vi.mock("@/lib/jwt-actor", () => ({
  resolveJwtActor: (...args: unknown[]) => mockResolveJwtActor(...args),
}));

vi.mock("@/lib/brand/restart-failed-analysis", async () => {
  const actual = await vi.importActual<typeof import("@/lib/brand/restart-failed-analysis")>(
    "@/lib/brand/restart-failed-analysis",
  );
  return {
    ...actual,
    restartFailedBrandAnalysis: (...args: unknown[]) => mockRestart(...args),
  };
});

function req(body?: unknown, raw?: string) {
  const init: RequestInit = { method: "POST" };
  if (raw !== undefined) {
    init.body = raw;
    init.headers = { "content-type": "application/json" };
  } else if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "content-type": "application/json" };
  }
  return new Request(`http://localhost/api/brands/${BRAND_ID}/restart-analysis`, init);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockWithOperatorAuth.mockResolvedValue({ id: ACTOR });
  mockResolveJwtActor.mockResolvedValue({
    ok: true,
    userId: ACTOR,
    accessToken: "tok",
    client: { tag: "user-sb" },
  });
  mockRestart.mockResolvedValue({
    ok: true,
    mode: "crawl_restarted",
    intakeStatus: "draft_ready",
    crawlId: "c1",
  });
});

describe("POST /api/brands/[id]/restart-analysis", () => {
  it("delegates to restartFailedBrandAnalysis with JWT actor client", async () => {
    const { POST } = await import("./route");
    const res = await POST(req({ websiteUrl: "https://aureliajewelry.com/" }), {
      params: Promise.resolve({ id: BRAND_ID }),
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, mode: "crawl_restarted" });
    expect(mockRestart).toHaveBeenCalledWith({
      supabase: { tag: "user-sb" },
      actorId: ACTOR,
      brandId: BRAND_ID,
      websiteUrl: "https://aureliajewelry.com/",
    });
  });

  it("allows empty body (uses stored brand_url)", async () => {
    const { POST } = await import("./route");
    const res = await POST(req(), { params: Promise.resolve({ id: BRAND_ID }) });
    expect(res.status).toBe(200);
    expect(mockRestart).toHaveBeenCalledWith(
      expect.objectContaining({ websiteUrl: undefined }),
    );
  });

  it("rejects malformed JSON with 400 and does not start recovery", async () => {
    const { POST } = await import("./route");
    const res = await POST(req(undefined, "{not-json"), {
      params: Promise.resolve({ id: BRAND_ID }),
    });
    expect(res.status).toBe(400);
    expect(mockRestart).not.toHaveBeenCalled();
  });

  it("rejects null JSON body with 400", async () => {
    const { POST } = await import("./route");
    const res = await POST(req(undefined, "null"), {
      params: Promise.resolve({ id: BRAND_ID }),
    });
    expect(res.status).toBe(400);
    expect(mockRestart).not.toHaveBeenCalled();
  });

  it("returns 401 when operator gate rejects", async () => {
    const { OperatorAuthError } = await import("@/lib/operator-gate");
    mockWithOperatorAuth.mockRejectedValue(new OperatorAuthError("Unauthorized"));
    const { POST } = await import("./route");
    const res = await POST(req(), { params: Promise.resolve({ id: BRAND_ID }) });
    expect(res.status).toBe(401);
    expect(mockRestart).not.toHaveBeenCalled();
  });

  it("returns 400 invalid_url for non-UUID brand id", async () => {
    const { POST } = await import("./route");
    const res = await POST(req(), { params: Promise.resolve({ id: "not-uuid" }) });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      code: "invalid_url",
      message: "brandId must be a valid UUID.",
    });
    expect(mockRestart).not.toHaveBeenCalled();
  });

  it("maps unauthorized restart to 403", async () => {
    mockRestart.mockResolvedValue({
      ok: false,
      code: "unauthorized",
      message: "You must be an organization owner or editor to restart this analysis.",
    });
    const { POST } = await import("./route");
    const res = await POST(req(), { params: Promise.resolve({ id: BRAND_ID }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("unauthorized");
    expect(JSON.stringify(body)).not.toMatch(/postgres|ECONNREFUSED|Firecrawl/i);
  });
});
