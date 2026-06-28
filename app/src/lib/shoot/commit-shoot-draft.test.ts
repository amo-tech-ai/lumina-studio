import { describe, expect, it, vi } from "vitest";
import { commitShootDraft, parseCommitShootDraftBody } from "./commit-shoot-draft";

const baseInput = {
  brand_id: "11111111-1111-1111-1111-111111111111",
  shoot_name: "Spring",
  deliverables: [{ channel: "shopify", quantity: 2 }],
  shots: [{ shot_number: 1, description: "Hero" }],
  approved_budget: 1000,
};

describe("parseCommitShootDraftBody", () => {
  it("rejects negative approved_budget", () => {
    const result = parseCommitShootDraftBody({ ...baseInput, approved_budget: -1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/approved_budget/i);
  });

  it("rejects fractional deliverable quantity", () => {
    const result = parseCommitShootDraftBody({
      ...baseInput,
      deliverables: [{ channel: "shopify", quantity: 1.5 }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/integer quantity/i);
  });

  it("rejects unsupported deliverable channel", () => {
    const result = parseCommitShootDraftBody({
      ...baseInput,
      deliverables: [{ channel: "snapchat", quantity: 1 }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Unsupported deliverable channel/i);
  });
});

describe("commitShootDraft validation", () => {
  it("rejects invalid channels from direct callers", async () => {
    const userSb = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ error: null }),
          }),
        }),
      }),
    };

    const result = await commitShootDraft({
      input: {
        ...baseInput,
        channels: ["snapchat"],
        deliverables: [{ channel: "shopify", quantity: 1 }],
      },
      operatorId: "22222222-2222-2222-2222-222222222222",
      userSb: userSb as never,
      serviceSb: { rpc: vi.fn() } as never,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toMatch(/Unsupported channel/i);
    }
  });
});
