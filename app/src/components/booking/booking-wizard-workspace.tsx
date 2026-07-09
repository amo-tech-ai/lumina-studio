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
type ShootChoice = "standalone" | "existing";
type RateFieldStatus = "pending" | "approved";

// Shell mirrors Shoot Wizard.v2.image-first.dc.html (topbar + horizontal step
// rail + centered content) — reused as an authoring shortcut per
// docs/models/02-engineering-reference.md; the booking flow itself is a
// standalone build (5 steps below), not a literal isBooking clone of that file.
const STEPS = [
  { label: "Talent & shoot" },
  { label: "Dates" },
  { label: "Rate" },
  { label: "Message" },
  { label: "Review & send" },
] as const;
const LAST_STEP = STEPS.length - 1;

export function BookingWizardWorkspace({ talent, talentId, orgId, fetchError }: Props) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [shootChoice, setShootChoice] = useState<ShootChoice>("standalone");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [rateQuotedInput, setRateQuotedInput] = useState("");
  const [rateFieldStatus, setRateFieldStatus] = useState<RateFieldStatus>("pending");
  const [rateEditing, setRateEditing] = useState(false);
  const [rateWhyOpen, setRateWhyOpen] = useState(false);
  const [suggestedRate, setSuggestedRate] = useState<number | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftFetched, setDraftFetched] = useState(false);
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

  // Live availability check — UX feedback only, the DB EXCLUDE constraint is
  // the real guarantee at request time.
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

  const canFetchDraft = Boolean(talent) && isIsoDate(dateStart) && isIsoDate(dateEnd) && isValidDateRange(dateStart, dateEnd);

  // Auto-drafts once the operator reaches the Rate step (index 2) — matches
  // the DC flow's "already drafted by the time you arrive" pattern rather
  // than requiring a manual generate click. Regenerate stays available below.
  useEffect(() => {
    if (step !== 2 || draftFetched || !canFetchDraft) return;
    void fetchDraft();
  }, [step, draftFetched, canFetchDraft]);

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

  async function fetchDraft() {
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
      // Mark the attempt done on failure too — otherwise draftFetched stays
      // false forever and the auto-draft effect below retries on every
      // render (draftLoading flips false → re-runs → fetches again → loop).
      setDraftFetched(true);
      setDraftLoading(false);
    }
  }

  function handleApproveRate() {
    setRateFieldStatus("approved");
    setRateWhyOpen(false);
  }

  function handleSaveRateEdit() {
    setRateFieldStatus("approved");
    setRateEditing(false);
    setRateWhyOpen(false);
  }

  function handleReject() {
    setOutcome("rejected");
  }

  function handleStartOver() {
    setOutcome("idle");
    setStep(0);
  }

  async function handleSend() {
    setSendLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_org_id: orgId,
          talent_profile_id: talentId,
          shoot_id: null, // real shoot picker not wired yet — see talent-shoot step comment
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

  const canAdvance: Record<number, boolean> = {
    0: true,
    1: isIsoDate(dateStart) && isIsoDate(dateEnd) && isValidDateRange(dateStart, dateEnd),
    2: rateFieldStatus === "approved",
    3: messageDraft.trim().length > 0,
    4: !sendLoading,
  };

  function handleBack() {
    if (step === 0) return;
    setStep(step - 1);
  }

  function handleNext() {
    if (step === LAST_STEP) {
      void handleSend();
      return;
    }
    setStep(step + 1);
  }

  const rateDisplay = rateQuotedInput.trim()
    ? `$${Number(rateQuotedInput).toLocaleString()}`
    : suggestedRate != null
      ? `$${suggestedRate.toLocaleString()}`
      : "—";

  if (outcome === "created") {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <div className={styles.contentInner}>
            <StatusChip dot={BOOKING_STATUS_DOT.requested} label={bookingStatusLabel("requested")} />
            <h1 className={styles.title}>Booking requested</h1>
            <p className={styles.subtitle}>
              Your request to book {talent.display_name} for {dateStart}–{dateEnd} has been sent.
            </p>
            <div className={styles.summaryCard}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryRowLabel}>Booking ID</span>
                <span className={`${styles.summaryRowValue} ${styles.summaryRowMono}`}>{bookingId}</span>
              </div>
              {bookingExpiresAt ? (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Expires</span>
                  <span className={styles.summaryRowValue}>{new Date(bookingExpiresAt).toLocaleString()}</span>
                </div>
              ) : null}
            </div>
            <p className={styles.hint}>
              Booking status tracking ships separately (IPI-411). The talent will need to confirm.
            </p>
            <div className={styles.footer}>
              <Link href="/app/matching" className={styles.btnPrimary}>
                ← Back to talent search
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (outcome === "rejected") {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <div className={styles.contentInner}>
            <h1 className={styles.title}>Request not sent</h1>
            <p className={styles.subtitle}>You chose not to send this booking request. Nothing was saved.</p>
            <div className={styles.footer}>
              <button type="button" onClick={handleStartOver} className={styles.btnGhost}>
                Start over
              </button>
              <Link href="/app/matching" className={styles.btnPrimary}>
                ← Back to talent search
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const nextLabel = step === LAST_STEP ? (sendLoading ? "Sending…" : "Send booking request") : "Continue";

  return (
    <div className={styles.page}>
      {/* Touch targets here are 44px (2.75rem via CSS min-height), not the DC
          prototype's literal 34-38px — accessibility requirement (SCR-21 AC:
          "Touch targets >=44px") wins over pixel-exact parity; flagged, not
          silently matched. */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <Link href="/app/matching" className={styles.backBtn}>
            ← Matching
          </Link>
          <span className={styles.divider} aria-hidden />
          <span className={styles.talentAvatar} aria-hidden />
          <div className={styles.titleBlock}>
            <div className={styles.titleName}>{talent.display_name}</div>
            <div className={styles.titleMeta}>
              Step {step + 1} of {STEPS.length} · {STEPS[step].label}
            </div>
          </div>
        </div>
        <div className={styles.topbarRight}>
          {step === LAST_STEP ? (
            <button type="button" onClick={handleReject} className={styles.cancelLink}>
              Don&apos;t send — cancel
            </button>
          ) : null}
          {step > 0 ? (
            <button type="button" onClick={handleBack} className={styles.backAction}>
              Back
            </button>
          ) : null}
          <button type="button" disabled={!canAdvance[step]} onClick={handleNext} className={styles.nextAction}>
            {nextLabel}
          </button>
        </div>
      </div>

      <nav className={styles.stepRail} aria-label="Wizard steps">
        {STEPS.map((s, i) => {
          const stateName = i < step ? "completed" : i === step ? "active" : "future";
          return (
            <span key={s.label} style={{ display: "contents" }}>
              <button
                type="button"
                className={styles.stepRailItem}
                data-state={stateName}
                aria-current={i === step ? "step" : undefined}
                onClick={() => (i < step ? setStep(i) : undefined)}
              >
                <span className={styles.stepRailMarker} aria-hidden>
                  {i < step ? "✓" : i + 1}
                </span>
                <span className={styles.stepRailLabel}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 ? <span className={styles.stepRailConnector} aria-hidden /> : null}
            </span>
          );
        })}
      </nav>

      <div className={styles.content}>
        <div className={styles.contentInner}>
          {error ? (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          ) : null}

          {step === 0 && (
            <>
              <div className={styles.stepHeading}>
                <h1 className={styles.title}>Talent &amp; shoot</h1>
                <p className={styles.subtitle}>Confirm the talent and link this booking to a shoot.</p>
              </div>
              <div className={styles.talentCard}>
                <span className={styles.talentCardAvatar} aria-hidden />
                <div>
                  <div className={styles.talentCardName}>{talent.display_name}</div>
                  <div className={styles.talentCardMeta}>
                    {talent.rate_tier ? `${talent.rate_tier} rate tier` : "Rate tier not set"}
                  </div>
                </div>
              </div>
              <div className={styles.choiceLabel}>Link to a shoot</div>
              <button
                type="button"
                onClick={() => setShootChoice("standalone")}
                data-selected={shootChoice === "standalone"}
                className={styles.choiceCard}
              >
                <span className={styles.choiceIcon} aria-hidden>
                  +
                </span>
                <span>
                  <span className={styles.choiceTitle}>Standalone booking</span>
                  <span className={styles.choiceSub}>Not tied to a shoot yet</span>
                </span>
              </button>
              {/* ponytail: no "list shoots for org" query exists yet — a real
                  picker here is a separate follow-up (new RPC/query), not
                  bundled into this layout PR. Card shown per DC for parity,
                  disabled + labeled honestly rather than faking shoot data. */}
              <button type="button" disabled data-selected="false" title="Coming soon" className={styles.choiceCard}>
                <span className={styles.choiceIcon} aria-hidden>
                  ▤
                </span>
                <span>
                  <span className={styles.choiceTitle}>Link to an existing shoot</span>
                  <span className={styles.choiceSub}>Coming soon</span>
                </span>
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <div className={styles.stepHeading}>
                <h1 className={styles.title}>Dates</h1>
                <p className={styles.subtitle}>When is {talent.display_name} needed?</p>
              </div>
              <label className={styles.field}>
                <span>Start date</span>
                <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} aria-label="Start date" />
              </label>
              <label className={styles.field}>
                <span>End date</span>
                <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} aria-label="End date" />
              </label>
              {availabilityLoading ? (
                <p className={styles.hint}>Checking availability…</p>
              ) : availability ? (
                <div className={styles.availabilityBanner}>
                  <span className={styles.availDot} data-warn={!availability.isAvailable} aria-hidden />
                  <span>
                    {talent.display_name} is{" "}
                    <strong>{availability.isAvailable ? "available" : "not available"}</strong> on these dates.{" "}
                    {!availability.isAvailable && availability.reason}
                  </span>
                </div>
              ) : null}
            </>
          )}

          {step === 2 && (
            <>
              <div className={styles.stepHeading}>
                <h1 className={styles.title}>Rate</h1>
                <p className={styles.subtitle}>
                  I drafted a rate from {talent.display_name}&apos;s rate tier. Review before sending.
                </p>
              </div>
              {draftLoading && !draftFetched ? (
                <p className={styles.hint}>Drafting a rate…</p>
              ) : (
                <div className={styles.aiField} data-status={rateFieldStatus}>
                  <div className={styles.aiFieldHead}>
                    <div>
                      <div className={styles.aiFieldLabel}>Day rate</div>
                      {rateEditing ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          autoFocus
                          value={rateQuotedInput}
                          onChange={(e) => setRateQuotedInput(e.target.value)}
                          className={styles.rateInput}
                          aria-label="Day rate override"
                        />
                      ) : (
                        <div className={styles.aiFieldValue}>{rateDisplay}</div>
                      )}
                    </div>
                    <span className={styles.aiFieldChip} data-status={rateFieldStatus}>
                      {rateFieldStatus === "approved" ? "✓ Approved" : "AI draft"}
                    </span>
                  </div>
                  <div className={styles.aiFieldActions}>
                    {rateEditing ? (
                      <>
                        <button type="button" onClick={handleSaveRateEdit} className={styles.aiFieldBtn}>
                          Save
                        </button>
                        <button type="button" onClick={() => setRateEditing(false)} className={styles.aiFieldBtnGhost}>
                          Cancel
                        </button>
                      </>
                    ) : rateFieldStatus === "pending" ? (
                      <>
                        <button type="button" onClick={handleApproveRate} className={styles.aiFieldBtn}>
                          Approve
                        </button>
                        <button type="button" onClick={() => setRateEditing(true)} className={styles.aiFieldBtnGhost}>
                          Edit
                        </button>
                        <button type="button" onClick={() => setRateWhyOpen((v) => !v)} className={styles.aiFieldWhyBtn}>
                          Why
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setRateEditing(true)} className={styles.aiFieldBtnGhost}>
                        Edit
                      </button>
                    )}
                  </div>
                  {rateWhyOpen ? (
                    <div className={styles.aiFieldWhy}>
                      {talent.rate_tier
                        ? `Suggested from the ${talent.rate_tier} rate tier — no manual override was set.`
                        : "No rate tier on file for this talent — suggest an amount manually."}
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <div className={styles.stepHeading}>
                <h1 className={styles.title}>Message</h1>
                <p className={styles.subtitle}>A short note to {talent.display_name}. Edit freely.</p>
              </div>
              <label className={styles.field}>
                <span>Message</span>
                <textarea
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  rows={6}
                  aria-label="Message draft"
                />
              </label>
            </>
          )}

          {step === 4 && (
            <>
              <div className={styles.stepHeading}>
                <h1 className={styles.title}>Review &amp; send</h1>
                <p className={styles.subtitle}>
                  This sends a booking <strong>request</strong> — {talent.display_name} can accept or counter.
                </p>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Talent</span>
                  <span className={styles.summaryRowValue}>{talent.display_name}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Shoot</span>
                  <span className={styles.summaryRowValue}>Standalone booking</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Dates</span>
                  <span className={`${styles.summaryRowValue} ${styles.summaryRowMono}`}>
                    {dateStart} – {dateEnd}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Rate</span>
                  <span className={`${styles.summaryRowValue} ${styles.summaryRowMono}`}>{rateDisplay}/day</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Status on send</span>
                  <span className={`${styles.summaryRowValue} ${styles.summaryRowMono}`}>requested</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Request expires</span>
                  <span className={styles.summaryRowValue}>72 hours after sending</span>
                </div>
              </div>
              <p className={styles.messagePreview}>{messageDraft}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
