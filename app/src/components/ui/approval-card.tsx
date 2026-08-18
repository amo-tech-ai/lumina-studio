import { LucideIcon } from "lucide-react";

export interface ApprovalCardProps {
  label: string;
  value: string;
  draft?: string;
  isEditing: boolean;
  status: 'ai' | 'approved' | 'edited';
  confidence?: number;
  evidence?: string;
  evidenceOpen?: boolean;
  onApprove?: () => void;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onWhy?: () => void;
  onDraftChange?: (value: string) => void;
}

export function ApprovalCard({
  label,
  value,
  draft,
  isEditing,
  status,
  confidence,
  evidence,
  evidenceOpen,
  onApprove,
  onEdit,
  onSave,
  onCancel,
  onWhy,
  onDraftChange,
}: ApprovalCardProps) {
  const isAi = status === 'ai';
  const border = isAi ? 'var(--warning)' : status === 'approved' ? 'var(--approved)' : 'var(--color-border-strong)';
  
  const chipLabel = isAi ? 'AI · review' : status === 'approved' ? 'Approved' : 'Edited';
  const chipStyle = `
    flex-shrink: 0;
    padding: 4px 9px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
    ${isAi ? 'background: #fff; border: 1px solid var(--warning); color: var(--warning-text);' : ''}
    ${status === 'approved' ? 'background: #fff; border: 1px solid var(--approved); color: var(--approved);' : ''}
    ${status === 'edited' ? 'background: var(--color-bg-subtle); border: 1px solid var(--color-border); color: var(--color-text-secondary);' : ''}
  `;
  
  return (
    <div 
      className="rounded-lg p-4 bg-white"
      style={{ border: `1px solid var(--color-border)`, borderLeft: `3px solid ${border}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
          {isEditing ? (
            <input
              value={draft}
              onChange={(e) => onDraftChange?.(e.target.value)}
              className="w-full px-2 py-2 border border-gray-400 rounded text-sm outline-none"
            />
          ) : (
            <div className="text-sm text-gray-900 leading-relaxed">{value}</div>
          )}
        </div>
        <div className={chipStyle}>{chipLabel}</div>
      </div>
      
      <div className="flex items-center gap-2 mt-3">
        {isEditing ? (
          <>
            <button
              onClick={onSave}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-gray-900 text-white cursor-pointer"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded text-xs border border-gray-300 bg-white cursor-pointer"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            {isAi && (
              <>
                <button
                  onClick={onApprove}
                  className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold bg-gray-900 text-white cursor-pointer"
                >
                  Approve
                </button>
                <button
                  onClick={onEdit}
                  className="px-3 py-1.5 rounded text-xs border border-gray-300 bg-white cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={onWhy}
                  className="flex items-center gap-1 ml-auto px-2 py-1.5 rounded text-xs border-none bg-transparent text-gray-600 cursor-pointer"
                >
                  Why
                </button>
              </>
            )}
            {!isAi && (
              <>
                <span className="flex items-center gap-1 text-xs font-medium" style={{ color: status === 'approved' ? 'var(--approved)' : 'var(--color-text-secondary)' }}>
                  {status === 'approved' ? 'Approved' : 'Edited by you'}
                </span>
                <button
                  onClick={onEdit}
                  className="ml-auto px-2 py-1.5 rounded text-xs border border-gray-300 bg-white cursor-pointer"
                >
                  Edit
                </button>
              </>
            )}
          </>
        )}
      </div>
      
      {evidenceOpen && evidence && confidence && (
        <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest text-gray-500">Why this value</span>
            <span className="font-mono text-xs font-semibold" style={{ color: confidence >= 80 ? 'var(--dna-high)' : confidence >= 60 ? 'var(--warning-text)' : 'var(--blocked)' }}>
              {confidence}% confidence
            </span>
          </div>
          <div className="h-1 rounded-full bg-white border border-gray-200 overflow-hidden mb-2">
            <div 
              className="h-full transition-all duration-300"
              style={{ width: `${confidence}%`, backgroundColor: confidence >= 80 ? 'var(--dna-high)' : confidence >= 60 ? 'var(--warning-text)' : 'var(--blocked)' }}
            />
          </div>
          <div className="text-sm text-gray-600 leading-relaxed">{evidence}</div>
        </div>
      )}
    </div>
  );
}
