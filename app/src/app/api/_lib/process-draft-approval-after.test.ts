import { describe, expect, it, vi } from "vitest";

const mockAfter = vi.fn();
const mockProcess = vi.fn().mockResolvedValue({
  ok: true,
  approved: true,
  brandId: "b1",
});

vi.mock("next/server", () => ({
  after: (...args: unknown[]) => mockAfter(...args),
}));

vi.mock("./process-draft-approval", () => ({
  processBrandIntelligenceDraftApproval: (...args: unknown[]) => mockProcess(...args),
}));

describe("process-draft-approval-after (IPI-1018)", () => {
  it("schedules deferred resume with Next after(), not next/server.js", async () => {
    const { processBrandIntelligenceDraftApproval } = await import(
      "./process-draft-approval-after"
    );
    await processBrandIntelligenceDraftApproval({
      runId: "run-1",
      approved: true,
      operatorId: "op-1",
    });
    expect(mockProcess).toHaveBeenCalledTimes(1);
    const passed = mockProcess.mock.calls[0][0] as {
      scheduleWork: (task: () => void) => void;
    };
    const task = vi.fn();
    passed.scheduleWork(task);
    expect(mockAfter).toHaveBeenCalledWith(task);
  });
});
