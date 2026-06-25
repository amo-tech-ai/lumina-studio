export const scoreColor = (score: number) => {
  if (score >= 70) return "#059669";
  if (score >= 40) return "#D97706";
  return "#DC2626";
};

const ACRONYMS = new Set(["dna"]);

export const scoreLabel = (type: string) =>
  type
    .replace(/_/g, " ")
    .replace(/\b\w+\b/g, (w) => (ACRONYMS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)));
