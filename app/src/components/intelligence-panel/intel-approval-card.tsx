"use client";

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

import { isPanelApprovalFallback } from "@/lib/intelligence/panel-approval-fallbacks";
import type { IntelligenceApprovalItem } from "@/lib/intelligence/panel-contract";

import styles from "./intelligence-panel.module.css";

type Props = {
  item: IntelligenceApprovalItem;
};

function confidenceColor(confidence: number): string {
  if (confidence >= 80) return "var(--color-approved, #059669)";
  if (confidence >= 60) return "var(--color-warning-text, #d97706)";
  return "var(--color-dna-low, #dc2626)";
}

export function IntelApprovalCard({ item }: Props) {
  const confidence = item.confidence ?? 87;
  const preview = item.explanation ?? "AI draft ready for your review.";
  const source = item.source ?? "brand-match";
  const isFallback = isPanelApprovalFallback(item.id);

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
          onClick={() =>
            toast.success(
              isFallback
                ? `Approved: ${item.label} (preview)`
                : `Approved: ${item.label}`,
            )
          }
        >
          Approve
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
