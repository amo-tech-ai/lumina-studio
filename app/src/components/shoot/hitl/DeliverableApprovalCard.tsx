"use client";

// IPI-150 SHOOT-AI-003 — Gate 1 approval card

type Deliverable = { id: string; channel: string; format: string; quantity: number };

interface Props {
  deliverables: Deliverable[];
  totalAssets: number;
  uncoveredWarnings?: string[];
  onChange: (deliverables: Deliverable[]) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function DeliverableApprovalCard({
  deliverables,
  totalAssets,
  uncoveredWarnings = [],
  onChange,
  onAdd,
  onRemove,
}: Props) {
  const update = (id: string, patch: Partial<Deliverable>) => {
    const next = deliverables.map((d) => (d.id === id ? { ...d, ...patch } : d));
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {uncoveredWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-sans text-sm text-amber-800">
          ⚠ {uncoveredWarnings.join(" · ")}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E8E0D8] bg-white">
        <div className="flex items-center justify-between border-b border-[#E8E0D8] px-4 py-3">
          <span className="font-sans text-sm font-medium text-[#1E293B]">
            {deliverables.length} deliverables · {totalAssets} total assets
          </span>
          <button
            className="font-sans text-xs text-[#E87C4D] hover:underline"
            onClick={onAdd}
          >
            + Add
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E8E0D8]">
              {["#", "Channel", "Format", "Qty", ""].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-sans text-xs font-medium text-[#94A3B8]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deliverables.map((d, i) => (
              <tr key={d.id} className="border-b border-[#E8E0D8] last:border-0">
                <td className="px-4 py-2.5 font-sans text-xs text-[#94A3B8]">{i + 1}</td>
                <td className="px-2 py-1.5">
                  <input
                    className="w-28 rounded border border-transparent px-2 py-1 font-sans text-sm text-[#1E293B] outline-none hover:border-[#E8E0D8] focus:border-[#E87C4D]"
                    placeholder="channel"
                    value={d.channel}
                    onChange={(e) => update(d.id, { channel: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    className="w-24 rounded border border-transparent px-2 py-1 font-sans text-sm text-[#64748B] outline-none hover:border-[#E8E0D8] focus:border-[#E87C4D]"
                    placeholder="format"
                    value={d.format}
                    onChange={(e) => update(d.id, { format: e.target.value })}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <input
                    type="number"
                    min={1}
                    value={d.quantity}
                    onChange={(e) => {
                      const qty = Math.max(1, Math.floor(Number(e.target.value)));
                      if (Number.isFinite(qty)) update(d.id, { quantity: qty });
                    }}
                    className="w-14 rounded border border-[#E8E0D8] px-2 py-1 font-sans text-sm text-[#1E293B]"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => onRemove(d.id)}
                    className="font-sans text-xs text-[#94A3B8] hover:text-red-500"
                  >✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
