import { describe, expect, it } from "vitest";
import { CANONICAL_UUID_RE, isUuid, parseCreateBookingBody, parseListBookingsQuery } from "./validation";

const ORG_ID = "22222222-2222-4222-8222-222222222222";
// The deterministic seed org id used across QA/demo fixtures. No version (position 15
// is "0", not [1-5]) or variant (position 20 is "0", not [89ab]) nibble — a real value
// PostgreSQL's uuid type accepts (confirmed via `select '...'::uuid`) that the old
// RFC4122-only UUID_RE rejected. This exact string reaching /api/bookings is the bug
// this file's coverage exists to prevent from regressing.
const QA_ORG_ID = "00000000-0000-0000-0000-000000000001";
const TALENT_ID = "33333333-3333-4333-8333-333333333333";

describe("CANONICAL_UUID_RE / isUuid", () => {
  it("accepts the deterministic QA organization id", () => {
    expect(isUuid(QA_ORG_ID)).toBe(true);
    expect(CANONICAL_UUID_RE.test(QA_ORG_ID)).toBe(true);
  });

  it("accepts a standard UUIDv4", () => {
    expect(isUuid("78a2b1d7-d0a6-42e2-974c-e7541ab45d61")).toBe(true);
  });

  it("accepts a UUIDv7", () => {
    // v7 layout: time-ordered, version nibble "7", variant nibble in [89ab] —
    // still just a hex-grouped string as far as Postgres (and this validator) cares.
    expect(isUuid("018e5f3a-7c1b-7000-8000-1234567890ab")).toBe(true);
  });

  it("is case-insensitive, matching Postgres uuid input", () => {
    expect(isUuid(QA_ORG_ID.toUpperCase())).toBe(true);
  });

  it.each([
    ["empty string", ""],
    ["too short", "00000000-0000-0000-0000-00000000000"],
    ["too long", "00000000-0000-0000-0000-0000000000011"],
    ["missing hyphens", "00000000000000000000000000000000001"],
    ["non-hex characters", "0000000g-0000-0000-0000-000000000001"],
    ["wrong group length", "0000000-00000-0000-0000-000000000001"],
    ["not a string (number)", 123],
    ["null", null],
    ["undefined", undefined],
  ])("rejects malformed input: %s", (_label, value) => {
    expect(isUuid(value)).toBe(false);
  });
});

describe("parseCreateBookingBody", () => {
  const baseBody = {
    brand_org_id: QA_ORG_ID,
    talent_profile_id: TALENT_ID,
    shoot_id: null,
    date_start: "2026-08-15",
    date_end: "2026-08-16",
    message: "Hi, we'd like to book you.",
  };

  it("accepts the deterministic QA organization id as brand_org_id", () => {
    const parsed = parseCreateBookingBody(baseBody);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.brand_org_id).toBe(QA_ORG_ID);
    }
  });

  it("rejects a malformed brand_org_id with the original error message", () => {
    const parsed = parseCreateBookingBody({ ...baseBody, brand_org_id: "not-a-uuid" });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.message).toBe("brand_org_id must be a valid UUID.");
    }
  });

  it("rejects a malformed talent_profile_id", () => {
    const parsed = parseCreateBookingBody({ ...baseBody, talent_profile_id: "nope" });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.message).toBe("talent_profile_id must be a valid UUID.");
    }
  });
});

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
