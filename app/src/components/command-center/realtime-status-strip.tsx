"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";

import type { RealtimeStatus } from "@/lib/command-center/types";

import styles from "./command-center.module.css";

type Props = {
  status: RealtimeStatus;
  detail?: string;
  onRefresh?: () => void;
};

const STATUS_COPY: Record<
  RealtimeStatus,
  { label: string; tone: string; defaultDetail: string }
> = {
  live: {
    label: "Live",
    tone: "live",
    defaultDetail: "All data synced just now.",
  },
  reconnecting: {
    label: "Reconnecting",
    tone: "warn",
    defaultDetail: "Re-establishing the live connection…",
  },
  stale: {
    label: "Stale data",
    tone: "warn",
    defaultDetail:
      "Connection dropped — last synced recently. Figures may be out of date.",
  },
  blocked: {
    label: "Read-only",
    tone: "error",
    defaultDetail: "You have viewer access — approvals and edits are disabled for your role.",
  },
};

export function RealtimeStatusStrip({ status, detail, onRefresh }: Props) {
  const { label, tone, defaultDetail } = STATUS_COPY[status];

  return (
    <div className={styles.statusStrip} data-tone={tone}>
      <div className={styles.statusLeft}>
        <span className={styles.statusPill}>
          <span className={styles.statusDot} aria-hidden />
          <span className={styles.statusLabel}>{label}</span>
        </span>
        <span className={styles.statusDetail}>{detail ?? defaultDetail}</span>
      </div>
      {(status === "stale" || status === "reconnecting") && (
        <button
          type="button"
          className={styles.statusAction}
          onClick={onRefresh ?? (() => window.location.reload())}
        >
          <RefreshCw className={styles.statusActionIcon} aria-hidden />
          Refresh
        </button>
      )}
      {status === "blocked" && (
        <Link href="/login" className={styles.statusActionPrimary}>
          Request access
        </Link>
      )}
    </div>
  );
}
