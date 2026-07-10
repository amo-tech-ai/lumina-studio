import { expect, test, type APIRequestContext } from "@playwright/test";

/**
 * Playwright does not start Next.js, so runner env may disagree with the server.
 * GET /api/bookings: auth gate → 401; auth off → 400 (missing required query).
 */
async function serverAuthGateEnabled(request: APIRequestContext): Promise<boolean> {
  const res = await request.get("/api/bookings");
  expect([400, 401]).toContain(res.status());
  expect(res.status()).not.toBe(500);
  return res.status() === 401;
}

test.describe("Booking Wizard — API reliability", () => {
  test("POST /api/bookings without credentials returns 401 (not 500)", async ({
    request,
  }) => {
    const res = await request.post("/api/bookings", {
      data: {
        brand_org_id: "00000000-0000-0000-0000-000000000001",
        talent_profile_id: "00000000-0000-0000-0000-000000000801",
        date_start: "2026-08-01",
        date_end: "2026-08-03",
      },
    });
    // Auth on → withOperatorAuth 401; auth off → RPC "authentication required" → 401.
    expect(res.status()).toBe(401);
  });

  test("POST /api/bookings rejects invalid body without 500", async ({ request }) => {
    const authOn = await serverAuthGateEnabled(request);
    const res = await request.post("/api/bookings", {
      data: { invalid: true },
    });
    // Auth on → 401 before body validation; auth off → 400 from parseCreateBookingBody.
    expect(res.status()).toBe(authOn ? 401 : 400);
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
    // Valid body + anonymous → always 401 (gate or RPC); never talent 404.
    expect(res.status()).toBe(401);
  });

  test("GET /api/bookings without credentials does not 500", async ({ request }) => {
    // Asserts 401 (auth on) or 400 (auth off / missing query) — never 500.
    await serverAuthGateEnabled(request);
  });

  test("GET /api/bookings with invalid query does not 500", async ({ request }) => {
    const authOn = await serverAuthGateEnabled(request);
    const res = await request.get("/api/bookings?role=invalid");
    // Auth on → 401 before query validation; auth off → 400 from parseListBookingsQuery.
    expect(res.status()).toBe(authOn ? 401 : 400);
  });
});
