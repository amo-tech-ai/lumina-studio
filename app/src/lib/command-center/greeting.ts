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
    const next = recentShootName
      ? `Next: generate deliverables for ${recentShootName}.`
      : "Next: generate IG deliverables for your active campaign.";
    return {
      headline,
      subline: `${pendingApprovalCount} ${noun} your review. ${next}`,
    };
  }

  if (recentShootName) {
    return {
      headline,
      subline: `Next: generate deliverables for ${recentShootName}.`,
    };
  }

  return {
    headline,
    subline: "Next: generate deliverables for your channels, or plan a new shoot.",
  };
}
