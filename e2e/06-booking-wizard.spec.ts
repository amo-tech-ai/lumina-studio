import { expect, test } from "@playwright/test";

test.describe("Booking Wizard — API reliability", () => {
  test("POST /api/bookings returns 401 without auth", async ({ request }) => {
    const res = await request.post("/api/bookings", {
      data: {
        brand_org_id: "00000000-0000-0000-0000-000000000001",
        talent_profile_id: "00000000-0000-0000-0000-000000000801",
        date_start: "2026-08-01",
        date_end: "2026-08-03",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/bookings returns 400 for invalid body", async ({ request }) => {
    const res = await request.post("/api/bookings", {
      data: { invalid: true },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/bookings returns 401 for non-existent talent UUID", async ({ request }) => {
    const res = await request.post("/api/bookings", {
      data: {
        brand_org_id: "00000000-0000-0000-0000-000000000001",
        talent_profile_id: "00000000-0000-0000-0000-000000000999",
        date_start: "2026-08-01",
        date_end: "2026-08-03",
      },
    });
    // Auth check happens before validation — expect 401 not 404
    expect([401, 400]).toContain(res.status());
    expect(res.status()).not.toBe(500);
  });

  test("GET /api/bookings returns 401 without auth (not 500)", async ({ request }) => {
    const res = await request.get("/api/bookings");
    expect(res.status()).toBe(401);
  });

  test("GET /api/bookings returns 400 with invalid query params (not 500)", async ({ request }) => {
    const res = await request.get("/api/bookings?role=invalid");
    expect(res.status()).toBe(400);
    expect(res.status()).not.toBe(500);
  });
});
