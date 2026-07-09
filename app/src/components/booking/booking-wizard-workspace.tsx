"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ErrorState } from "@/components/ui/error-state";
import { StatusChip } from "@/components/ui/status-chip";
import { BOOKING_STATUS_DOT, bookingStatusLabel } from "@/lib/booking/booking-status-tokens";
import { isIsoDate, isRateQuoted, isValidDateRange } from "@/lib/booking/validation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { TalentResult } from "@/lib/talent/types";

import { useBookingWizardContext } from "./booking-wizard-context";
import styles from "./booking-wizard-workspace.module.css";

type Props = {
  talent: TalentResult | null;
  talentId: string;
  orgId: string | null;
  fetchError: string | null;
};

type Availability = { isAvailable: boolean; reason: string };
type Outcome = "idle" | "created" | "rejected";

const STEPS: { label: string; gate?: boolean }[] = [
  { label: "Dates & rate" },
  { label: "AI draft", gate: true },
  { label: "Review & send", gate: true },
];

function HITLGate({ message }: { message: string }) {
  return (
    <div className={styles.hitlGate}>
      ⚠ <strong>HITL Gate</strong> — {message}
    </div>
  );
}

function StepRail({ current, talent }: { current: number; talent: TalentResult }) {
  return (
    <nav className={styles.rail} aria-label="Wizard steps">
      <Link href="/app/matching" className={styles.railBack}>
        ← Matching
      </Link>
      <div className={styles.railTalent}>
        <p className={styles.railTalentName}>{talent.display_name}</p>
        {talent.rate_tier ? <p className={styles.railTalentRate}>{talent.rate_tier} rate tier</p> : null}
      </div>
      <ol className={styles.railList}>
        {STEPS.map((s, i) => {
          const stateName = i < current ? "completed" : i === current ? "active" : "future";
          return (
            <li
              key={s.label}
              className={styles.railStep}
              data-state={stateName}
              aria-current={i === current ? "step" : undefined}
            >
              <span className={styles.railMarker} aria-hidden>
                {i < current ? "✓" : i + 1}
              </span>
              <span className={styles.railLabel}>{s.label}</span>
              {s.gate ? <span className={styles.railGate} aria-hidden title="Approval gate" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function BookingWizardWorkspace({ talent, talentId, orgId, fetchError }: Props) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [rateQuotedInput, setRateQuotedInput] = useState("");
  const [shootId, setShootId] = useState("");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [suggestedRate, setSuggestedRate] = useState<number | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>("idle");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingExpiresAt, setBookingExpiresAt] = useState<string | null>(null);

  useBookingWizardContext({
    step,
    talentName: talent?.display_name ?? "",
    talentId,
    dateStart,
    dateEnd,
    rateQuoted: rateQuotedInput,
    messageDraft,
    outcome,
  });

  // Live availability check (UX feedback only — the DB EXCLUDE constraint is
  // the real guarantee at request time). Native <input type="date"> only
  // fires onChange on a completed selection, so no debounce is needed here.
  useEffect(() => {
    if (!isIsoDate(dateStart) || !isIsoDate(dateEnd) || !isValidDateRange(dateStart, dateEnd)) {
      setAvailability(null);
      return;
    }
    let cancelled = false;
    setAvailabilityLoading(true);
    const supabase = createSupabaseBrowserClient();

    async function checkAvailability() {
      const { data, error: rpcError } = await supabase.rpc("check_talent_availability", {
        p_talent_profile_id: talentId,
        p_date_start: dateStart,
        p_date_end: dateEnd,
      });
      if (cancelled) return;
      if (rpcError) {
        setAvailability(null);
        setAvailabilityLoading(false);
        return;
      }
      const row = data as { is_available?: boolean } | null;
      const isAvailable = Boolean(row?.is_available);
      setAvailability({
        isAvailable,
        reason: isAvailable
          ? "No blocked, tentative, or booked availability conflicts for these dates."
          : "Talent has blocked, tentative, or booked availability overlapping these dates.",
      });
      setAvailabilityLoading(false);
    }

    checkAvailability();
    return () => {
      cancelled = true;
    };
  }, [dateStart, dateEnd, talentId]);

  if (fetchError) {
    return (
      <div className={styles.stateRoot}>
        <ErrorState message={fetchError} onRetry={() => router.refresh()} />
      </div>
    );
  }

  if (!talent || !orgId) {
    return (
      <div className={styles.stateRoot}>
        <ErrorState message="Unable to load this talent profile." onRetry={() => router.refresh()} />
      </div>
    );
  }

  const canContinueStep0 = isIsoDate(dateStart) && isIsoDate(dateEnd) && isValidDateRange(dateStart, dateEnd);

  async function handleGenerateDraft() {
    setDraftLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/quote-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: talent!.display_name,
          dateStart,
          dateEnd,
          rateTier: talent!.rate_tier ?? undefined,
          rateQuoted: rateQuotedInput.trim() && isRateQuoted(Number(rateQuotedInput)) ? Number(rateQuotedInput) : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? "Failed to draft a quote.");
      }
      const data = await res.json();
      setSuggestedRate(data.suggestedRate ?? null);
      setMessageDraft(data.messageDraft ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to draft a quote.");
    } finally {
      setDraftLoading(false);
    }
  }

  function handleReject() {
    setOutcome("rejected");
  }

  function handleStartOver() {
    setOutcome("idle");
    setStep(0);
  }

  async function handleApprove() {
    setSendLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_org_id: orgId,
          talent_profile_id: talentId,
          shoot_id: shootId.trim() || null,
          date_start: dateStart,
          date_end: dateEnd,
          rate_quoted: rateQuotedInput.trim() ? Number(rateQuotedInput) : suggestedRate ?? undefined,
          message: messageDraft.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? "Failed to send the booking request.");
      }
      const data = await res.json();
      setBookingId(data.booking_id ?? null);
      setBookingExpiresAt(data.expires_at ?? null);
      setOutcome("created");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send the booking request.");
    } finally {
      setSendLoading(false);
    }
  }

  const rateDisplay = rateQuotedInput.trim()
    ? `$${Number(rateQuotedInput).toLocaleString()}`
    : suggestedRate != null
      ? `$${suggestedRate.toLocaleString()} (suggested)`
      : "—";

  return (
    <div className={styles.page}>
      <div className={styles.workspace}>
        <StepRail current={step} talent={talent} />

        <div className={styles.content}>
          {outcome === "created" ? (
            <div className={styles.section}>
              <StatusChip dot={BOOKING_STATUS_DOT.requested} label={bookingStatusLabel("requested")} />
              <h1 className={styles.title}>Booking requested</h1>
              <p className={styles.body}>
                Your request to book {talent.display_name} for {dateStart}–{dateEnd} has been sent.
              </p>
              <dl className={styles.summaryList}>
                <div>
                  <dt>Booking ID</dt>
                  <dd className={styles.summaryMono}>{bookingId}</dd>
                </div>
                {bookingExpiresAt ? (
                  <div>
                    <dt>Expires</dt>
                    <dd>{new Date(bookingExpiresAt).toLocaleString()}</dd>
                  </div>
                ) : null}
              </dl>
              <p className={styles.hint}>
                Booking status tracking ships separately (IPI-411). The talent will need to confirm.
              </p>
              <div className={styles.footer}>
                <Link href="/app/matching" className={styles.btnPrimary}>
                  ← Back to talent search
                </Link>
              </div>
            </div>
          ) : outcome === "rejected" ? (
            <div className={styles.section}>
              <h1 className={styles.title}>Request not sent</h1>
              <p className={styles.body}>You chose not to send this booking request. Nothing was saved.</p>
              <div className={styles.footer}>
                <button type="button" onClick={handleStartOver} className={styles.btnGhost}>
                  Start over
                </button>
                <Link href="/app/matching" className={styles.btnPrimary}>
                  ← Back to talent search
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className={styles.stepMeta}>
                Step {step + 1} of {STEPS.length} · {STEPS[step].label}
              </p>

              {error ? (
                <div className={styles.errorBanner} role="alert">
                  {error}
                </div>
              ) : null}

              {step === 0 && (
                <div className={styles.section}>
                  <h1 className={styles.title}>Dates & rate</h1>
                  <label className={styles.field}>
                    <span>Start date</span>
                    <input
                      type="date"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      aria-label="Start date"
                    />
                  </label>
                  <label className={styles.field}>
                    <span>End date</span>
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      aria-label="End date"
                    />
                  </label>
                  {availabilityLoading ? (
                    <p className={styles.hint}>Checking availability…</p>
                  ) : availability ? (
                    <p className={availability.isAvailable ? styles.availOk : styles.availWarn}>
                      {availability.isAvailable ? "✓ Available" : `⚠ ${availability.reason}`}
                    </p>
                  ) : null}
                  <label className={styles.field}>
                    <span>Rate override (optional)</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={rateQuotedInput}
                      onChange={(e) => setRateQuotedInput(e.target.value)}
                      placeholder="Leave blank for the AI-suggested rate"
                    />
                  </label>
                  {/* ponytail: plain optional id field, not a real shoot picker —
                      no "list shoots for org" query exists yet in app/src/lib/shoot/.
                      Upgrade path: wire a real shoot search once that's needed. */}
                  <label className={styles.field}>
                    <span>Link to a shoot (optional)</span>
                    <input
                      type="text"
                      value={shootId}
                      onChange={(e) => setShootId(e.target.value)}
                      placeholder="Shoot ID"
                    />
                  </label>
                  <div className={styles.footer}>
                    <Link href="/app/matching" className={styles.btnGhost}>
                      Cancel
                    </Link>
                    <button
                      type="button"
                      disabled={!canContinueStep0}
                      onClick={() => setStep(1)}
                      className={styles.btnPrimary}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className={styles.section}>
                  <h1 className={styles.title}>AI draft</h1>
                  <HITLGate message="Review and edit the AI-drafted quote before sending." />
                  <div>
                    <button
                      type="button"
                      onClick={handleGenerateDraft}
                      disabled={draftLoading}
                      className={styles.btnPrimary}
                    >
                      {draftLoading ? "Drafting…" : messageDraft ? "Regenerate draft" : "Generate draft"}
                    </button>
                  </div>
                  {messageDraft ? (
                    <>
                      <p className={styles.body}>
                        Suggested rate: {suggestedRate != null ? `$${suggestedRate.toLocaleString()}` : "—"}
                      </p>
                      <label className={styles.field}>
                        <span>Message draft</span>
                        <textarea
                          value={messageDraft}
                          onChange={(e) => setMessageDraft(e.target.value)}
                          rows={6}
                          aria-label="Message draft"
                        />
                      </label>
                    </>
                  ) : null}
                  <div className={styles.footer}>
                    <button type="button" onClick={() => setStep(0)} className={styles.btnGhost}>
                      ← Back
                    </button>
                    <button
                      type="button"
                      disabled={!messageDraft.trim()}
                      onClick={() => setStep(2)}
                      className={styles.btnPrimary}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className={styles.section}>
                  <h1 className={styles.title}>Review & send</h1>
                  <HITLGate message="This creates a real booking request — the talent will be notified." />
                  <dl className={styles.summaryList}>
                    <div>
                      <dt>Talent</dt>
                      <dd>{talent.display_name}</dd>
                    </div>
                    <div>
                      <dt>Dates</dt>
                      <dd>
                        {dateStart} – {dateEnd}
                      </dd>
                    </div>
                    <div>
                      <dt>Rate</dt>
                      <dd>{rateDisplay}</dd>
                    </div>
                    {shootId.trim() ? (
                      <div>
                        <dt>Shoot</dt>
                        <dd className={styles.summaryMono}>{shootId.trim()}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <p className={styles.messagePreview}>{messageDraft}</p>
                  <div className={styles.footer}>
                    <button type="button" onClick={() => setStep(0)} className={styles.btnGhost}>
                      ← Edit
                    </button>
                    <button type="button" onClick={handleReject} className={styles.btnReject}>
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={sendLoading}
                      onClick={handleApprove}
                      className={styles.btnApprove}
                    >
                      {sendLoading ? "Sending…" : "✓ Send request"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
