import Image from "next/image";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { ApprovalCard } from "@/components/brand-hub/approval-card";
import { approvalPreviewUrl } from "@/lib/command-center/sample-images";
import type { FeaturedApproval } from "@/lib/command-center/types";

import styles from "./command-center.module.css";

type Props = {
  pendingCount: number;
  featured: FeaturedApproval | null;
};

export function CommandCenterApprovals({ pendingCount, featured }: Props) {
  if (pendingCount === 0) return null;

  return (
    <section className={styles.approvalSection} aria-labelledby="cc-approval-title">
      <div className={styles.approvalHeader}>
        <span className={styles.thinkingDots} aria-hidden>
          <span /><span /><span />
        </span>
        <p id="cc-approval-title" className={styles.approvalWaiting}>
          Waiting for your approval
        </p>
      </div>

      {featured ? (
        <ApprovalCard
          brandId={featured.brandId}
          runId={featured.runId}
          draft={featured.draft}
          draftScores={featured.draftScores}
          liveScores={featured.liveScores}
        />
      ) : (
        <div className={styles.approvalFallback} role="alert">
          <div className={styles.approvalPreviewWrap}>
            <Image
              src={approvalPreviewUrl()}
              alt="Brand profile draft preview"
              fill
              loading="lazy"
              sizes="236px"
              className={styles.approvalPreviewImage}
            />
          </div>
          <div>
            <AlertCircle className={styles.approvalFallbackIcon} aria-hidden />
            <p className={styles.approvalFallbackTitle}>
              {pendingCount} draft{pendingCount === 1 ? "" : "s"} pending review
            </p>
            <p className={styles.approvalFallbackCopy}>
              Generated from moodboard + DNA — open Brand Hub to approve AI-generated profiles.
            </p>
            <Link href="/app/brand" className={styles.approvalFallbackLink}>
              Review in Brand Hub
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
