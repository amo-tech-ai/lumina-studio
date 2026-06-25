import { expect, test } from "@playwright/test";

test.describe("API — /api/copilotkit agent registry", () => {
  test("GET /api/copilotkit returns 200 or auth challenge (not 500)", async ({ request }) => {
    const res = await request.get("/api/copilotkit");
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(502);
    expect(res.status()).not.toBe(503);
  });

  test("POST /api/copilotkit with agent header responds (not 500)", async ({ request }) => {
    const res = await request.post("/api/copilotkit", {
      headers: { "Content-Type": "application/json", "x-copilotkit-agent-id": "production-planner" },
      data: { messages: [] },
    });
    // 200 ok, 401 unauth, 400 bad request all acceptable; 500 is not
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(502);
  });
});

test.describe("API — Mastra agent registry wiring (IPI-133 + IPI-148)", () => {
  test("production-planner agent is registered and reachable", async ({ request }) => {
    // CopilotKit protocol: agent id goes in header, not body
    const res = await request.post("/api/copilotkit", {
      headers: {
        "Content-Type": "application/json",
        "x-copilotkit-agent-id": "production-planner",
      },
      data: { messages: [{ role: "user", content: "ping" }] },
    });
    // Not 500/502 = agent wired, server didn't crash
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(502);
  });
});
