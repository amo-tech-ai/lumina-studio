import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockWithOperatorAuth = vi.fn();
const mockCreateSupabaseServerClient = vi.fn();

vi.mock("@/lib/operator-gate", () => ({
  withOperatorAuth: (...args: unknown[]) => mockWithOperatorAuth(...args),
  OperatorAuthError: class OperatorAuthError extends Error {
    constructor(m: string) {
      super(m);
      this.name = "OperatorAuthError";
    }
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => mockCreateSupabaseServerClient(),
}));

const BRAND_ID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  vi.resetModules();
  mockWithOperatorAuth.mockResolvedValue({ id: "user-1" });
});

afterEach(() => {
  vi.clearAllMocks();
});

async function importRoute() {
  return import("./route");
}

describe("GET /api/intelligence/panel", () => {
  it("returns 401 when auth fails", async () => {
    const { OperatorAuthError } = await import("@/lib/operator-gate");
    mockWithOperatorAuth.mockRejectedValueOnce(new OperatorAuthError("Unauthorized"));
    const { GET } = await importRoute();
    const res = await GET(new Request("http://localhost/api/intelligence/panel"));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid brandId", async () => {
    const { GET } = await importRoute();
    const res = await GET(
      new Request("http://localhost/api/intelligence/panel?brandId=not-a-uuid"),
    );
    expect(res.status).toBe(400);
  });

  it("returns panel payload for valid brandId", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "brand_scores") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { score_type: "visual", score: 80 },
                  { score_type: "audience", score: 70 },
                  { score_type: "consistency", score: 90 },
                  { score_type: "commerce_readiness", score: 60 },
                ],
                error: null,
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((_col: string, val: string) => {
              if (val === BRAND_ID) {
                return {
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: BRAND_ID,
                      name: "Acme",
                      intake_status: "scores_complete",
                    },
                    error: null,
                  }),
                };
              }
              if (val === "draft_ready") {
                return {
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                };
              }
              return { order: vi.fn().mockResolvedValue({ data: [], error: null }) };
            }),
          }),
        };
      }),
    });

    const { GET } = await importRoute();
    const res = await GET(
      new Request(`http://localhost/api/intelligence/panel?brandId=${BRAND_ID}`),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.brand.name).toBe("Acme");
    expect(body.scores.dna).toBe(75);
  });
});
