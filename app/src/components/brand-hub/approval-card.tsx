"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveWorkflowDraft, rejectWorkflowDraft } from "@/app/(operator)/app/brand/[id]/actions";
import type { AiProfile, BrandScoreDetail } from "@/lib/brand-hub";
import { scoreColor } from "@/lib/brand-utils";

type Props = {
  brandId: string;
  runId: string;
  draft: AiProfile;
  draftScores: BrandScoreDetail[];
  liveScores: BrandScoreDetail[];
};

export const ApprovalCard = ({ brandId, runId, draft, draftScores, liveScores }: Props) => {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "approving" | "rejecting">("idle");
  const [error, setError] = useState<string | null>(null);
  const [alreadyProcessed, setAlreadyProcessed] = useState(false);

  const handle = async (approved: boolean) => {
    setState(approved ? "approving" : "rejecting");
    setError(null);
    try {
      const result = await (approved
        ? approveWorkflowDraft(brandId, runId)
        : rejectWorkflowDraft(brandId, runId));
      if (!result.ok) {
        if (result.error === "already_processed") {
          setAlreadyProcessed(true);
        } else {
          setError(result.error ?? "Action failed");
        }
        setState("idle");
        return;
      }
      router.refresh();
    } catch {
      setError("Unexpected error — please try again");
      setState("idle");
    }
  };

  const liveScoreMap = new Map(liveScores.map((s) => [s.score_type, s.score]));
  const disabled = state !== "idle" || alreadyProcessed;

  if (alreadyProcessed) {
    return (
      <div className="rounded-2xl border border-[#E8E0D8] bg-white p-4">
        <p className="font-sans text-sm text-[#64748B]">This draft has already been processed.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#F3B93C] bg-[#FFFBF0] p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-sans text-sm font-semibold text-[#1E293B]">Brand intelligence draft ready for review</p>
          <p className="font-sans text-xs text-[#64748B]">Review the AI-generated profile, then approve to publish or reject to discard.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handle(false)}
            className="rounded-full border border-[#D1C9C0] px-4 py-1.5 font-sans text-xs text-[#64748B] transition-colors hover:border-[#94A3B8] disabled:opacity-50"
          >
            {state === "rejecting" ? "Rejecting…" : "Reject"}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handle(true)}
            className="rounded-full px-4 py-1.5 font-sans text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "#E87C4D" }}
          >
            {state === "approving" ? "Approving…" : "Approve"}
          </button>
        </div>
      </div>

      {(draft.tagline || draft.category || draft.confidenceScore != null || draft.productionReadiness != null) && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          {draft.tagline && (
            <div className="col-span-2 sm:col-span-3">
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
              <dt className="font-sans text-[10px] uppercase tracking-wide text-[#94A3B8]">AI Confidence</dt>
              <dd className="font-sans text-xs text-[#1E293B]">{Math.round(draft.confidenceScore)}%</dd>
            </div>
          )}
          {draft.productionReadiness != null && (
            <div>
              <dt className="font-sans text-[10px] uppercase tracking-wide text-[#94A3B8]">Prod Readiness</dt>
              <dd className="font-sans text-xs text-[#1E293B]">{Math.round(draft.productionReadiness)}%</dd>
            </div>
          )}
        </dl>
      )}

      {draftScores.length > 0 && (
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {draftScores.map((s) => {
            const live = liveScoreMap.get(s.score_type);
            const delta = live != null ? Math.round(s.score - live) : null;
            return (
              <div
                key={s.score_type}
                className="flex items-center justify-between rounded-lg border border-[#E8E0D8] bg-white px-3 py-2"
              >
                <span className="font-sans text-xs capitalize text-[#475569]">
                  {s.score_type.replace(/_/g, " ")}
                </span>
                <div className="flex items-center gap-2">
                  {delta !== null && delta !== 0 && (
                    <span className={`font-sans text-[10px] ${delta > 0 ? "text-green-600" : "text-red-500"}`}>
                      {delta > 0 ? "+" : ""}{delta}
                    </span>
                  )}
                  <span
                    className="rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold text-white"
                    style={{ background: scoreColor(s.score) }}
                  >
                    {Math.round(s.score)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="font-sans text-[11px] text-[#DC2626]">{error}</p>}
    </div>
  );
};
