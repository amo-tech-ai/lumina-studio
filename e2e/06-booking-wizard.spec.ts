import { expect, test } from "@playwright/test";

/** Auth gate runs before body/query validation when enabled. */
const authEnabled = process.env.OPERATOR_AUTH_ENABLED === "true";

test.describe("Booking Wizard — API reliability", () => {
  test("POST /api/bookings without credentials does not 500", async ({ request }) => {
    const res = await request.post("/api/bookings", {
      data: {
        brand_org_id: "00000000-0000-0000-0000-000000000001",
        talent_profile_id: "00000000-0000-0000-0000-000000000801",
        date_start: "2026-08-01",
        date_end: "2026-08-03",
      },
    });
    // Auth on → 401 at withOperatorAuth; auth off → may proceed into RPC/validation.
    if (authEnabled) {
      expect(res.status()).toBe(401);
    } else {
      expect([400, 401, 403, 404]).toContain(res.status());
    }
    expect(res.status()).not.toBe(500);
  });

  test("POST /api/bookings rejects invalid body without 500", async ({ request }) => {
    const res = await request.post("/api/bookings", {
      data: { invalid: true },
    });
    // Auth check happens before body validation when OPERATOR_AUTH_ENABLED=true.
    expect(res.status()).toBe(authEnabled ? 401 : 400);
    expect(res.status()).not.toBe(500);
  });

  test("POST /api/bookings unauthenticated never reaches talent-not-found 404", async ({
    request,
  }) => {
    const res = await request.post("/api/bookings", {
      data: {
        brand_org_id: "00000000-0000-0000-0000-000000000001",
        talent_profile_id: "00000000-0000-0000-0000-000000000999",
        date_start: "2026-08-01",
        date_end: "2026-08-03",
      },
    });
    // Unauthenticated: auth gate (401) or validation — not the RPC 404 branch.
    if (authEnabled) {
      expect(res.status()).toBe(401);
    } else {
      expect([400, 401, 403]).toContain(res.status());
    }
    expect(res.status()).not.toBe(404);
    expect(res.status()).not.toBe(500);
  });

  test("GET /api/bookings without credentials does not 500", async ({ request }) => {
    const res = await request.get("/api/bookings");
    // Auth on → 401; auth off → missing required query params → 400.
    expect(res.status()).toBe(authEnabled ? 401 : 400);
    expect(res.status()).not.toBe(500);
  });

  test("GET /api/bookings with invalid query does not 500", async ({ request }) => {
    const res = await request.get("/api/bookings?role=invalid");
    // Auth on → 401 before query validation; auth off → 400 from parseListBookingsQuery.
    expect(res.status()).toBe(authEnabled ? 401 : 400);
    expect(res.status()).not.toBe(500);
  });
});
