import { describe, expect, it } from "vitest";

import { getInstanceUiTreatment, isValidTransition } from "./status-transitions";

describe("isValidTransition", () => {
  it("allows the documented forward transitions", () => {
    expect(isValidTransition("draft", "planned")).toBe(true);
    expect(isValidTransition("planned", "active")).toBe(true);
    expect(isValidTransition("active", "blocked")).toBe(true);
    expect(isValidTransition("active", "completed")).toBe(true);
    expect(isValidTransition("blocked", "active")).toBe(true);
    expect(isValidTransition("completed", "archived")).toBe(true);
  });

  it("allows cancellation from any non-terminal state", () => {
    expect(isValidTransition("draft", "cancelled")).toBe(true);
    expect(isValidTransition("planned", "cancelled")).toBe(true);
    expect(isValidTransition("active", "cancelled")).toBe(true);
    expect(isValidTransition("blocked", "cancelled")).toBe(true);
  });

  it("rejects transitions out of terminal states", () => {
    expect(isValidTransition("archived", "active")).toBe(false);
    expect(isValidTransition("cancelled", "draft")).toBe(false);
  });

  it("rejects skipping states", () => {
    expect(isValidTransition("draft", "active")).toBe(false);
    expect(isValidTransition("draft", "completed")).toBe(false);
  });
});

describe("getInstanceUiTreatment", () => {
  it("returns a label and tone for every status", () => {
    expect(getInstanceUiTreatment("draft")).toEqual({ label: "Draft", tone: "neutral" });
    expect(getInstanceUiTreatment("blocked")).toEqual({ label: "Blocked", tone: "danger" });
    expect(getInstanceUiTreatment("completed")).toEqual({ label: "Completed", tone: "success" });
  });
});
