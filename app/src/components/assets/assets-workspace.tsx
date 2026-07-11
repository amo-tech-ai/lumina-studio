"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ImageOff } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import type { AssetRow } from "@/lib/assets/get-assets";

import { AssetCard } from "./asset-card";
import styles from "./assets-workspace.module.css";

// Mirrors Assets.v2.image-first.dc.html's single-select filter chips
// (filterDefs=['All','Photo','Graphic','Logo','Video','Low match']). The schema's
// asset_type enum (image/video/document) can't distinguish Photo/Graphic/Logo —
// those three DC labels collapse into "Image" here; documented in SCR-08-assets.md.
// "Low match" is real: assets.dna_score < 70, same threshold DC's own dotColor() uses.
const FILTERS = ["all", "image", "video", "document", "low-match"] as const;
type AssetFilter = (typeof FILTERS)[number];

const FILTER_LABEL: Record<AssetFilter, string> = {
  all: "All",
  image: "Image",
  video: "Video",
  document: "Document",
  "low-match": "Low match",
};

const LOW_MATCH_THRESHOLD = 70;

// DC has no date-filter control — this is additive, per SCR-08-assets.md's DoD
// ("filter by ... date"), built from the real `created_at` column only.
const DATE_BUCKETS = ["all", "7d", "30d", "90d"] as const;
type DateBucket = (typeof DATE_BUCKETS)[number];

