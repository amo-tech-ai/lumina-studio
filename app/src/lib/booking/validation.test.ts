import { describe, expect, it } from "vitest";
import { parseListBookingsQuery } from "./validation";

const ORG_ID = "22222222-2222-4222-8222-222222222222";

describe("parseListBookingsQuery status filter", () => {
  it("parses comma-separated status values in a single query param", () => {
    const params = new URLSearchParams(`role=brand&org_id=${ORG_ID}&status=requested,quoted`);
    const parsed = parseListBookingsQuery(params);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.status).toEqual(["requested", "quoted"]);
    }
  });

  it("parses repeated status query params", () => {
    const params = new URLSearchParams(`role=brand&org_id=${ORG_ID}`);
    params.append("status", "requested");
    params.append("status", "quoted");
    const parsed = parseListBookingsQuery(params);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.status).toEqual(["requested", "quoted"]);
    }
  });

  it("returns validation error for invalid status tokens", () => {
    const params = new URLSearchParams(`role=brand&org_id=${ORG_ID}&status=requested,nope`);
    const parsed = parseListBookingsQuery(params);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.message).toContain("Invalid status filter");
    }
  });
});
