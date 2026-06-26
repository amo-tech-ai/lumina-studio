"use client";

// IPI-150 SHOOT-AI-003 — Gate 3 approval card

type Budget = { crew: number; studio: number; equipment: number; post: number; total: number };

const LINES: [keyof Budget, string][] = [
  ["crew", "Crew"],
  ["studio", "Studio / location"],
  ["equipment", "Equipment"],
  ["post", "Post-production"],
];

interface Props {
  budget: Budget;
  override: string;
  onOverrideChange: (val: string) => void;
}

export function BudgetApprovalCard({ budget, override, onOverrideChange }: Props) {
  const displayTotal = override
    ? (Number.isFinite(Number(override)) && Number(override) > 0 ? Number(override) : budget.total)
    : budget.total;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8E0D8] bg-white">
      <div className="border-b border-[#E8E0D8] px-4 py-3 flex items-center justify-between">
        <span className="font-sans text-sm font-medium text-[#1E293B]">Budget estimate</span>
        {override && Number.isFinite(Number(override)) && Number(override) > 0 && (
          <span className="font-sans text-xs text-[#E87C4D]">Override active</span>
        )}
      </div>

      <div className="divide-y divide-[#E8E0D8]">
        {LINES.map(([key, label]) => (
          <div key={key} className="flex justify-between px-4 py-2.5">
            <span className="font-sans text-sm text-[#64748B]">{label}</span>
            <span className="font-sans text-sm text-[#1E293B]">${budget[key].toLocaleString()}</span>
          </div>
        ))}

        <div className="flex justify-between px-4 py-3">
          <span className="font-sans text-sm font-semibold text-[#1E293B]">Total</span>
          <span className="font-sans text-sm font-semibold text-[#1E293B]">
            ${displayTotal.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="border-t border-[#E8E0D8] px-4 py-3 space-y-1">
        <label className="font-sans text-xs font-medium text-[#475569]">Override total (optional)</label>
        <div className="flex items-center gap-2">
          <span className="font-sans text-sm text-[#64748B]">$</span>
          <input
            type="number"
            placeholder={String(budget.total)}
            value={override}
            onChange={(e) => onOverrideChange(e.target.value)}
            className="w-40 rounded-xl border border-[#E8E0D8] bg-white px-4 py-2 font-sans text-sm text-[#1E293B] outline-none focus:border-[#E87C4D]"
          />
        </div>
      </div>
    </div>
  );
}
