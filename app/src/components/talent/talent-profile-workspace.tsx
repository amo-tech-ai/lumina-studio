"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, CalendarPlus, MessageSquare, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/ui/status-chip";
import { cloudinaryImageUrl } from "@/lib/cloudinary/url";
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
      const { profile: p, error: e } = await fetchTalentProfile(talentId);
      if (cancelled) return;
      if (e || !p) {
        setError(e ?? "Not found");
        setLoading(false);
        return;
      }
      setProfile(p);
      const { slots: s } = await fetchTalentAvailability(talentId);
      if (!cancelled) setSlots(s);
      setLoading(false);
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

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/app/matching">Matching</Link> <span>›</span> Talent <span>›</span> <span className={styles.breadcrumbActive}>{handle}</span>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" size="sm" className={styles.actionBtn}>
            <Bookmark className={styles.actionIcon} /> Add to shortlist
          </Button>
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
                <Button variant="outline" size="sm">
                  <MessageSquare className={styles.actionIcon} /> Message
                </Button>
                <div className={styles.rating}>
                  <Star className={styles.starIcon} /> <span className={styles.ratingValue}>4.9</span>
                  <span className={styles.ratingMuted}>(23 reviews)</span>
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
            {tab === "portfolio" && <PortfolioPanel avatarUrl={avatarUrl} />}
            {tab === "details" && <DetailsPanel profile={profile} />}
            {tab === "measurements" && <MeasurementsPanel profile={profile} />}
            {tab === "availability" && <AvailabilityPanel slots={slots} />}
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
            <input placeholder={`Ask about ${handle}…`} className={styles.chatInput} />
            <Button size="icon" className={styles.chatSend}>
              ↑
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioPanel({ avatarUrl }: { avatarUrl: string | null }) {
  const items = avatarUrl
    ? [avatarUrl, avatarUrl, avatarUrl, avatarUrl, avatarUrl, avatarUrl]
    : [];
  if (items.length === 0) {
    return <EmptyState heading="No portfolio yet" body="This talent hasn't added portfolio images." />;
  }
  return (
    <div className={styles.portfolioGrid}>
      {items.map((src, i) => (
        <div key={i} className={styles.portfolioItem}>
          <img src={cloudinaryImageUrl(src.includes("http") ? src.split("/").pop()!.split(".")[0] : src, { w: 400, h: 533, crop: "fill" }) ?? src} alt="" className={styles.portfolioImg} />
        </div>
      ))}
    </div>
  );
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

function AvailabilityPanel({ slots }: { slots: TalentAvailabilitySlot[] }) {
  if (slots.length === 0) {
    return <EmptyState heading="No availability yet" body="This talent hasn't set availability windows." />;
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
        heading="No bookings yet"
        body="Bookings for this talent will appear here."
        action={<Link href={`/app/matching/talent/${talentId}/book`}><Button size="sm">Request booking</Button></Link>}
      />
    </div>
  );
}

function ReviewsPanel() {
  const reviews = [
    { brand: "Nike", date: "Feb 2026", rating: "5.0", text: "Kara was completely professional — overperformed benchmark by 30%." },
    { brand: "On Running", date: "Nov 2025", rating: "4.8", text: "Great energy and reliability. Delivered ahead of schedule." },
  ];
  return (
    <div className={styles.reviewsStack}>
      {reviews.map((r) => (
        <div key={r.brand} className={styles.reviewCard}>
          <div className={styles.reviewHead}>
            <div className={styles.reviewBrand}>{r.brand}</div>
            <div className={styles.reviewDate}>{r.date}</div>
            <span className={styles.reviewRating}>
              <Star className={styles.starIcon} /> {r.rating}
            </span>
          </div>
          <p className={styles.reviewText}>{r.text}</p>
        </div>
      ))}
    </div>
  );
}

function ActivityPanel() {
  const items = [
    { text: "Availability updated", cat: "Availability", when: "1d", dot: "var(--warning)" },
    { text: "Portfolio: 2 shots added", cat: "Profile", when: "5d", dot: "var(--color-text-muted)" },
  ];
  return (
    <div className={styles.activityList}>
      {items.map((a) => (
        <div key={a.text} className={styles.activityRow}>
          <span className={styles.activityDot} style={{ background: a.dot }} />
          <div>
            <div className={styles.activityText}>{a.text}</div>
            <div className={styles.activityMeta}>
              {a.cat} · {a.when}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
