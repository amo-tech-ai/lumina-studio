"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  approveWorkflowDraft,
  rejectWorkflowDraft,
} from "@/app/(operator)/app/brand/[id]/actions";
import type { AiProfile } from "@/lib/brand-hub";
import {
  brandListCoverForBrand,
  heroFallbackForBrand,
} from "@/lib/command-center/sample-images";

import styles from "./brand-detail.module.css";

type Props = {
  brandId: string;
  runId: string;
  draft: AiProfile;
};

export function BrandDetailDraftCard({ brandId, runId, draft }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "approving" | "rejecting">("idle");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const beforeSrc = brandListCoverForBrand(`${brandId}-before`);
  const afterSrc = heroFallbackForBrand(`${brandId}-after`);

  const handle = async (approved: boolean) => {
    setState(approved ? "approving" : "rejecting");
    setError(null);
    try {
      const result = await (approved
        ? approveWorkflowDraft(brandId, runId)
        : rejectWorkflowDraft(brandId, runId));
      if (!result.ok) {
        setError(result.error ?? "Action failed");
        setState("idle");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Unexpected error — please try again");
      setState("idle");
    }
  };

  if (done) {
    return (
      <div className={styles.hitl} role="status">
        <p className={styles.hitlCopy} style={{ color: "var(--color-approved)", margin: 0 }}>
          Approved — profile updated. Publishing to Brand DNA…
        </p>
      </div>
    );
  }

  const summary =
    draft.tagline ??
    draft.category ??
    "Visual identity — review the AI draft before publishing to Brand DNA.";

  return (
    <div className={styles.hitl} role="alertdialog" aria-label="Approval required">
      <div className={styles.hitlHeader}>
        <span className={styles.hitlDot} aria-hidden />
        <span className={styles.hitlTitle}>Brand DNA Draft — Visual Identity</span>
        <span className={styles.hitlBadge}>AI DRAFT</span>
      </div>
      <p className={styles.hitlCopy}>{summary}</p>

      <div className={styles.compareGrid}>
        <div>
          <div className={styles.compareImageWrap}>
            <span className={styles.compareLabel}>Before</span>
            <Image src={beforeSrc} alt="" fill sizes="200px" className={styles.compareImage} />
          </div>
          <p className={styles.compareCaption}>Studio-centric, product-focused</p>
        </div>
        <div>
          <div className={`${styles.compareImageWrap} ${styles.compareImageWrapAfter}`}>
            <span className={`${styles.compareLabel} ${styles.compareLabelAfter}`}>After</span>
            <Image src={afterSrc} alt="" fill sizes="200px" className={styles.compareImage} />
          </div>
          <p className={`${styles.compareCaption} ${styles.compareCaptionStrong}`}>
            Dynamic mixed-context — studio + lifestyle
          </p>
        </div>
      </div>

      {draft.confidenceScore != null ? (
        <p className={styles.hitlCopy} style={{ marginBottom: "1rem" }}>
          <span style={{ fontWeight: 600, color: "var(--color-approved)" }}>
            {Math.round(draft.confidenceScore)}% confidence
          </span>
          <span style={{ color: "var(--color-text-muted)" }}> · Based on crawled pages + asset audit</span>
        </p>
      ) : null}

      <div className={styles.hitlActions}>
        <button
          type="button"
          className={styles.btnPrimary}
          disabled={state !== "idle"}
          onClick={() => handle(true)}
        >
          {state === "approving" ? "Approving…" : "Approve"}
        </button>
        <button type="button" className={styles.btnSecondary} disabled={state !== "idle"}>
          Edit
        </button>
        <button
          type="button"
          className={styles.btnGhost}
          disabled={state !== "idle"}
          onClick={() => handle(false)}
        >
          {state === "rejecting" ? "Discarding…" : "Discard"}
        </button>
      </div>
      {error ? <p className={styles.errorCopy}>{error}</p> : null}
    </div>
  );
}
