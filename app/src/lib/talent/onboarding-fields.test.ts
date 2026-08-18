import { describe, expect, it } from "vitest";
import { INITIAL_ONBOARDING_FIELDS, resetFieldsFromAnalysis } from "./onboarding-fields";

describe("resetFieldsFromAnalysis", () => {
  it("replaces values and resets HITL state for every returned field", () => {
    const approved = INITIAL_ONBOARDING_FIELDS.map((field) => ({
      ...field,
      value: "old",
      draft: "draft",
      status: "approved" as const,
      confidence: 99,
      evidence: "previous",
      editing: true,
      evidenceOpen: true,
    }));

    const next = resetFieldsFromAnalysis(approved, [
      { key: "name", value: "Kara", confidence: 90, evidence: "new bio" },
      { key: "handle", value: "@kara", confidence: 80, evidence: "url" },
    ]);

    expect(next.every((field) => field.status === "ai")).toBe(true);
    expect(next.every((field) => field.editing === false && field.evidenceOpen === false && field.draft === "")).toBe(true);
    expect(next.find((field) => field.key === "name")).toMatchObject({ value: "Kara", confidence: 90, evidence: "new bio" });
    expect(next.find((field) => field.key === "bio")).toMatchObject({ value: "", confidence: 0, evidence: "" });
  });
});
