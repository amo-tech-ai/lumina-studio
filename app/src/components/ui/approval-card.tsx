import type { CSSProperties } from "react";

export interface ApprovalCardProps {
  label: string;
  value: string;
  draft?: string;
  isEditing: boolean;
  status: "ai" | "approved" | "edited";
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
  const isAi = status === "ai";
  const border = isAi ? "var(--warning)" : status === "approved" ? "var(--approved)" : "var(--color-border-strong)";

  const chipLabel = isAi ? "AI · review" : status === "approved" ? "Approved" : "Edited";
  const chipStyle: CSSProperties = isAi
    ? { background: "#fff", border: "1px solid var(--warning)", color: "var(--warning-text)" }
    : status === "approved"
      ? { background: "#fff", border: "1px solid var(--approved)", color: "var(--approved)" }
      : { background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" };

  return (
    <div
      className="rounded-lg bg-white p-4"
      style={{ border: "1px solid var(--color-border)", borderLeft: `3px solid ${border}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-xs uppercase tracking-wider text-gray-500">{label}</div>
          {isEditing ? (
            <input
              value={draft}
              onChange={(e) => onDraftChange?.(e.target.value)}
              className="w-full rounded border border-gray-400 px-2 py-2 text-sm outline-none"
            />
          ) : (
            <div className="text-sm leading-relaxed text-gray-900">{value}</div>
          )}
        </div>
        <div
          className="shrink-0 rounded-full px-[9px] py-1 text-[11px] font-semibold"
          style={chipStyle}
        >
          {chipLabel}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {isEditing ? (
          <>
            <button
              onClick={onSave}
              className="cursor-pointer rounded bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="cursor-pointer rounded border border-gray-300 bg-white px-3 py-1.5 text-xs"
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
                  className="flex cursor-pointer items-center gap-1 rounded bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Approve
                </button>
                <button
                  onClick={onEdit}
                  className="cursor-pointer rounded border border-gray-300 bg-white px-3 py-1.5 text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={onWhy}
                  className="ml-auto flex cursor-pointer items-center gap-1 rounded border-none bg-transparent px-2 py-1.5 text-xs text-gray-600"
                >
                  Why
                </button>
              </>
            )}
            {!isAi && (
              <>
                <span
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: status === "approved" ? "var(--approved)" : "var(--color-text-secondary)" }}
                >
                  {status === "approved" ? "Approved" : "Edited by you"}
                </span>
                <button
                  onClick={onEdit}
                  className="ml-auto cursor-pointer rounded border border-gray-300 bg-white px-2 py-1.5 text-xs"
                >
                  Edit
                </button>
              </>
            )}
          </>
        )}
      </div>

      {evidenceOpen && evidence && typeof confidence === "number" ? (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-gray-500">Why this value</span>
            <span
              className="font-mono text-xs font-semibold"
              style={{ color: confidence >= 80 ? "var(--dna-high)" : confidence >= 60 ? "var(--warning-text)" : "var(--blocked)" }}
            >
              {confidence}% confidence
            </span>
          </div>
          <div className="mb-2 h-1 overflow-hidden rounded-full border border-gray-200 bg-white">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${confidence}%`,
                backgroundColor: confidence >= 80 ? "var(--dna-high)" : confidence >= 60 ? "var(--warning-text)" : "var(--blocked)",
              }}
            />
          </div>
          <div className="text-sm leading-relaxed text-gray-600">{evidence}</div>
        </div>
      ) : null}
    </div>
  );
}
