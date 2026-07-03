"use client";

import { shootListCoverForShoot } from "@/lib/command-center/sample-images";
import { formatShootCardDate } from "@/lib/shoot/shoot-list-format";
import { shootStatusDisplay } from "@/lib/shoot/shoot-list-filters";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ShootListItem = {
  id: string;
  name: string;
  status: string;
  dna_score: number | null;
  updated_at: string;
  start_date?: string | null;
  end_date?: string | null;
  cover_image?: string | null;
  brandName?: string | null;
  shot_count?: number | null;
};

type Props = {
  shoot: ShootListItem;
  selected?: boolean;
  onSelect?: (shootId: string) => void;
};

export function ShootCard({ shoot, selected = false, onSelect }: Props) {
  const { label, dot } = shootStatusDisplay(shoot.status);
  const coverUrl = shootListCoverForShoot(shoot.id, shoot.cover_image);
  const dateLabel = formatShootCardDate(shoot.start_date) ?? "—";

  return (
    <button
      type="button"
      className={cn(
        "block w-full overflow-hidden rounded-[var(--card-radius)] border border-[var(--color-border)] bg-[var(--color-bg-card)] text-left shadow-[var(--shadow-card)] transition-colors duration-200 ease-out hover:border-[var(--color-border-strong)]",
        selected && "border-[var(--color-text-primary)] hover:border-[var(--color-text-primary)]",
      )}
      data-testid="shoot-list-card"
      data-selected={selected ? "true" : undefined}
      aria-pressed={selected}
      onClick={() => onSelect?.(shoot.id)}
    >
      <div
        className="relative aspect-[4/3] w-full bg-[var(--color-bg-muted)] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${coverUrl}")` }}
        aria-hidden
      >
        <span className="absolute inset-0 [background:linear-gradient(to_bottom,transparent_45%,rgb(0_0_0_/_0.5))]" />
        {shoot.dna_score != null ? (
          <Badge className="absolute right-[9px] top-[9px] z-[1] border-transparent bg-black/55 px-[7px] py-[2px] text-[10px] font-semibold tabular-nums leading-tight text-white backdrop-blur-[3px]">
            DNA {Math.round(shoot.dna_score)}
          </Badge>
        ) : null}
        <Badge className="absolute bottom-[10px] left-[11px] z-[1] gap-1.5 border-transparent bg-black/50 px-[9px] py-[3px] text-[11px] font-semibold leading-tight text-white backdrop-blur-[3px]">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: dot }}
            aria-hidden
          />
          {label}
        </Badge>
      </div>
      <div className="px-[14px] pb-[15px] pt-[13px]">
        <div className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
          {shoot.name}
        </div>
        <div className="mt-[5px] flex items-center justify-between gap-2">
          <span className="truncate text-xs text-[var(--color-text-muted)]">
            {shoot.brandName ?? "—"}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-[var(--color-text-muted)]">
            {dateLabel}
          </span>
        </div>
      </div>
    </button>
  );
}

/** @deprecated use ShootListItem */
export type ShootRow = ShootListItem;
