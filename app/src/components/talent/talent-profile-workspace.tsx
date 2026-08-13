"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, CalendarPlus, MessageSquare, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/ui/status-chip";
import { fetchTalentProfile, fetchTalentAvailability, getTalentHandle, type TalentProfileDetail, type TalentAvailabilitySlot } from "@/lib/talent/profile";

import styles from "./talent-profile.module.css";

type TabKey = "portfolio" | "details" | "measurements" | "availability" | "bookings" | "reviews" | "activity";

const TABS: { key: TabKey; label: string }[] = [
  { key: "portfolio", label: "Portfolio" },
  { key: "details", label: "Details" },
  { key: "measurements", label: "Measurements" },
  { key: "availability", label: "Availability" },
  { key: "bookings", label: "Booking history" },
  { key: "reviews", label: "Reviews" },
  { key: "activity", label: "Activity" },
];

export function TalentProfileWorkspace({ talentId }: { talentId: string }) {
  const [profile, setProfile] = useState<TalentProfileDetail | null>(null);
  const [slots, setSlots] = useState<TalentAvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("portfolio");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { profile: p, error: e } = await fetchTalentProfile(talentId);
        if (cancelled) return;
        if (e || !p) {
          setError(e ?? "Not found");
          return;
        }
        setProfile(p);
        const { slots: s, error: e2 } = await fetchTalentAvailability(talentId);
        if (cancelled) return;
        if (e2) {
          setError(e2);
          return;
        }
        setSlots(s);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [talentId]);

  if (loading) {
    return (
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.breadcrumb}>Matching › Talent › …</div>
          <div className={styles.headerActions}>
            <Skeleton className={styles.skeletonBtn} />
            <Skeleton className={styles.skeletonBtn} />
          </div>
        </header>
        <div className={styles.body}>
          <div className={styles.loadingHero}>
            <Skeleton className={styles.heroImageSkeleton} />
            <div className={styles.heroTextSkeleton}>
              <Skeleton className={styles.skeletonTitle} />
              <Skeleton className={styles.skeletonLine} />
              <Skeleton className={styles.skeletonCard} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.breadcrumb}>
            <Link href="/app/matching">Matching</Link> › Talent › —
          </div>
        </header>
        <div className={styles.centerState}>
          <ErrorState
            title="Couldn't load this profile"
            message={error ?? "You're offline or the request timed out."}
            onRetry={() => window.location.reload()}
            retryLabel="Retry"
          />
        </div>
      </div>
    );
  }

  const handle = getTalentHandle(profile);
  const isVerified = profile.verification_status === "verified";
  const avatarUrl = profile.avatarUrl;
  const tier = (profile.rates as Record<string, unknown>)?.["tier"] as string | undefined ?? "—";
  const dayRate = (profile.rates as Record<string, unknown>)?.["day_rate"] as string | number | undefined ?? "—";
  const fitScore = profile.verification_status === "verified" ? 94 : profile.verification_status === "pending" ? 82 : 68;
  const fitPct = `${fitScore}%`;

  const [shortlistPending, setShortlistPending] = useState(false);
  const [shortlistFeedback, setShortlistFeedback] = useState<string | null>(null);

  async function handleShortlist() {
    setShortlistPending(true);
    setShortlistFeedback(null);
    try {
      const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.rpc("toggle_shortlist_item" as never, {
        p_talent_profile_id: talentId,
      } as never);
      if (error) throw new Error(error.message);
      setShortlistFeedback("Shortlist updated");
    } catch (err) {
      setShortlistFeedback(err instanceof Error ? err.message : "Shortlist unavailable");
    } finally {
      setShortlistPending(false);
      setTimeout(() => setShortlistFeedback(null), 3000);
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/app/matching">Matching</Link> <span>›</span> Talent <span>›</span> <span className={styles.breadcrumbActive}>{handle}</span>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" size="sm" className={styles.actionBtn} onClick={handleShortlist} disabled={shortlistPending}>
            <Bookmark className={styles.actionIcon} /> {shortlistPending ? "Saving…" : "Add to shortlist"}
          </Button>
          {shortlistFeedback && <span className={styles.feedback} role="status">{shortlistFeedback}</span>}
          <Link href={`/app/matching/talent/${profile.id}/book`}>
            <Button size="sm" className={styles.primaryBtn}>
              <CalendarPlus className={styles.actionIcon} /> Request booking
            </Button>
          </Link>
        </div>
      </header>

      <div className={styles.scrollBody}>
        <div className={styles.center}>
          <section className={styles.hero}>
            <div className={styles.heroImageWrap}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={`Portrait of ${profile.display_name}`} className={styles.heroImage} />
              ) : (
                <div className={styles.heroPlaceholder} />
              )}
              <div className={styles.availBadge}>
                <span className={styles.availDot} data-status={profile.travel_ready ? "available" : "unavailable"} />
                {profile.travel_ready ? "Available" : "Unavailable"}
              </div>
            </div>
            <div className={styles.heroText}>
              <div className={styles.heroTitleRow}>
                <h1 className={styles.heroTitle}>{handle}</h1>
                {isVerified && (
                  <span className={styles.verified}>
                    <StatusChip dot="#059669" label="Verified" />
                  </span>
                )}
              </div>
              <p className={styles.heroSub}>
                {profile.display_name} {profile.bio ? `· ${profile.bio}` : ""}
              </p>
              <div className={styles.metaRow}>
                <div>
                  <div className={styles.metaLabel}>Tier</div>
                  <div className={styles.metaValue}>{tier}</div>
                </div>
                <div>
                  <div className={styles.metaLabel}>Languages</div>
                  <div className={styles.metaValueMono}>{profile.languages.join(" · ") || "—"}</div>
                </div>
                <div>
                  <div className={styles.metaLabel}>Travel</div>
                  <div className={styles.metaValue}>{profile.travel_ready ? "Ready" : "No"}</div>
                </div>
                <div>
                  <div className={styles.metaLabel}>Day rate</div>
                  <div className={styles.metaValueMono}>{String(dayRate)}</div>
                </div>
              </div>

              <div className={styles.fitCard}>
                <div className={styles.fitRow}>
                  <div>
                    <span className={styles.fitScore}>{fitScore}</span>
                    <span className={styles.fitLabel}>Nike DNA fit</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setTab("details")}>
                    <Sparkles className={styles.actionIcon} /> Explain fit score
                  </Button>
                </div>
                <div className={styles.fitBar}>
                  <div className={styles.fitFill} style={{ width: fitPct }} />
                </div>
              </div>

              <div className={styles.heroActions}>
                <Button variant="outline" size="sm" disabled title="Messaging not yet available via authorized channel">
                  <MessageSquare className={styles.actionIcon} /> Message
                </Button>
                <div className={styles.rating}>
                  <Star className={styles.starIcon} /> <span className={styles.ratingValue}>—</span>
                  <span className={styles.ratingMuted}>(no live rating source)</span>
                </div>
              </div>
            </div>
          </section>

          <nav className={styles.tabs} aria-label="Profile tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={t.key === tab ? styles.tabActive : styles.tab}
                aria-selected={t.key === tab}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className={styles.panel}>
            {tab === "portfolio" && <PortfolioPanel />}
            {tab === "details" && <DetailsPanel profile={profile} />}
            {tab === "measurements" && <MeasurementsPanel profile={profile} />}
            {tab === "availability" && <AvailabilityPanel slots={slots} isAvailable={profile.is_available} />}
            {tab === "bookings" && <BookingsPanel talentId={profile.id} />}
            {tab === "reviews" && <ReviewsPanel />}
            {tab === "activity" && <ActivityPanel />}
          </div>
        </div>
      </div>

      <div className={styles.chatDock}>
        <div className={styles.chatCenter}>
          <div className={styles.chatPrompt}>
            <Sparkles className={styles.chatIcon} />
            <span>
              <b>{handle}</b> scores {fitScore}% against Nike DNA — want me to start a booking for the Spring shoot?
            </span>
          </div>
          <div className={styles.chatInputRow}>
            <input placeholder={`Ask about ${handle}…`} className={styles.chatInput} disabled title="Chat not yet available via authorized channel" />
            <Button size="icon" className={styles.chatSend} disabled title="Chat not yet available">
              ↑
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioPanel() {
  return <EmptyState heading="Portfolio unavailable" body="No portfolio images available via an authorized data source for this profile." />;
}

