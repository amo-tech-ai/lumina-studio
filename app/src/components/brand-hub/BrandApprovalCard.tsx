"use client";

// IPI-304 — thin domain wrapper: mutation/error state + server actions stay
// here; presentation renders through the shared shell/primitives in
// @/components/approval-card. Formerly approval-card.tsx / `ApprovalCard`.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveWorkflowDraft, rejectWorkflowDraft } from "@/app/(operator)/app/brand/[id]/actions";
import type { AiProfile, BrandScoreDetail } from "@/lib/brand-hub";
import { scoreColor } from "@/lib/brand-utils";
import {
  ApprovalCardShell,
  ApprovalHeader,
  ApprovalEvidence,
  ApprovalComparison,
  ApprovalActions,
  type ApprovalEvidenceField,
  type ApprovalComparisonRow,
} from "@/components/approval-card";

type Props = {
  brandId: string;
  runId: string;
  draft: AiProfile;
  draftScores: BrandScoreDetail[];
  liveScores: BrandScoreDetail[];
};

export const BrandApprovalCard = ({ brandId, runId, draft, draftScores, liveScores }: Props) => {
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
      <ApprovalCardShell className="rounded-2xl border border-[#E8E0D8] bg-white p-4">
        <p className="font-sans text-sm text-[#64748B]">This draft has already been processed.</p>
      </ApprovalCardShell>
    );
  }

  const evidenceFields: ApprovalEvidenceField[] = [];
  if (draft.tagline) {
    evidenceFields.push({
      key: "tagline",
      label: "Tagline",
      value: draft.tagline,
      className: "col-span-2 sm:col-span-3",
    });
  }
  if (draft.category) {
    evidenceFields.push({ key: "category", label: "Category", value: draft.category });
  }
  if (draft.confidenceScore != null) {
    evidenceFields.push({
      key: "confidence",
      label: "AI Confidence",
      value: `${Math.round(draft.confidenceScore)}%`,
    });
  }
  if (draft.productionReadiness != null) {
    evidenceFields.push({
      key: "readiness",
      label: "Prod Readiness",
      value: `${Math.round(draft.productionReadiness)}%`,
    });
  }

  const comparisonRows: ApprovalComparisonRow[] = draftScores.map((s) => {
    const live = liveScoreMap.get(s.score_type);
    const delta = live != null ? Math.round(s.score - live) : null;
    return {
      key: s.score_type,
      label: s.score_type.replace(/_/g, " "),
      delta:
        delta !== null && delta !== 0 ? (
          <span className={`font-sans text-[10px] ${delta > 0 ? "text-green-600" : "text-red-500"}`}>
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        ) : null,
      value: (
        <span
          className="rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold text-white"
          style={{ background: scoreColor(s.score) }}
        >
          {Math.round(s.score)}
        </span>
      ),
    };
  });

  return (
    <ApprovalCardShell className="rounded-2xl border border-[#F3B93C] bg-[#FFFBF0] p-5 space-y-4">
      <ApprovalHeader
        className="flex items-start justify-between gap-4"
        title="Brand intelligence draft ready for review"
        titleClassName="font-sans text-sm font-semibold text-[#1E293B]"
        subtitle="Review the AI-generated profile, then approve to publish or reject to discard."
        subtitleClassName="font-sans text-xs text-[#64748B]"
        right={
          <ApprovalActions
            state={state}
            onApprove={() => handle(true)}
            onReject={() => handle(false)}
            disabled={disabled}
            className="flex shrink-0 gap-2"
            rejectClassName="rounded-full border border-[#D1C9C0] px-4 py-1.5 font-sans text-xs text-[#64748B] transition-colors hover:border-[#94A3B8] disabled:opacity-50"
            approveClassName="rounded-full px-4 py-1.5 font-sans text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            approveStyle={{ background: "#E87C4D" }}
          />
        }
      />

      {evidenceFields.length > 0 && (
        <ApprovalEvidence
          fields={evidenceFields}
          className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3"
          labelClassName="font-sans text-[10px] uppercase tracking-wide text-[#94A3B8]"
          valueClassName="font-sans text-xs text-[#1E293B]"
        />
      )}

      {comparisonRows.length > 0 && (
        <ApprovalComparison
          rows={comparisonRows}
          className="grid grid-cols-1 gap-1 sm:grid-cols-2"
          rowClassName="flex items-center justify-between rounded-lg border border-[#E8E0D8] bg-white px-3 py-2"
          labelClassName="font-sans text-xs capitalize text-[#475569]"
          valueSlotClassName="flex items-center gap-2"
        />
      )}

      {error && <p className="font-sans text-[11px] text-[#DC2626]">{error}</p>}
    </ApprovalCardShell>
  );
};
