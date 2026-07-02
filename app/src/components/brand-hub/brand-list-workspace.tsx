"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Plus, Search } from "lucide-react";

import { useBrandListContext } from "@/components/brand-hub/brand-list-context";
import { BrandListCard, type BrandListCardPillar } from "@/components/brand-hub/brand-list-card";
import {
  BRAND_LIST_FILTER_LABELS,
  BRAND_LIST_FILTERS,
  brandListCountLabel,
  matchesBrandListFilter,
  type BrandListFilter,
} from "@/lib/brand-list-filters";
import { brandListEmptyPreviewUrls } from "@/lib/command-center/sample-images";
import { cn } from "@/lib/utils";

import styles from "./brand-list.module.css";

export type BrandListWorkspaceBrand = {
  id: string;
  name: string;
  brandUrl: string | null;
  intakeStatus: string | null;
  dnaScore: number;
  pillars: BrandListCardPillar[];
};

type Props = {
  brands: BrandListWorkspaceBrand[];
  isAuthenticated: boolean;
  fetchError?: string | null;
};

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function WorkspaceFrame({
  children,
  testId = "brand-list-workspace",
}: {
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div className={styles.workspace} data-testid={testId}>
      <div className={styles.workspaceInner}>{children}</div>
    </div>
  );
}

export function BrandListWorkspace({ brands, isAuthenticated, fetchError }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<BrandListFilter>("all");

  const filteredBrands = useMemo(() => {
    const q = normalizeSearch(query);
    return brands.filter((brand) => {
      const hasDna = brand.dnaScore > 0;
      if (!matchesBrandListFilter(filter, brand.intakeStatus, hasDna)) return false;
      if (!q) return true;
      const haystack = `${brand.name} ${brand.brandUrl ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [brands, filter, query]);

  useBrandListContext(
    filteredBrands.map((b) => ({
      id: b.id,
      name: b.name,
      dnaScore: b.dnaScore,
      intakeStatus: b.intakeStatus,
    })),
  );

  if (!isAuthenticated) {
    return (
      <WorkspaceFrame>
        <div className={styles.workspaceHeader}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>Brands</h1>
              <p className={styles.unauthCopy}>Sign in to view and manage your brand profiles.</p>
            </div>
            <Link href="/login?redirect=/app/brand" className={styles.primaryBtn}>
              Sign in
            </Link>
          </header>
        </div>
      </WorkspaceFrame>
    );
  }

  if (fetchError) {
    return (
      <WorkspaceFrame>
        <div className={styles.workspaceHeader}>
          <header className={styles.header}>
            <h1 className={styles.title}>Brands</h1>
          </header>
        </div>
        <div className={styles.workspaceBody}>
          <div className={styles.errorState}>
            <h2 className={styles.emptyTitle}>Couldn&apos;t load brands</h2>
            <p className={styles.errorCopy}>{fetchError}</p>
          </div>
        </div>
      </WorkspaceFrame>
    );
  }

  if (brands.length === 0) {
    return (
      <WorkspaceFrame>
        <div className={styles.workspaceHeader}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>Brands</h1>
              <p className={styles.subtitle}>0 brands</p>
            </div>
            <Link href="/app/onboarding" className={styles.primaryBtn}>
              <Plus size={16} aria-hidden />
              Add brand
            </Link>
          </header>
        </div>
        <div className={styles.workspaceBody}>
          <div className={styles.emptyState}>
            <div className={styles.emptyPreviewRow} aria-hidden>
              {brandListEmptyPreviewUrls().map((src, index) => (
                <div
                  key={src}
                  className={styles.emptyPreview}
                  data-tilt={String(index)}
                >
                  <Image src={src} alt="" fill sizes="150px" className={styles.emptyPreviewImage} />
                </div>
              ))}
            </div>
            <h2 className={styles.emptyTitle}>No brands yet</h2>
            <p className={styles.emptyCopy}>
              Add your first brand and we&apos;ll crawl it and build a full Brand DNA profile in
              minutes.
            </p>
            <Link href="/app/onboarding" className={styles.primaryBtn}>
              <Plus size={16} aria-hidden />
              Add brand
            </Link>
            <p className={styles.emptyHint}>
              Brand Intelligence: &ldquo;I can crawl your website and build a Brand DNA profile in
              under 2 minutes.&rdquo;
            </p>
          </div>
        </div>
      </WorkspaceFrame>
    );
  }

  const countLabel = brandListCountLabel(brands);
  const showNoMatch = filteredBrands.length === 0;
  const gridCount = Math.min(filteredBrands.length, 3);

  return (
    <WorkspaceFrame>
      <div className={styles.workspaceHeader}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Brands</h1>
            <p className={styles.subtitle}>{countLabel}</p>
          </div>
          <Link href="/app/onboarding" className={styles.primaryBtn}>
            <Plus size={16} aria-hidden />
            Add brand
          </Link>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={16} aria-hidden className="text-[var(--color-text-muted)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brands…"
              className={styles.searchInput}
              aria-label="Search brands"
            />
          </div>
        </div>

        <div className={styles.filterRow} role="group" aria-label="Filter brands">
          {BRAND_LIST_FILTERS.map((chip) => {
            const active = filter === chip;
            return (
              <button
                key={chip}
                type="button"
                className={active ? styles.filterChipActive : styles.filterChip}
                aria-pressed={active}
                onClick={() => setFilter(chip)}
              >
                {BRAND_LIST_FILTER_LABELS[chip]}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.workspaceBody}>
        {showNoMatch ? (
          <div className={styles.noMatchState} data-testid="brand-list-no-match">
            <Search size={30} aria-hidden className={styles.noMatchIcon} />
            <h2 className={styles.noMatchTitle}>
              {query.trim()
                ? `No matches for “${query.trim()}”`
                : "No matches for this filter"}
            </h2>
            <p className={styles.noMatchCopy}>Try a different brand name or status.</p>
          </div>
        ) : (
          <div
            className={styles.grid}
            data-testid="brand-list-grid"
            data-count={String(gridCount)}
          >
            {filteredBrands.map((brand) => (
              <BrandListCard key={brand.id} {...brand} />
            ))}
          </div>
        )}
      </div>
    </WorkspaceFrame>
  );
}

export function BrandListSkeleton() {
  return (
    <div className={styles.workspace} aria-busy="true" aria-label="Loading brands">
      <div className={styles.workspaceInner}>
        <div className={styles.workspaceHeader}>
          <header className={styles.header}>
            <div>
              <div className={styles.skeletonLine} />
              <div className={cn(styles.skeletonLineSm, "mt-2")} />
            </div>
          </header>
        </div>
        <div className={styles.workspaceBody}>
          <div className={styles.skeletonGrid}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonCover} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLineSm} />
                <div className={styles.skeletonBar} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
