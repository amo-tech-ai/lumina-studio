"use client";

// IPI-150 SHOOT-AI-003 — Gate 2 approval card

type Shot = { shot_number: number; description: string; angle: string; lighting: string; deliverable_ids: string[] };

interface Props {
  shots: Shot[];
  deliverableCount: number;
  uncoveredWarnings?: string[];
  onChange: (shots: Shot[]) => void;
}

export function ShotListApprovalCard({ shots, deliverableCount, uncoveredWarnings = [], onChange }: Props) {
  const update = (shot_number: number, patch: Partial<Shot>) =>
    onChange(shots.map((s) => (s.shot_number === shot_number ? { ...s, ...patch } : s)));

  return (
    <div className="space-y-4">
      {uncoveredWarnings.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-sans text-sm text-red-700">
          🚨 Coverage gaps: {uncoveredWarnings.join(" · ")}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E8E0D8] bg-white">
        <div className="border-b border-[#E8E0D8] px-4 py-3">
          <span className="font-sans text-sm font-medium text-[#1E293B]">
            {shots.length} shots · {deliverableCount} deliverable types
          </span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E8E0D8]">
              {["#", "Description", "Angle", "Lighting"].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-sans text-xs font-medium text-[#94A3B8]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shots.map((s) => (
              <tr key={s.shot_number} className="border-b border-[#E8E0D8] last:border-0">
                <td className="px-4 py-2.5 font-sans text-xs text-[#94A3B8]">
                  {String(s.shot_number).padStart(2, "0")}
                </td>
                <td className="px-2 py-1.5">
                  <input
                    className="w-full rounded border border-transparent px-2 py-1 font-sans text-sm text-[#1E293B] outline-none hover:border-[#E8E0D8] focus:border-[#E87C4D]"
                    value={s.description}
                    onChange={(e) => update(s.shot_number, { description: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    className="w-24 rounded border border-transparent px-2 py-1 font-sans text-xs text-[#64748B] outline-none hover:border-[#E8E0D8] focus:border-[#E87C4D]"
                    value={s.angle}
                    onChange={(e) => update(s.shot_number, { angle: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    className="w-36 rounded border border-transparent px-2 py-1 font-sans text-xs text-[#64748B] outline-none hover:border-[#E8E0D8] focus:border-[#E87C4D]"
                    value={s.lighting}
                    onChange={(e) => update(s.shot_number, { lighting: e.target.value })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
