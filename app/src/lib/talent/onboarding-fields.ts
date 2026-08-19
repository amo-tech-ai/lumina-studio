export type OnboardingFieldStatus = "ai" | "approved" | "edited";

export type OnboardingField = {
  key: string;
  label: string;
  value: string;
  draft: string;
  status: OnboardingFieldStatus;
  confidence: number;
  evidence: string;
  editing: boolean;
  evidenceOpen: boolean;
};

export type AnalyzedField = {
  key: string;
  label?: string;
  value: string;
  confidence: number;
  evidence: string;
};

export const INITIAL_ONBOARDING_FIELDS: OnboardingField[] = [
  { key: "name", label: "Full name", value: "", draft: "", status: "ai", confidence: 0, evidence: "", editing: false, evidenceOpen: false },
  { key: "handle", label: "Handle", value: "", draft: "", status: "ai", confidence: 0, evidence: "", editing: false, evidenceOpen: false },
  { key: "niche", label: "Niche", value: "", draft: "", status: "ai", confidence: 0, evidence: "", editing: false, evidenceOpen: false },
  { key: "tier", label: "Tier", value: "", draft: "", status: "ai", confidence: 0, evidence: "", editing: false, evidenceOpen: false },
  { key: "loc", label: "Location", value: "", draft: "", status: "ai", confidence: 0, evidence: "", editing: false, evidenceOpen: false },
  { key: "rate", label: "Suggested day rate", value: "", draft: "", status: "ai", confidence: 0, evidence: "", editing: false, evidenceOpen: false },
  { key: "bio", label: "Short bio", value: "", draft: "", status: "ai", confidence: 0, evidence: "", editing: false, evidenceOpen: false },
];

/** Re-running analysis always requires a fresh HITL pass. */
export function resetFieldsFromAnalysis(
  current: OnboardingField[],
  analyzed: AnalyzedField[],
): OnboardingField[] {
  return current.map((field) => {
    const next = analyzed.find((candidate) => candidate.key === field.key);
    return {
      ...field,
      value: next?.value ?? "",
      draft: "",
      status: "ai",
      confidence: next?.confidence ?? 0,
      evidence: next?.evidence ?? "",
      editing: false,
      evidenceOpen: false,
    };
  });
}
