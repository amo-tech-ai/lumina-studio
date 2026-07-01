/** Operator-facing hero copy from KPI snapshot (pure — unit-testable). */
export function buildHeroGreeting(input: {
  brandName: string;
  pendingApprovalCount: number;
  recentShootName?: string | null;
}): { headline: string; subline: string } {
  const { brandName, pendingApprovalCount, recentShootName } = input;
  const headline = `You're working with ${brandName}.`;

  if (pendingApprovalCount > 0) {
    const noun = pendingApprovalCount === 1 ? "approval needs" : "approvals need";
    return {
      headline,
      subline: `${pendingApprovalCount} ${noun} your review. Next: open Brand Hub to approve or refine AI drafts.`,
    };
  }

  if (recentShootName) {
    return {
      headline,
      subline: `Latest shoot: ${recentShootName}. Next: plan deliverables or open Shoots to continue production.`,
    };
  }

  return {
    headline,
    subline: "Next: generate deliverables for your channels, or plan a new shoot.",
  };
}
