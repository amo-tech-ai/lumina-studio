export type EvidenceSuggestion = {
  text: string;
  gain: number;
};

export type EvidenceItem = {
  text: string;
};

export type EvidenceBlockProps = {
  title: string;
  score: number;
  potential?: number;
  confidence: number;
  why: string;
  reasoning?: string;
  evidence?: EvidenceItem[];
  evidenceImgs?: string[];
  suggestions?: EvidenceSuggestion[];
  beforeImg?: string;
  afterImg?: string;
  onApprove?: () => void;
  onImprove?: () => void;
  onRegenerate?: () => void;
  loading?: boolean;
  className?: string;
};
