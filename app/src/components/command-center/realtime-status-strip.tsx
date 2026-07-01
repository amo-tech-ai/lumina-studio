"use client";

import Link from "next/link";
import { RefreshCw, ShieldAlert, Wifi, WifiOff } from "lucide-react";

import type { RealtimeStatus } from "@/lib/command-center/types";

import styles from "./command-center.module.css";

type Props = {
  status: RealtimeStatus;
  detail?: string;
  onRefresh?: () => void;
};

const STATUS_COPY: Record<
  RealtimeStatus,
  { label: string; icon: typeof Wifi; tone: string; defaultDetail: string }
> = {
  live: {
    label: "Live",
    icon: Wifi,
    tone: "live",
    defaultDetail: "All data synced just now.",
  },
  reconnecting: {
    label: "Reconnecting",
    icon: WifiOff,
    tone: "warn",
    defaultDetail: "Re-establishing the live connection…",
  },
  stale: {
    label: "Stale data",
    icon: RefreshCw,
    tone: "warn",
    defaultDetail: "Figures may be out of date — refresh to reload.",
  },
  blocked: {
    label: "Read-only",
    icon: ShieldAlert,
    tone: "error",
    defaultDetail: "Approvals and edits are disabled for your role.",
  },
};

export function RealtimeStatusStrip({ status, detail, onRefresh }: Props) {
  const { label, icon: Icon, tone, defaultDetail } = STATUS_COPY[status];

  return (
    <div className={styles.statusStrip} data-tone={tone}>
      <div className={styles.statusLeft}>
        <span className={styles.statusDot} aria-hidden />
        <Icon className={styles.statusIcon} aria-hidden />
        <span className={styles.statusLabel}>{label}</span>
        <span className={styles.statusDetail}>{detail ?? defaultDetail}</span>
      </div>
      {(status === "stale" || status === "reconnecting") && (
        <button
          type="button"
          className={styles.statusAction}
          onClick={onRefresh ?? (() => window.location.reload())}
        >
          Refresh
        </button>
      )}
      {status === "blocked" && (
        <Link href="/login" className={styles.statusAction}>
          Request access
        </Link>
      )}
    </div>
  );
}
