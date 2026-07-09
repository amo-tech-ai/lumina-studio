import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockWithOperatorAuth = vi.fn();

vi.mock("@/lib/operator-gate", () => ({
  withOperatorAuth: (...args: unknown[]) => mockWithOperatorAuth(...args),
  OperatorAuthError: class OperatorAuthError extends Error {
    constructor(m: string) {
      super(m);
      this.name = "OperatorAuthError";
    }
  },
}));

beforeEach(() => {
  vi.resetModules();
  mockWithOperatorAuth.mockResolvedValue({ id: "22222222-2222-4222-8222-222222222222", name: "QA" });
});

afterEach(() => {
  vi.clearAllMocks();
});

async function importRoute() {
  return import("./route");
}

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/bookings/quote-draft", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/bookings/quote-draft", () => {
  it("returns 401 when unauthenticated", async () => {
    const { OperatorAuthError } = await import("@/lib/operator-gate");
    mockWithOperatorAuth.mockRejectedValueOnce(new OperatorAuthError("Unauthorized"));
    const { POST } = await importRoute();
    const res = await POST(postRequest({}));
    expect(res.status).toBe(401);
  });

  it("returns a suggested rate and message draft for a valid request", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      postRequest({
        displayName: "Maria Rossi",
        dateStart: "2026-08-01",
        dateEnd: "2026-08-03",
        rateTier: "$$",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestedRate).toBe(1000);
    expect(body.messageDraft).toContain("Maria Rossi");
    expect(body.messageDraft).toContain("2026-08-01");
  });

  it("honors an explicit rateQuoted override instead of the tier suggestion", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      postRequest({
        displayName: "Maria Rossi",
        dateStart: "2026-08-01",
        dateEnd: "2026-08-03",
        rateTier: "$$",
        rateQuoted: 1500,
      }),
    );
    const body = await res.json();
    expect(body.suggestedRate).toBe(1500);
  });

  it("rejects an unrecognized rateTier instead of silently dropping it", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      postRequest({
        displayName: "Maria Rossi",
        dateStart: "2026-08-01",
        dateEnd: "2026-08-03",
        rateTier: "$$$$",
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a missing displayName", async () => {
    const { POST } = await importRoute();
    const res = await POST(postRequest({ dateStart: "2026-08-01", dateEnd: "2026-08-03" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects an invalid date range (end before start)", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      postRequest({ displayName: "Maria Rossi", dateStart: "2026-08-05", dateEnd: "2026-08-01" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a null JSON body instead of throwing on property access", async () => {
    const { POST } = await importRoute();
    const res = await POST(postRequest(null));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a JSON array body", async () => {
    const { POST } = await importRoute();
    const res = await POST(postRequest([1, 2, 3]));
    expect(res.status).toBe(400);
  });

  it("rejects malformed JSON", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      new NextRequest("http://localhost/api/bookings/quote-draft", { method: "POST", body: "not json" }),
    );
    expect(res.status).toBe(400);
  });
});
