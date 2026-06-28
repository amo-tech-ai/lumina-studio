import { describe, expect, it } from "vitest";
import { getMastra } from "../index";

describe("brand-approval workflow", () => {
  it("has the correct workflow id", () => {
    expect(getMastra().getWorkflow("brand-approval").id).toBe("brand-approval");
  });

  it(
    "can suspend for approval and resume",
    { skip: !process.env.DATABASE_URL, timeout: 30_000 },
    async () => {
    const workflow = getMastra().getWorkflow("brand-approval");
    const run = await workflow.createRun();
    const startResult = await run.start({
      inputData: { brandName: "Nike", industry: "Sportswear" },
    });

    expect(startResult.status).toBe("suspended");
    expect(startResult.suspendPayload).toBeDefined();

    const resumeResult = await run.resume({
      step: "approval",
      resumeData: { approved: true, approver: "test-admin" },
    });

    expect(resumeResult.status).toBe("success");
  },
  );
});
