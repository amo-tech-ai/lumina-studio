export const scoreColor = (score: number) => {
  if (score >= 70) return "#059669";
  if (score >= 40) return "#D97706";
  return "#DC2626";
};

export const scoreLabel = (type: string) =>
  type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
