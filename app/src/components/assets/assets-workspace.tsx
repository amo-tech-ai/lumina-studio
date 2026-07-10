"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

function countLabel(assets: AssetRow[]): string {
  return `${assets.length} asset${assets.length === 1 ? "" : "s"}`;
}

type Props = {
  assets: AssetRow[];
  isAuthenticated: boolean;
  fetchError?: string | null;
};

/** Read-only asset masonry — ported from Assets.v2.image-first.dc.html
 *  (SCR-08). Upload, bulk select/drag, table view, and the DNA-match /
 *  rights-&-usage IntelligencePanel content are out of scope for this PR
 *  (see tasks/screens/SCR-08-assets.md's "Out of scope") — those need real
 *  backing data (rights records, usage history, channel-readiness scores)
 *  that doesn't exist in the schema yet. */
export function AssetsWorkspace({ assets, isAuthenticated, fetchError }: Props) {
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateBucket>("all");

  const brandOptions = useMemo(() => {
    const byId = new Map<string, string>();
    for (const a of assets) {
      if (a.brand_id && a.brand?.name) byId.set(a.brand_id, a.brand.name);
    }
    return [...byId.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const now = Date.now();
    return assets.filter(
      (a) =>
        matchesTypeFilter(a, filter) &&
        (brandFilter === "all" || a.brand_id === brandFilter) &&
        matchesDateFilter(a, dateFilter, now),
    );
  }, [assets, filter, brandFilter, dateFilter]);

  const hasActiveFilter = filter !== "all" || brandFilter !== "all" || dateFilter !== "all";

  function clearFilters() {
    setFilter("all");
    setBrandFilter("all");
    setDateFilter("all");
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
          <ErrorState message={fetchError} title="Couldn't load assets" />
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
