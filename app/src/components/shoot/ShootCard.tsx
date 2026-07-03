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
  start_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  shot_count?: number | null;
  asset_count?: number | null;
  cover_image?: string | null;
};

const STATUS_CHIP: Record<string, { label: string; color: string; bg: string }> = {
  planning: { label: "Planning", color: "var(--color-warning-text, #D97706)", bg: "var(--color-bg-muted)" },
  active: { label: "Active", color: "var(--color-approved)", bg: "var(--color-bg-muted)" },
  post_production: { label: "Post", color: "#7C3AED", bg: "var(--color-bg-muted)" },
  complete: { label: "Complete", color: "var(--color-text-muted)", bg: "var(--color-bg-muted)" },
  archived: { label: "Archived", color: "var(--color-text-muted)", bg: "var(--color-bg-muted)" },
};

function formatDateHint(start: string | null | undefined, end: string | null | undefined): string | null {
  if (!start && !end) return null;
  const fmt = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (start && end && start !== end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return fmt(start);
  if (end) return fmt(end);
  return null;
}

function DnaBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color =
    score >= 80 ? "var(--color-approved)" : score >= 60 ? "var(--color-warning-text)" : "var(--color-blocked)";
  return (
    <span className="font-sans text-xs font-semibold" style={{ color }}>
      DNA {score}
    </span>
  );
}

export function ShootCard({ shoot }: { shoot: ShootRow }) {
  const chip = STATUS_CHIP[shoot.status] ?? STATUS_CHIP.planning;
  const channelCount = shoot.target_channels?.length ?? 0;
  const dateHint = formatDateHint(shoot.start_date, shoot.end_date);
  const shotCount = shoot.shot_count ?? 0;
  const assetCount = shoot.asset_count ?? 0;

  return (
    <Link
      href={`/app/shoots/${shoot.id}`}
      className="group block overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] transition-shadow hover:shadow-md"
    >
      <div
        className="flex h-32 items-center justify-center text-3xl"
        style={{
          background: shoot.cover_image
            ? `center/cover no-repeat url(${shoot.cover_image})`
            : "var(--color-bg-muted)",
        }}
        aria-hidden={!shoot.cover_image}
      >
        {!shoot.cover_image ? "📷" : null}
      </div>

      <div className="space-y-1.5 p-4">
        <p className="line-clamp-1 font-sans text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-action)]">
          {shoot.name}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 font-sans text-xs font-medium"
            style={{ background: chip.bg, color: chip.color }}
          >
            {chip.label}
          </span>
          {channelCount > 0 ? (
            <span className="font-sans text-xs text-[var(--color-text-muted)]">
              {channelCount} channel{channelCount !== 1 ? "s" : ""}
            </span>
          ) : null}
        </div>

        {dateHint ? (
          <p className="font-sans text-xs text-[var(--color-text-secondary)]">{dateHint}</p>
        ) : shoot.location ? (
          <p className="line-clamp-1 font-sans text-xs text-[var(--color-text-secondary)]">
            {shoot.location}
          </p>
        ) : null}

        {(shotCount > 0 || assetCount > 0) && (
          <p className="font-mono text-xs text-[var(--color-text-muted)]">
            {shotCount > 0 ? `${shotCount} shots` : null}
            {shotCount > 0 && assetCount > 0 ? " · " : null}
            {assetCount > 0 ? `${assetCount} assets` : null}
          </p>
        )}

        <DnaBadge score={shoot.dna_score} />
      </div>
    </Link>
  );
}
