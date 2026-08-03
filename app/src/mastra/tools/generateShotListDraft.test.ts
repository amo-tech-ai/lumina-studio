import { describe, expect, it } from "vitest";
import { generateShotListDraft } from "./generateShotListDraft";

const REFERENCE_SHOT_TYPES = [
  {
    id: "ref-ghost",
    angle: "Ghost front",
    description: "Full front view on ghost mannequin",
    channel_fit: ["shopify_pdp", "amazon"],
    background: "white",
  },
];

function isToolValidationError(result: unknown): boolean {
  return Boolean(
    result &&
      typeof result === "object" &&
      "error" in result &&
      (result as { error?: boolean }).error === true,
  );
}

describe("generateShotListDraft — HITL + reference grounding (AGENT-PLAN-001)", () => {
  it("refuses when approved_deliverables is empty", async () => {
    const result = await generateShotListDraft.execute!(
      { approved_deliverables: [], reference_shot_types: REFERENCE_SHOT_TYPES },
      {} as never,
    );
    expect(isToolValidationError(result)).toBe(true);
    expect(String((result as { message?: string }).message)).toMatch(/approved deliverable/i);
  });

  it("refuses when reference_shot_types is missing — must call lookupShotReferences first", async () => {
    const result = await generateShotListDraft.execute!(
      {
        approved_deliverables: [{ channel: "amazon", format: "JPG", quantity: 4 }],
        reference_shot_types: [],
      },
      {} as never,
    );
    expect(isToolValidationError(result)).toBe(true);
    expect(String((result as { message?: string }).message)).toMatch(/lookupShotReferences/);
  });

  it("returns shots with angles from reference library only", async () => {
    const result = await generateShotListDraft.execute!(
      {
        approved_deliverables: [
          { id: "11111111-1111-4111-8111-111111111111", channel: "amazon", format: "JPG", quantity: 6 },
        ],
        reference_shot_types: REFERENCE_SHOT_TYPES,
        product_names: ["Linen blazer"],
      },
      {} as never,
    );
    expect(isToolValidationError(result)).toBe(false);
    const ok = result as {
      total_shots: number;
      shots: { angle: string; reference_id: string }[];
    };
    expect(ok.total_shots).toBeGreaterThan(0);
    expect(ok.shots.every((s) => s.angle === "Ghost front")).toBe(true);
    expect(ok.shots.every((s) => s.reference_id === "ref-ghost")).toBe(true);
    expect(ok.shots.some((s) => s.angle === "front" || s.angle === "3/4 angle")).toBe(false);
  });
});
