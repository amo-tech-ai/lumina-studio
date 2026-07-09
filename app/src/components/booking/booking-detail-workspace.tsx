"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusChip } from "@/components/ui/status-chip";
import {
  allowedActions,
  BOOKING_STEPPER_STATUSES,
  stepperIndex,
  type BookingActionKind,
} from "@/lib/booking/booking-fsm";
import { BOOKING_STATUS_DOT, bookingStatusLabel } from "@/lib/booking/booking-status-tokens";
import type { BookingStatus } from "@/lib/booking/validation";
import { formatMoney } from "@/lib/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { useBookingDetailContext } from "./booking-detail-context";
import styles from "./booking-detail-workspace.module.css";

type TabId = "overview" | "talent" | "availability" | "approvals" | "activity";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "talent", label: "Talent" },
  { id: "availability", label: "Availability" },
  { id: "approvals", label: "Approvals" },
  { id: "activity", label: "Activity" },
];

const ACTION_LABEL: Record<BookingActionKind, string> = {
  confirm: "Confirm booking",
  approve: "Approve",
  decline: "Decline",
  cancel: "Cancel booking",
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}
function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}
function num(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}
function bool(value: unknown): boolean {
  return value === true;
}

function formatDateRange(start: string, end: string): string {
  if (!start || !end) return "—";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "—";
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

type Props = {
  bookingId: string;
  booking: Record<string, unknown> | null;
  talent: unknown;
  history: unknown[];
  viewerRole: string | null;
  fetchError: string | null;
};

export function BookingDetailWorkspace({ bookingId, booking, talent, history, viewerRole, fetchError }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [availability, setAvailability] = useState<{ is_available: boolean } | null>(null);
  const [availabilityError, setAvailabilityError] = useState(false);

  const status = (booking ? str(booking.status) : "") as BookingStatus;
  const dateStart = booking ? str(booking.date_start) : "";
  const dateEnd = booking ? str(booking.date_end) : "";
  const rateQuoted = booking ? num(booking.rate_quoted) : null;
  const version = booking ? (num(booking.version) ?? 1) : 1;
  const expiresAt = booking ? str(booking.expires_at) || null : null;
  const message = booking ? str(booking.message) || null : null;
  const cancellationReason = booking ? str(booking.cancellation_reason) || null : null;
  const talentProfileId = booking ? str(booking.talent_profile_id) : "";

  const talentRow = record(talent);
  const talentName = talentRow ? str(talentRow.display_name, "Talent") : "Talent";

  const actions = booking && viewerRole ? allowedActions(status, viewerRole) : [];

  useBookingDetailContext({ status, talentName, dateStart, dateEnd, rateQuoted, viewerRole, actions });

  useEffect(() => {
    if (!talentProfileId || !dateStart || !dateEnd) return;
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    supabase
      .rpc("check_talent_availability", {
        p_talent_profile_id: talentProfileId,
        p_date_start: dateStart,
        p_date_end: dateEnd,
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setAvailabilityError(true);
          return;
        }
        const row = record(data);
        setAvailability({ is_available: row ? bool(row.is_available) : true });
      });
    return () => {
      cancelled = true;
    };
  }, [talentProfileId, dateStart, dateEnd]);

  if (fetchError || !booking) {
    return (
      <div className={styles.page}>
        <ErrorState message={fetchError ?? "This booking could not be loaded."} onRetry={() => router.refresh()} />
      </div>
    );
  }

  async function runTransition(body: Record<string, unknown>): Promise<boolean> {
    setActionPending(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setActionError(json?.error?.message ?? "That didn't go through. Try again.");
        return false;
      }
      startTransition(() => router.refresh());
      return true;
    } finally {
      setActionPending(false);
    }
  }

  async function runApprove(): Promise<boolean> {
    setActionPending(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/approve`, { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setActionError(json?.error?.message ?? "That didn't go through. Try again.");
        return false;
      }
      startTransition(() => router.refresh());
      return true;
    } finally {
      setActionPending(false);
    }
  }

  function handleAction(kind: BookingActionKind) {
    if (actionPending) return;
    if (kind === "cancel") {
      setCancelOpen(true);
      return;
    }
    if (kind === "confirm") {
      void runApprove();
      return;
    }
    void runTransition({ expected_version: version, to_status: kind === "approve" ? "approved" : "declined" });
  }

  async function submitCancel() {
    if (!cancelReason.trim() || actionPending) return;
    const ok = await runTransition({
      expected_version: version,
      to_status: "cancelled",
      cancellation_reason: cancelReason.trim(),
    });
    if (ok) {
      setCancelOpen(false);
      setCancelReason("");
    }
  }

  const stepIdx = stepperIndex(status);
  const isTerminal = status === "declined" || status === "expired" || status === "cancelled";

  function AvailabilityNote() {
    if (availabilityError) {
      return <p className={styles.terminalNote}>Couldn&apos;t check live availability right now.</p>;
    }
    if (availability == null) {
      return <p className={styles.terminalNote}>Checking availability…</p>;
    }
    return (
      <p className={styles.terminalNote}>
        {talentName} is{" "}
        <b className={availability.is_available ? styles.available : styles.unavailable}>
          {availability.is_available ? "available" : "not available"}
        </b>{" "}
        for {formatDateRange(dateStart, dateEnd)}. Confirming checks for overlapping bookings automatically.
      </p>
    );
  }

  function ActionsCard() {
    return (
      <div className={styles.card}>
        <div className={styles.cardTitle}>Operator actions</div>
        <p className={styles.cardHint}>
          Confirming is <b>operator-only</b>. Actions here call the real transition API — there is no AI in this
          loop.
        </p>
        {actionError ? <p className={styles.actionError}>{actionError}</p> : null}
        {isTerminal ? (
          <p className={styles.terminalNote}>
            This booking is {status}
            {status === "cancelled" && cancellationReason ? `: ${cancellationReason}` : "."}
          </p>
        ) : actions.length ? (
          <div className={styles.actionRow}>
            {actions.map((kind) => (
              <button
                key={kind}
                type="button"
                disabled={actionPending}
                onClick={() => handleAction(kind)}
                className={kind === "cancel" || kind === "decline" ? styles.actionBtnGhost : styles.actionBtnPrimary}
              >
                {ACTION_LABEL[kind]}
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.terminalNote}>No actions available for your role at this status.</p>
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.breadcrumb}>
          <Link href="/app/matching" className={styles.breadcrumbLink}>
            Matching
          </Link>
          <span>/</span>
          <span className={styles.breadcrumbCurrent}>{talentName}</span>
        </div>

        <div className={styles.hero}>
          <div className={styles.heroPhoto}>
            <span className={styles.heroScrim} aria-hidden />
            <div className={styles.heroPhotoContent}>
              <span className={styles.heroBadgeRow}>
                <StatusChip
                  dot={BOOKING_STATUS_DOT[status] ?? "var(--color-text-muted)"}
                  label={bookingStatusLabel(status)}
                  onImage
                />
              </span>
              <h1 className={styles.title}>{talentName}</h1>
              <div className={styles.heroMeta}>
                <span>{formatDateRange(dateStart, dateEnd)}</span>
                {rateQuoted != null ? (
                  <>
                    <span className={styles.dot}>·</span>
                    <span>{formatMoney(rateQuoted, "USD")}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className={styles.tabRow} role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? styles.tabActive : styles.tab}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.body}>
          {activeTab === "overview" ? (
            <div className={styles.tabPanel}>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Booking status</div>
                <div className={styles.stepper}>
                  {BOOKING_STEPPER_STATUSES.map((s, i) => (
                    <div key={s} className={styles.stepperItem}>
                      <span
                        className={
                          isTerminal
                            ? styles.stepperDotTerminal
                            : i < stepIdx
                              ? styles.stepperDotDone
                              : i === stepIdx
                                ? styles.stepperDotActive
                                : styles.stepperDot
                        }
                      />
                      <span className={i === stepIdx && !isTerminal ? styles.stepperLabelActive : styles.stepperLabel}>
                        {bookingStatusLabel(s)}
                      </span>
                      {i < BOOKING_STEPPER_STATUSES.length - 1 ? <span className={styles.stepperLine} /> : null}
                    </div>
                  ))}
                </div>
              </div>

              {expiresAt && !isTerminal ? (
                <div className={styles.expiryBanner}>Request expires {formatDateTime(expiresAt)}.</div>
              ) : null}

              <div className={styles.overviewGrid}>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Rate &amp; terms</div>
                  <div className={styles.rateRow}>
                    <span>Quoted rate</span>
                    <span className={styles.mono}>{rateQuoted != null ? formatMoney(rateQuoted, "USD") : "—"}</span>
                  </div>
                  <div className={styles.rateRow}>
                    <span>Dates</span>
                    <span className={styles.mono}>{formatDateRange(dateStart, dateEnd)}</span>
                  </div>
                  {message ? (
                    <div className={styles.messageBox}>
                      <div className={styles.messageLabel}>Message</div>
                      <p className={styles.messageText}>{message}</p>
                    </div>
                  ) : null}
                </div>
                <ActionsCard />
              </div>

              <div className={styles.card}>
                <AvailabilityNote />
              </div>
            </div>
          ) : null}

          {activeTab === "talent" ? (
            <div className={styles.tabPanel}>
              <div className={styles.talentCard}>
                <div className={styles.talentPhoto} aria-hidden />
                <div className={styles.talentInfo}>
                  <div className={styles.talentName}>{talentName}</div>
                  <div className={styles.talentMeta}>
                    {talentRow ? str(talentRow.verification_status, "unverified") : "unverified"}
                    {talentRow && bool(talentRow.is_agency_represented) ? " · Agency-represented" : " · Independent"}
                    {talentRow && bool(talentRow.travel_ready) ? " · Travel-ready" : ""}
                  </div>
                  {talentProfileId ? (
                    <Link href={`/app/matching/talent/${talentProfileId}`} className={styles.profileLink}>
                      View full profile
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "availability" ? (
            <div className={styles.tabPanel}>
              <div className={styles.legend}>
                <span>
                  <span className={styles.legendDotAvailable} /> Available
                </span>
                <span>
                  <span className={styles.legendDotBooked} /> Booked / blocked
                </span>
              </div>
              <div className={styles.card}>
                <AvailabilityNote />
              </div>
            </div>
          ) : null}

          {activeTab === "approvals" ? (
            <div className={styles.tabPanel}>
              <ActionsCard />
            </div>
          ) : null}

          {activeTab === "activity" ? (
            <div className={styles.tabPanel}>
              {history.length === 0 ? (
                <EmptyState heading="No activity yet" body="Status changes and messages will appear here." />
              ) : (
                <div className={styles.timeline}>
                  {history.map((entry, i) => {
                    const row = record(entry);
                    if (!row) return null;
                    const eventType = str(row.event_type);
                    const from = str(row.from_status);
                    const to = str(row.to_status);
                    const msg = str(row.message);
                    const createdAt = str(row.created_at);
                    const text =
                      eventType === "message"
                        ? msg || "Message sent"
                        : eventType === "system_expired"
                          ? "Request expired automatically"
                          : from && to
                            ? `Status changed: ${bookingStatusLabel(from)} → ${bookingStatusLabel(to)}`
                            : to
                              ? `Status set to ${bookingStatusLabel(to)}`
                              : "Update";
                    return (
                      <div key={str(row.id) || i} className={styles.timelineItem}>
                        <span className={styles.timelineDot} aria-hidden />
                        <div>
                          <div className={styles.timelineText}>{text}</div>
                          <div className={styles.timelineTime}>{createdAt ? formatDateTime(createdAt) : "—"}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {cancelOpen ? (
        <div role="dialog" aria-modal="true" aria-label="Cancel booking" className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Cancel booking</h2>
            <p className={styles.cardHint}>This can&apos;t be undone. Give a reason for the record.</p>
            {actionError ? <p className={styles.actionError}>{actionError}</p> : null}
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Why is this booking being cancelled?"
              className={styles.modalTextarea}
              aria-label="Cancellation reason"
            />
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.actionBtnGhost}
                disabled={actionPending}
                onClick={() => {
                  setCancelOpen(false);
                  setCancelReason("");
                  setActionError(null);
                }}
              >
                Back
              </button>
              <button
                type="button"
                className={styles.actionBtnDanger}
                disabled={actionPending || !cancelReason.trim()}
                onClick={() => void submitCancel()}
              >
                Confirm cancellation
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
