import { describe, expect, it } from "vitest";

import { deriveTaskState } from "./activity-state";

describe("deriveTaskState", () => {
  const now = new Date("2026-07-04T00:00:00Z");

  it("returns null for non-task activities (no due_at)", () => {
    expect(deriveTaskState(null, null, now)).toBeNull();
  });

  it("returns done when completed_at is set", () => {
    expect(deriveTaskState("2026-07-01T00:00:00Z", "2026-07-02T00:00:00Z", now)).toBe("done");
  });

  it("returns done when completed without due_at", () => {
    expect(deriveTaskState(null, "2026-07-02T00:00:00Z", now)).toBe("done");
  });

  it("returns overdue when due_at is in the past and not completed", () => {
    expect(deriveTaskState("2026-07-01T00:00:00Z", null, now)).toBe("overdue");
  });

  it("returns upcoming when due_at is in the future and not completed", () => {
    expect(deriveTaskState("2026-07-10T00:00:00Z", null, now)).toBe("upcoming");
  });
});