const DATE_BUCKET_LABEL: Record<DateBucket, string> = {
  all: "Any time",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

const DATE_BUCKET_DAYS: Partial<Record<DateBucket, number>> = { "7d": 7, "30d": 30, "90d": 90 };

function matchesTypeFilter(asset: AssetRow, filter: AssetFilter): boolean {
  if (filter === "all") return true;
  if (filter === "low-match") return asset.dna_score != null && asset.dna_score < LOW_MATCH_THRESHOLD;
  return asset.asset_type === filter;
}

function matchesDateFilter(asset: AssetRow, bucket: DateBucket, now: number): boolean {
  const days = DATE_BUCKET_DAYS[bucket];
  if (!days) return true;
  const created = new Date(asset.created_at).getTime();
  return now - created <= days * 24 * 60 * 60 * 1000;
}

// DC's header is a single computed {{ countLabel }} string ("1,240 assets · avg DNA
// match 86%") — mirrored here from two real fields (count, avg of non-null dna_score).
// Omits the match segment entirely when no asset has a score, rather than showing 0%.
function countLabel(assets: AssetRow[]): string {
  const base = `${assets.length} asset${assets.length === 1 ? "" : "s"}`;
  const scored = assets.map((a) => a.dna_score).filter((s): s is number => s != null);
  if (scored.length === 0) return base;
  const avg = Math.round(scored.reduce((sum, s) => sum + s, 0) / scored.length);
  return `${base} · avg DNA match ${avg}%`;
}

type Props = {
  assets: AssetRow[];
  isAuthenticated: boolean;
  fetchError?: string | null;
};

/** Read-only asset masonry — ported from Assets.v2.image-first.dc.html
 *  (SCR-08). Upload, bulk select/drag, table view, free-text search (DC's
 *  search implies a `name`/`filename` field the schema doesn't have), and
 *  the rights-&-usage IntelligencePanel content are out of scope for this PR
 *  (see tasks/screens/SCR-08-assets.md's "Out of scope") — those need real
 *  backing data (rights records, usage history, channel-readiness scores)
 *  that doesn't exist in the schema yet. The DC "DNA match" sort control
 *  *is* in scope — it's real (`dna_score`), no fabrication needed. */
export function AssetsWorkspace({ assets, isAuthenticated, fetchError }: Props) {
  // Brand Detail's "Review assets" link and the command-center quick action both
  // deep-link as `/app/assets?brand=<id>` (brand-detail-workspace.tsx, quick-action-chips.tsx)
  // — honor it as the initial filter so multi-brand operators land scoped, not on "All brands".
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [brandFilter, setBrandFilter] = useState<string>(() => searchParams.get("brand") ?? "all");
  const [dateFilter, setDateFilter] = useState<DateBucket>("all");
  const [sortByMatch, setSortByMatch] = useState(false);

  // The useState initializer above only runs on first mount — client-side
  // navigation between two /app/assets?brand=<id> URLs (or browser back/forward)
  // updates searchParams without remounting this component, so brandFilter needs
  // its own sync or it silently shows the previous brand's assets under a new URL.
  useEffect(() => {
    setBrandFilter(searchParams.get("brand") ?? "all");
  }, [searchParams]);

  const brandOptions = useMemo(() => {
    const byId = new Map<string, string>();
    for (const a of assets) {
      if (a.brand_id && a.brand?.name) byId.set(a.brand_id, a.brand.name);
    }
    return [...byId.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const now = Date.now();
    const matched = assets.filter(
      (a) =>
        matchesTypeFilter(a, filter) &&
        (brandFilter === "all" || a.brand_id === brandFilter) &&
        matchesDateFilter(a, dateFilter, now),
    );
    if (!sortByMatch) return matched;
    // DC's "DNA match" sort button — real dna_score desc, nulls (no score yet) last.
    return [...matched].sort((a, b) => (b.dna_score ?? -1) - (a.dna_score ?? -1));
  }, [assets, filter, brandFilter, dateFilter, sortByMatch]);

  const hasActiveFilter = filter !== "all" || brandFilter !== "all" || dateFilter !== "all";

  function clearFilters() {
    setFilter("all");
    setBrandFilter("all");
    setDateFilter("all");
    setSortByMatch(false);
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.workspace}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Assets</h1>
            <p className={styles.subtitle}>Sign in to view your asset library.</p>
          </div>
          <Link href="/login?redirect=/app/assets" className={styles.primaryBtn}>
            Sign in
          </Link>
        </header>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className={styles.workspace}>
        <header className={styles.header}>
          <h1 className={styles.title}>Assets</h1>
        </header>
        <div className={styles.body}>
          <ErrorState
            message={fetchError}
            title="Couldn't load assets"
            onRetry={() => router.refresh()}
          />
        </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className={styles.workspace}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Assets</h1>
            <p className={styles.subtitle}>0 assets</p>
          </div>
        </header>
        <div className={styles.body}>
          <EmptyState
            icon={<ImageOff size={28} />}
            heading="No assets yet"
            body="Assets uploaded to a shoot, or linked to a brand, will appear here."
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.workspace}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Assets</h1>
          <p className={styles.subtitle}>{countLabel(assets)}</p>
        </div>
      </header>

      <div className={styles.filterRow} role="group" aria-label="Filter assets">
        <button
          type="button"
          className={sortByMatch ? styles.filterChipActive : styles.filterChip}
          aria-pressed={sortByMatch}
          onClick={() => setSortByMatch((v) => !v)}
        >
          DNA match
        </button>

        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              className={active ? styles.filterChipActive : styles.filterChip}
              aria-pressed={active}
              onClick={() => setFilter(f)}
            >
              {FILTER_LABEL[f]}
            </button>
          );
        })}

        {brandOptions.length > 0 ? (
          <label className={styles.filterSelectLabel}>
            <span className="sr-only">Filter by brand</span>
            <select
              className={styles.filterSelect}
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="all">All brands</option>
              {brandOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className={styles.filterSelectLabel}>
          <span className="sr-only">Filter by upload date</span>
          <select
            className={styles.filterSelect}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateBucket)}
          >
            {DATE_BUCKETS.map((b) => (
              <option key={b} value={b}>
                {DATE_BUCKET_LABEL[b]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.body}>
        {filteredAssets.length === 0 ? (
          <div className={styles.noMatchState} data-testid="assets-no-match">
            <h2 className={styles.noMatchTitle}>No assets match filter</h2>
            <p className={styles.noMatchCopy}>Try a different filter.</p>
            {hasActiveFilter ? (
              <button type="button" className={styles.clearFilterBtn} onClick={clearFilters}>
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className={styles.masonry} data-testid="assets-grid">
            {filteredAssets.map((asset) => (
              <div key={asset.id} className={styles.masonryItem}>
                <AssetCard asset={asset} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AssetsSkeleton() {
  return (
    <div className={styles.workspace} aria-busy="true" aria-label="Loading assets">
      <header className={styles.header}>
        <div>
          <div className={styles.skeletonLine} />
        </div>
      </header>
      <div className={styles.body}>
        <div className={styles.masonry}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={styles.masonryItem}>
              <div className={styles.skeletonCard} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
