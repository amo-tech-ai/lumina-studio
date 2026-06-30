"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { scoreColor } from "@/lib/brand-utils";
import { cn } from "@/lib/utils";
import type { EvidenceBlockProps } from "./types";

function cssBackgroundImage(url: string): string {
  return `url("${url.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
}

function confidenceDotClass(confidence: number): string {
  const rounded = Math.round(confidence);
  if (rounded >= 85) return "bg-[#059669]";
  if (rounded >= 70) return "bg-[#D97706]";
  return "bg-[#94A3B8]";
}

function formatGain(gain: number): string {
  return gain >= 0 ? `+${gain}` : `${gain}`;
}

function Section({
  title,
  children,
  muted,
}: {
  title: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-b border-[#F0F0F1] px-[18px] py-[15px]",
        muted && "bg-[#FAFAFA]",
      )}
    >
      <div className="mb-[7px] text-[11px] font-bold uppercase tracking-wide text-[#9CA3AF]">
        {title}
      </div>
      {children}
    </div>
  );
}

export function EvidenceBlock({
  title,
  score,
  potential,
  confidence,
  why,
  reasoning,
  evidence,
  evidenceImgs,
  suggestions,
  beforeImg,
  afterImg,
  onApprove,
  onImprove,
  onRegenerate,
  loading = false,
  className,
}: EvidenceBlockProps) {
  const hasPotential = potential !== undefined && potential > score;
  const hasEvidence =
    (evidence?.length ?? 0) > 0 || (evidenceImgs?.length ?? 0) > 0;
  const hasSuggestions = (suggestions?.length ?? 0) > 0;
  const hasBeforeAfter = Boolean(beforeImg && afterImg);
  const scorePct = Math.min(100, Math.max(0, score));
  const potentialPct = hasPotential
    ? Math.min(100, Math.max(0, potential!))
    : scorePct;
  const color = scoreColor(score);

  return (
    <Card
      role="group"
      aria-label={`Evidence for ${title}`}
      className={cn(
        "overflow-hidden rounded-[20px] border-[#E5E7EB] bg-white shadow-none",
        className,
      )}
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {`${title}: score ${score}, ${Math.round(confidence)}% confidence${
          hasPotential ? `, potential ${potential}` : ""
        }`}
      </p>
      <div className="border-b border-[#F0F0F1] px-[18px] py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-sans text-[15px] font-semibold text-[#111]">
              {title}
            </h3>
            <div className="mt-[5px] flex items-center gap-[7px] text-[11px] font-semibold text-[#6B7280]">
              <span
                className={cn("h-1.5 w-1.5 shrink-0 rounded-full", confidenceDotClass(confidence))}
                aria-hidden
              />
              {Math.round(confidence)}% confidence
            </div>
          </div>
          <div className="flex shrink-0 items-end gap-2.5">
            <div className="text-right">
              <div
                className="font-sans text-[26px] font-bold leading-none tabular-nums"
                style={{ color }}
              >
                {score}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">now</div>
            </div>
            {hasPotential && (
              <>
                <span className="pb-3.5 text-[#9CA3AF]">→</span>
                <div className="text-right">
                  <div className="font-sans text-[26px] font-bold leading-none tabular-nums text-[#059669]">
                    {potential}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-[#059669]">
                    potential
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-[#F4F4F5]">
          {hasPotential && (
            <span
              className="absolute left-0 top-0 h-full rounded-full opacity-35"
              style={{
                width: `${potentialPct}%`,
                background:
                  "repeating-linear-gradient(45deg, #059669 0 4px, transparent 4px 8px)",
              }}
            />
          )}
          <span
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ width: `${scorePct}%`, background: color }}
          />
        </div>
      </div>

      <Section title="Why this score">
        <p className="m-0 font-sans text-[13px] leading-relaxed text-[#111]">{why}</p>
      </Section>

      {reasoning ? (
        <Section title="AI reasoning" muted>
          <p className="m-0 font-sans text-[13px] leading-relaxed text-[#6B7280]">
            {reasoning}
          </p>
        </Section>
      ) : null}

      {hasEvidence ? (
        <Section title="Evidence">
          {evidenceImgs && evidenceImgs.length > 0 ? (
            <div className="mb-2.5 flex flex-wrap gap-2">
              {evidenceImgs.map((src) => (
                <div
                  key={src}
                  className="h-[54px] w-[54px] rounded-xl border border-[#E5E7EB] bg-cover bg-center bg-[#FAFAFA]"
                  style={{ backgroundImage: cssBackgroundImage(src) }}
                  role="img"
                  aria-label="Evidence source"
                />
              ))}
            </div>
          ) : null}
          {evidence && evidence.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {evidence.map((item, i) => (
                <div
                  key={`${item.text}-${i}`}
                  className="flex gap-2 font-sans text-[13px] leading-snug text-[#6B7280]"
                >
                  <span className="shrink-0 text-[#9CA3AF]">·</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          ) : null}
        </Section>
      ) : null}

      {hasSuggestions ? (
        <Section title="Suggested improvements">
          <div className="flex flex-col gap-2">
            {suggestions!.map((s, i) => (
              <div
                key={`${s.text}-${i}`}
                className="flex items-start justify-between gap-3 font-sans text-[13px] text-[#111]"
              >
                <span>{s.text}</span>
                <span className="shrink-0 font-semibold tabular-nums text-[#059669]">
                  {formatGain(s.gain)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {hasBeforeAfter ? (
        <Section title="Before / After">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div
                className="aspect-square rounded-xl border border-[#E5E7EB] bg-cover bg-center bg-[#FAFAFA]"
                style={{ backgroundImage: cssBackgroundImage(beforeImg!) }}
                role="img"
                aria-label={`Before · score ${score}`}
              />
              <p className="mt-1.5 text-center font-sans text-[10px] text-[#9CA3AF]">
                Before · {score}
              </p>
            </div>
            <div>
              <div
                className="aspect-square rounded-xl border border-[#E5E7EB] bg-cover bg-center bg-[#FAFAFA]"
                style={{ backgroundImage: cssBackgroundImage(afterImg!) }}
                role="img"
                aria-label={
                  hasPotential
                    ? `After · potential ${potential}`
                    : `After · score ${score}`
                }
              />
              <p className="mt-1.5 text-center font-sans text-[10px] text-[#059669]">
                After · {potential ?? score}
              </p>
            </div>
          </div>
        </Section>
      ) : null}

      {(onApprove || onImprove || onRegenerate) && (
        <div className="flex flex-wrap gap-2 px-[18px] py-4">
          {onApprove ? (
            <Button type="button" variant="default" onClick={onApprove} disabled={loading}>
              Approve fixes
            </Button>
          ) : null}
          {onImprove ? (
            <Button type="button" variant="outline" onClick={onImprove} disabled={loading}>
              Improve
            </Button>
          ) : null}
          {onRegenerate ? (
            <Button type="button" variant="ghost" onClick={onRegenerate} disabled={loading}>
              Regenerate
            </Button>
          ) : null}
        </div>
      )}
    </Card>
  );
}