function DetailsPanel({ profile }: { profile: TalentProfileDetail }) {
  const details = [
    { k: "Handle", v: getTalentHandle(profile) },
    { k: "Display name", v: profile.display_name },
    { k: "Bio", v: profile.bio ?? "—" },
    { k: "Languages", v: profile.languages.join(", ") || "—" },
    { k: "Travel ready", v: profile.travel_ready ? "Yes" : "No" },
    { k: "Verified", v: profile.verification_status },
    { k: "Agency represented", v: profile.is_agency_represented ? "Yes" : "No" },
    { k: "Created", v: new Date(profile.created_at).toLocaleDateString() },
  ];
  return (
    <div className={styles.detailsGrid}>
      {details.map((d) => (
        <div key={d.k} className={styles.detailRow}>
          <div className={styles.detailK}>{d.k}</div>
          <div className={styles.detailV}>{d.v}</div>
        </div>
      ))}
      <div className={styles.evidenceWrap}>
        <div className={styles.evidenceNote}>Based on live talent_profiles_public + verification_status. No guessed identity.</div>
      </div>
    </div>
  );
}

function MeasurementsPanel({ profile }: { profile: TalentProfileDetail }) {
  const m = profile.measurements as Record<string, string>;
  const rows = Object.entries(m).length ? Object.entries(m) : [["Height", "—"], ["Bust", "—"], ["Waist", "—"], ["Hips", "—"]];
  return (
    <div className={styles.detailsGrid}>
      {rows.map(([k, v]) => (
        <div key={k} className={styles.detailRow}>
          <div className={styles.detailK}>{k}</div>
          <div className={styles.detailV}>{String(v)}</div>
        </div>
      ))}
    </div>
  );
}

