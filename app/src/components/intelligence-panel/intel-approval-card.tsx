"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { applyDraft } from "@/app/(operator)/app/brand/[id]/actions";
import { isPanelApprovalFallback } from "@/lib/intelligence/panel-approval-fallbacks";
import type { IntelligenceApprovalItem } from "@/lib/intelligence/panel-contract";

import styles from "./intelligence-panel.module.css";

type Props = {
  item: IntelligenceApprovalItem;
  onApproved?: () => void;
};

function confidenceColor(confidence: number): string {
  if (confidence >= 80) return "var(--color-approved, #059669)";
  if (confidence >= 60) return "var(--color-warning-text, #d97706)";
  return "var(--color-dna-low, #dc2626)";
}

export function IntelApprovalCard({ item, onApproved }: Props) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const confidence = item.confidence ?? 87;
  const preview = item.explanation ?? "AI draft ready for your review.";
  const source = item.source ?? "brand-match";
  const isFallback = isPanelApprovalFallback(item.id);

  const handleApprove = async () => {
    if (isFallback) {
      toast.success(`Approved: ${item.label} (preview)`);
      return;
    }

    setApproving(true);
    try {
      const result = await applyDraft(item.id);
      if (!result.ok) {
        toast.error(result.error ?? "Could not approve draft");
        return;
      }
      toast.success(`Approved: ${item.label}`);
      onApproved?.();
      router.refresh();
    } catch {
      toast.error("Unexpected error — please try again");
    } finally {
      setApproving(false);
    }
  };

  return (
    <article className={styles.approvalCardDc} aria-label={`Approval: ${item.label}`}>
      <div className={styles.approvalCardTop}>
        {item.thumbnailUrl ? (
          <div className={styles.approvalCardThumb}>
            <Image
              src={item.thumbnailUrl}
              alt=""
              width={46}
              height={46}
              className={styles.approvalCardThumbImg}
            />
          </div>
        ) : null}
        <div className={styles.approvalCardCopy}>
          <div className={styles.approvalCardTitleRow}>
            <span className={styles.approvalCardDot} aria-hidden />
            <span className={styles.approvalCardTitle}>{item.label}</span>
          </div>
          <p className={styles.approvalCardPreview}>{preview}</p>
        </div>
      </div>

      <div className={styles.approvalCardMeta}>
        <span
          className={styles.approvalCardConf}
          style={{ color: confidenceColor(confidence) }}
        >
          {confidence}% confidence
        </span>
        <span className={styles.approvalCardSource}>· {source}</span>
      </div>

      <div className={styles.approvalCardActions}>
        <button
          type="button"
          className={styles.approvalCardApprove}
          disabled={approving}
          onClick={() => void handleApprove()}
        >
          {approving ? "Approving…" : "Approve"}
        </button>
        {isFallback ? (
          <button
            type="button"
            className={styles.approvalCardEdit}
            onClick={() => toast.message(`Edit: ${item.label} (preview)`)}
          >
            Edit
          </button>
        ) : (
          <Link href={item.href} className={styles.approvalCardEdit}>
            Edit
          </Link>
        )}
      </div>
    </article>
  );
}
