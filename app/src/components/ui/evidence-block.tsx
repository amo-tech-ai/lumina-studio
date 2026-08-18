export interface EvidenceBlockProps {
  confidence: number;
  evidence: string;
  isOpen: boolean;
  onToggle?: () => void;
}

export function EvidenceBlock({ confidence, evidence, isOpen, onToggle }: EvidenceBlockProps) {
  const confColor = confidence >= 80 ? 'var(--dna-high)' : confidence >= 60 ? 'var(--warning-text)' : 'var(--blocked)';
  const confPct = `${confidence}%`;
  
  return (
    <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-widest text-gray-500">Why this value</span>
        <span className="font-mono text-xs font-semibold" style={{ color: confColor }}>
          {confidence}% confidence
        </span>
      </div>
      <div className="h-1 rounded-full bg-white border border-gray-200 overflow-hidden mb-2">
        <div 
          className="h-full transition-all duration-300"
          style={{ width: confPct, backgroundColor: confColor }}
        />
      </div>
      <div className="text-sm text-gray-600 leading-relaxed">{evidence}</div>
    </div>
  );
}
