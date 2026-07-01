"use client";

// IPI-308 · MODEL-P2 — TalentCard: swipe (3:4 portrait) + dense row variants.
// Pass/Shortlist are always-visible buttons (a11y: no swipe-only interaction),
// per tasks/models/design/11a-model-booking-matching-talent.md.

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TalentResult } from "@/lib/talent/types";
import type { MatchScore } from "@/lib/talent/match-score";

function fitScoreColor(score: number): string {
  if (score >= 90) return "#059669";
  if (score >= 80) return "#D97706";
  return "#94A3B8";
}

function repLabel(talent: TalentResult): string {
  return talent.is_agency_represented ? "Agency" : "Independent";
}

type CardProps = {
  talent: TalentResult;
  match: MatchScore;
  selected: boolean;
  shortlisted: boolean;
  pending: boolean;
  onSelect: () => void;
  onPass: () => void;
  onShortlist: () => void;
};

export function TalentSwipeCard({
  talent,
  match,
  selected,
  shortlisted,
  pending,
  onSelect,
  onPass,
  onShortlist,
}: CardProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-md",
        selected ? "border-[#111]" : "border-[#E5E7EB]",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="relative block aspect-[3/4] w-full bg-[#F4F4F5] text-left"
        aria-label={`View match details for ${talent.display_name}`}
      >
        <span
          className="absolute right-2.5 top-2.5 rounded-full bg-white/95 px-2 py-0.5 font-sans text-xs font-bold"
          style={{ color: fitScoreColor(match.score) }}
        >
          {match.score}%
        </span>
      </button>
      <div className="flex flex-col gap-1.5 p-3">
        <p className="truncate font-sans text-sm font-semibold text-[#111]">
          {talent.display_name}
        </p>
        <p className="truncate font-sans text-xs text-[#6B7280]">
          {repLabel(talent)} · {talent.rate_tier ?? "—"}
        </p>
        <Badge variant={talent.is_available ? "default" : "secondary"} className="w-fit">
          {talent.is_available ? "Available" : "Availability unconfirmed"}
        </Badge>
        <div className="mt-1 flex gap-2">
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onPass}>
            Pass
          </Button>
          <Button
            type="button"
            variant={shortlisted ? "default" : "outline"}
            size="sm"
            className="flex-1"
            disabled={pending}
            onClick={onShortlist}
          >
            {shortlisted ? "Shortlisted" : "Shortlist"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TalentRow({
  talent,
  match,
  selected,
  shortlisted,
  pending,
  onSelect,
  onShortlist,
}: Omit<CardProps, "onPass">) {
  // role="button" div, not a nested <button> — a real <button> can't contain
  // another <button> (invalid HTML, inconsistent a11y/browser behavior); the
  // shortlist toggle needs its own independent interactive control.
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-label={`View match details for ${talent.display_name}`}
      className={cn(
        "flex w-full cursor-pointer items-center gap-4 rounded-xl border bg-white px-4 py-3 text-left transition-shadow hover:shadow-sm",
        selected ? "border-[#111]" : "border-[#E5E7EB]",
      )}
    >
      <div className="h-12 w-12 shrink-0 rounded-full bg-[#F4F4F5]" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-sm font-semibold text-[#111]">
          {talent.display_name}
        </p>
        <p className="truncate font-sans text-xs text-[#6B7280]">
          {repLabel(talent)} · {talent.rate_tier ?? "—"} ·{" "}
          {talent.is_available ? "Available" : "Availability unconfirmed"}
        </p>
      </div>
      <span
        className="shrink-0 font-mono text-sm font-bold"
        style={{ color: fitScoreColor(match.score) }}
      >
        {match.score}%
      </span>
      <Button
        type="button"
        variant={shortlisted ? "default" : "outline"}
        size="sm"
        disabled={pending}
        aria-label={shortlisted ? `Remove ${talent.display_name} from shortlist` : `Add ${talent.display_name} to shortlist`}
        onClick={(e) => {
          e.stopPropagation();
          onShortlist();
        }}
      >
        {shortlisted ? "★" : "☆"}
      </Button>
    </div>
  );
}
