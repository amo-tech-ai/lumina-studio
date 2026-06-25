import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

const researchBrandStep = createStep({
  id: "researchBrand",
  description: "Researches a brand's background and generates a summary",
  inputSchema: z.object({
    brandName: z.string(),
    industry: z.string(),
  }),
  outputSchema: z.object({
    brandId: z.string(),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    const { brandName, industry } = context.inputData;
    return {
      brandId: `brand-${Date.now()}`,
      summary: `Research complete for ${brandName} in ${industry}`,
    };
  },
});

const approvalStep = createStep({
  id: "approval",
  description: "Suspends workflow for human approval",
  inputSchema: z.object({
    brandId: z.string(),
    summary: z.string(),
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    approver: z.string(),
  }),
  execute: async ({ context, suspend }) => {
    const resumeData = await suspend({
      message: "Brand requires manual approval before committing",
      step: "approval",
    });
    return {
      approved: resumeData.approved,
      approver: resumeData.approver,
    };
  },
});

const commitBrandStep = createStep({
  id: "commitBrand",
  description: "Commits the approved brand to the system",
  inputSchema: z.object({
    approved: z.boolean(),
    approver: z.string(),
  }),
  outputSchema: z.object({
    brandId: z.string(),
    status: z.string(),
  }),
  execute: async ({ context }) => {
    const { brandId } = context.stepsResults.researchBrand.output;
    const { approved, approver } = context.stepsResults.approval.output;
    return {
      brandId,
      status: approved ? `committed by ${approver}` : "rejected",
    };
  },
});

export const brandApprovalWorkflow = createWorkflow({
  id: "brand-approval",
  description: "Three-step HITL workflow: research → approve → commit",
})
  .then(researchBrandStep)
  .then(approvalStep)
  .then(commitBrandStep)
  .commit();