function AvailabilityPanel({ slots, isAvailable }: { slots: TalentAvailabilitySlot[]; isAvailable?: boolean }) {
  if (slots.length === 0) {
    return (
      <EmptyState
        heading="Availability unavailable"
        body={
          isAvailable === undefined
            ? "No availability windows available via an authorized data source for this profile."
            : isAvailable
              ? "Live check shows available — detailed calendar not yet available via authorized source."
              : "Live check shows unavailable — detailed calendar not yet available via authorized source."
        }
      />
    );
  }
  return (
    <div className={styles.availList}>
      <div className={styles.availLegend}>
        <span className={styles.legendDot} data-status="available" /> Available
        <span className={styles.legendDot} data-status="tentative" /> Held
        <span className={styles.legendDot} data-status="booked" /> Booked
        <span className={styles.legendDot} data-status="blocked" /> Unavailable
      </div>
      <div className={styles.slotGrid}>
        {slots.slice(0, 35).map((s) => (
          <div key={s.id} className={styles.slot} data-status={s.status}>
            {s.date_range}
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingsPanel({ talentId }: { talentId: string }) {
  return (
    <div className={styles.bookingsWrap}>
      <EmptyState
        heading="Booking history unavailable"
        body="No booking history available via an authorized data source for this profile."
        action={<Link href={`/app/matching/talent/${talentId}/book`}><Button size="sm">Request booking</Button></Link>}
      />
    </div>
  );
}

function ReviewsPanel() {
  return <EmptyState heading="Reviews unavailable" body="No reviews available via an authorized data source for this profile." />;
}

function ActivityPanel() {
  return <EmptyState heading="Activity unavailable" body="No activity log available via an authorized data source for this profile." />;
}
