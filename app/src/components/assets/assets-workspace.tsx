"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ImageOff } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import type { AssetRow } from "@/lib/assets/get-assets";
import {
  ASSET_STATUS_VALUES,
  buildAssetsLibraryUrl,
  decodeTags,
  formatTagsDraft,
  hasServerAssetsFilters,
  type AssetsLibraryFilters,
} from "@/lib/assets/list-assets-params";

import { AssetCard } from "./asset-card";
import { AssetUploadPanel, type UploadBrandOption } from "./asset-upload-panel";
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
  const base = `${assets.length} asset${assets.length === 1 ? "" : "s"}`;
  const scored = assets.map((a) => a.dna_score).filter((s): s is number => s != null);
  if (scored.length === 0) return base;
  const avg = Math.round(scored.reduce((sum, s) => sum + s, 0) / scored.length);
  return `${base} · avg DNA match ${avg}%`;
}

type Props = {
  assets: AssetRow[];
  brands?: UploadBrandOption[];
  filters: AssetsLibraryFilters;
  nextCursor: string | null;
  isAuthenticated: boolean;
  fetchError?: string | null;
};

/** Asset masonry — SCR-08 + IPI-435 server-backed search/filters/URL state. */
export function AssetsWorkspace({
  assets,
  brands = [],
  filters,
  nextCursor,
  isAuthenticated,
  fetchError,
}: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<AssetFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateBucket>("all");
  const [sortByMatch, setSortByMatch] = useState(false);
  const [draftQuery, setDraftQuery] = useState(filters.query);
  const [draftTags, setDraftTags] = useState(() => formatTagsDraft(filters.tags));

  // Server navigation updates `filters` without remounting — keep draft inputs in sync
  // so a copied URL / back-forward restore shows the same search text.
  useEffect(() => {
    setDraftQuery(filters.query);
    setDraftTags(formatTagsDraft(filters.tags));
  }, [filters.query, filters.tags]);

  const brandOptions = useMemo(() => {
    const byId = new Map<string, string>();
    for (const b of brands) byId.set(b.id, b.name);
    for (const a of assets) {
      if (a.brand_id && a.brand?.name) byId.set(a.brand_id, a.brand.name);
    }
    return [...byId.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [assets, brands]);

  const filteredAssets = useMemo(() => {
    const now = Date.now();
    const matched = assets.filter(
      (a) => matchesTypeFilter(a, filter) && matchesDateFilter(a, dateFilter, now),
    );
    if (!sortByMatch) return matched;
    return [...matched].sort((a, b) => (b.dna_score ?? -1) - (a.dna_score ?? -1));
  }, [assets, filter, dateFilter, sortByMatch]);

  const hasClientFilter = filter !== "all" || dateFilter !== "all" || sortByMatch;
  const hasActiveFilter = hasServerAssetsFilters(filters) || hasClientFilter;
  const isPastFirstPage = Boolean(filters.cursor);

  function navigate(patch: Partial<AssetsLibraryFilters>) {
    // `"key" in patch` so callers can clear optional fields (e.g. brandId).
    // Cursor is only kept when the patch sets one (Next page); filter edits drop it.
    router.push(
      buildAssetsLibraryUrl({
        brandId: "brandId" in patch ? patch.brandId : filters.brandId,
        query: "query" in patch ? (patch.query ?? "") : filters.query,
        status: "status" in patch ? (patch.status ?? []) : filters.status,
        tags: "tags" in patch ? (patch.tags ?? []) : filters.tags,
        sort: "sort" in patch ? (patch.sort ?? "newest") : filters.sort,
        limit: "limit" in patch ? (patch.limit ?? filters.limit) : filters.limit,
        cursor: "cursor" in patch ? patch.cursor : undefined,
      }),
    );
  }

  function onSearchSubmit(event: FormEvent) {
    event.preventDefault();
    navigate({
      query: draftQuery.trim(),
      // Same codec as the shareable URL — plain CSV or percent-encoded tags.
      tags: decodeTags(draftTags),
    });
  }

  function clearFilters() {
    setFilter("all");
    setDateFilter("all");
    setSortByMatch(false);
    setDraftQuery("");
    setDraftTags("");
    router.push("/app/assets");
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

  // Only seed upload from URL brand when that id is in the caller's brand list
  // (RLS-visible). A stale/inaccessible ?brand= UUID must not reach signing.
  const uploadDefaultBrandId =
    filters.brandId && brands.some((b) => b.id === filters.brandId)
      ? filters.brandId
      : undefined;

  const uploadPanel = (
    <AssetUploadPanel
      brands={brands}
      defaultBrandId={uploadDefaultBrandId}
      onReady={() => router.refresh()}
    />
  );

  if (fetchError) {
    return (
      <div className={styles.workspace}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Assets</h1>
          </div>
          {uploadPanel}
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

  if (assets.length === 0 && !hasServerAssetsFilters(filters) && !isPastFirstPage) {
    return (
      <div className={styles.workspace}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Assets</h1>
            <p className={styles.subtitle}>0 assets</p>
          </div>
          {uploadPanel}
        </header>
        <div className={styles.body}>
          <EmptyState
            icon={<ImageOff size={28} />}
            heading="No assets yet"
            body="Upload a brand asset or link media from a shoot to populate the library."
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
          <p className={styles.subtitle}>{countLabel(filteredAssets)}</p>
        </div>
        {uploadPanel}
      </header>

      <form className={styles.searchRow} onSubmit={onSearchSubmit} role="search">
        <label className={styles.searchField}>
          <span className="sr-only">Search assets</span>
          <input
            className={styles.searchInput}
            type="search"
            name="q"
            value={draftQuery}
            onChange={(e) => setDraftQuery(e.target.value)}
            placeholder="Search filename, public id, title, tags…"
            maxLength={100}
            data-testid="assets-search-input"
          />
        </label>
        <label className={styles.searchField}>
          <span className="sr-only">Filter by tags</span>
          <input
            className={styles.searchInput}
            type="text"
            name="tags"
            value={draftTags}
            onChange={(e) => setDraftTags(e.target.value)}
            placeholder="Tags (comma-separated)"
            data-testid="assets-tags-input"
          />
        </label>
        <button type="submit" className={styles.searchBtn}>
          Search
        </button>
      </form>

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
              value={filters.brandId ?? "all"}
              onChange={(e) =>
                navigate({
                  brandId: e.target.value === "all" ? undefined : e.target.value,
                })
              }
              data-testid="assets-brand-filter"
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
          <span className="sr-only">Filter by status</span>
          <select
            className={styles.filterSelect}
            value={filters.status[0] ?? "all"}
            onChange={(e) =>
              navigate({
                status: e.target.value === "all" ? [] : [e.target.value],
              })
            }
            data-testid="assets-status-filter"
          >
            <option value="all">Any status</option>
            {ASSET_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filterSelectLabel}>
          <span className="sr-only">Sort by upload date</span>
          <select
            className={styles.filterSelect}
            value={filters.sort}
            onChange={(e) =>
              navigate({
                sort: e.target.value as AssetsLibraryFilters["sort"],
              })
            }
            data-testid="assets-sort-filter"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>

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

        {hasActiveFilter ? (
          <button type="button" className={styles.clearFilterBtn} onClick={clearFilters}>
            Clear filters
          </button>
        ) : null}
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

        {isPastFirstPage || nextCursor ? (
          <nav className={styles.pagination} aria-label="Asset pages">
            {isPastFirstPage ? (
              <Link
                href={buildAssetsLibraryUrl({ ...filters, cursor: undefined })}
                className={styles.paginationBtnSecondary}
              >
                First page
              </Link>
            ) : null}
            {nextCursor ? (
              <Link
                href={buildAssetsLibraryUrl({ ...filters, cursor: nextCursor })}
                className={styles.paginationBtnPrimary}
              >
                Next page
              </Link>
            ) : null}
          </nav>
        ) : null}
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
