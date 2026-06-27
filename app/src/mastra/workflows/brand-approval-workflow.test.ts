import { describe, expect, it } from "vitest";
import { brandApprovalWorkflow } from "./brand-approval-workflow";

describe("brand-approval workflow", () => {
  it("has the correct workflow id", () => {
    expect(brandApprovalWorkflow.id).toBe("brand-approval");
  });

  it("can suspend for approval and resume", { skip: !process.env.DATABASE_URL }, async () => {
    const workflow = brandApprovalWorkflow;

    const run = await workflow.createRun();
    const startResult = await run.start({
      inputData: { brandName: "Nike", industry: "Sportswear" },
    });

    expect(startResult.status).toBe("suspended");
    expect(startResult.suspendPayload).toBeDefined();
    expect(startResult.suspendPayload.step).toBe("approval");

    const resumeResult = await run.resume({
      approved: true,
      approver: "test-admin",
    });

    expect(resumeResult.status).toBe("success");
    expect(resumeResult.results).toBeDefined();
  });
});
