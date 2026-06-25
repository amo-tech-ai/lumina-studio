"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { applyDraft, discardDraft } from "@/app/(operator)/app/brand/[id]/actions";
import type { AiProfile } from "@/lib/brand-hub";

type Props = { brandId: string; draft: AiProfile };

export const DraftBanner = ({ brandId, draft }: Props) => {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "applying" | "discarding">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    setState("applying");
    setError(null);
    try {
      const result = await applyDraft(brandId);
      if (!result.ok) { setError(result.error ?? "Apply failed"); return; }
      router.refresh();
    } catch {
      setError("Apply failed unexpectedly");
    } finally {
      setState("idle");
    }
  };

  const handleDiscard = async () => {
    setState("discarding");
    setError(null);
    try {
      const result = await discardDraft(brandId);
      if (!result.ok) { setError(result.error ?? "Discard failed"); return; }
      router.refresh();
    } catch {
      setError("Discard failed unexpectedly");
    } finally {
      setState("idle");
    }
  };

  return (
    <div className="rounded-2xl border border-[#F3B93C] bg-[#FFFBF0] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-sans text-sm font-medium text-[#1E293B]">
            New analysis draft ready
          </p>
          <p className="font-sans text-xs text-[#64748B]">
            Review the changes below, then apply or discard.
          </p>
          {(draft.tagline || draft.category || draft.confidenceScore != null) && (
            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
              {draft.tagline && (
                <div>
                  <dt className="font-sans text-[10px] uppercase tracking-wide text-[#94A3B8]">Tagline</dt>
                  <dd className="font-sans text-xs text-[#1E293B]">{draft.tagline}</dd>
                </div>
              )}
              {draft.category && (
                <div>
                  <dt className="font-sans text-[10px] uppercase tracking-wide text-[#94A3B8]">Category</dt>
                  <dd className="font-sans text-xs text-[#1E293B]">{draft.category}</dd>
                </div>
              )}
              {draft.confidenceScore != null && (
                <div>
                  <dt className="font-sans text-[10px] uppercase tracking-wide text-[#94A3B8]">Confidence</dt>
                  <dd className="font-sans text-xs text-[#1E293B]">{Math.round(draft.confidenceScore)}%</dd>
                </div>
              )}
            </dl>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={state !== "idle"}
            onClick={handleDiscard}
            className="rounded-full border border-[#D1C9C0] px-4 py-1.5 font-sans text-xs text-[#64748B] transition-colors hover:border-[#94A3B8] disabled:opacity-50"
          >
            {state === "discarding" ? "Discarding…" : "Discard"}
          </button>
          <button
            type="button"
            disabled={state !== "idle"}
            onClick={handleApply}
            className="rounded-full px-4 py-1.5 font-sans text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "#E87C4D" }}
          >
            {state === "applying" ? "Applying…" : "Apply draft"}
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-2 font-sans text-[11px] text-[#DC2626]">{error}</p>
      )}
    </div>
  );
};
