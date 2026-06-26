"use client";

import Link from "next/link";

export type ShootRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  dna_score: number | null;
  target_channels: string[] | null;
  estimated_budget: number | null;
  updated_at: string;
};

const STATUS_CHIP: Record<string, { label: string; color: string; bg: string }> = {
  planning: { label: "Planning", color: "#D97706", bg: "#FEF3C7" },
  active:   { label: "Active",   color: "#059669", bg: "#D1FAE5" },
  post_production: { label: "Post", color: "#7C3AED", bg: "#EDE9FE" },
  complete: { label: "Complete", color: "#64748B", bg: "#F1F5F9" },
  archived: { label: "Archived", color: "#94A3B8", bg: "#F8FAFC" },
};

function DnaBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="font-sans text-xs text-[#94A3B8]">—</span>;
  const color = score >= 80 ? "#059669" : score >= 60 ? "#D97706" : "#DC2626";
  return (
    <span className="font-sans text-xs font-semibold" style={{ color }}>
      DNA {score}
    </span>
  );
}

export function ShootCard({ shoot }: { shoot: ShootRow }) {
  const chip = STATUS_CHIP[shoot.status] ?? STATUS_CHIP.planning;
  const channelCount = shoot.target_channels?.length ?? 0;

  return (
    <Link
      href={`/app/shoots/${shoot.id}`}
      className="group block rounded-2xl border border-[#E8E0D8] bg-white p-4 transition-shadow hover:shadow-md"
    >
      {/* Thumbnail placeholder */}
      <div
        className="mb-3 flex h-32 items-center justify-center rounded-xl text-3xl"
        style={{ background: "#F8F4F0" }}
      >
        📷
      </div>

      <div className="space-y-1.5">
        <p className="font-sans text-sm font-semibold text-[#1E293B] group-hover:text-[#E87C4D] line-clamp-1">
          {shoot.name}
        </p>

        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 font-sans text-xs font-medium"
            style={{ background: chip.bg, color: chip.color }}
          >
            {chip.label}
          </span>
          {channelCount > 0 && (
            <span className="font-sans text-xs text-[#94A3B8]">{channelCount} channels</span>
          )}
        </div>

        <DnaBadge score={shoot.dna_score} />
      </div>
    </Link>
  );
}
