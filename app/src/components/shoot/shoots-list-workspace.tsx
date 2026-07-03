"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Plus, Search, SlidersHorizontal, WifiOff } from "lucide-react";

import {
  SHOOT_LIST_FILTER_LABELS,
  SHOOT_LIST_FILTERS,
  matchesShootListFilter,
  shootListCountLabel,
  type ShootListFilter,
} from "@/lib/shoot/shoot-list-filters";
import { ShootCard, type ShootListItem } from "@/components/shoot/ShootCard";
import { useShootsListIntelDetail } from "@/components/shoot/shoots-list-intel-detail";
import { usePublishShootsListUi } from "@/context/shoots-list-ui-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type SortKey = "date" | "brand";

type Props = {
  shoots: ShootListItem[];
  isAuthenticated: boolean;
  fetchError?: string | null;
  primaryBrandName?: string | null;
  onRetry?: () => void;
};

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function WorkspaceFrame({
  children,
  testId = "shoots-list-workspace",
}: {
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div
      className="flex min-h-full w-full flex-col bg-[var(--color-bg-page)]"
      data-testid={testId}
    >
      <div className="mx-auto w-full max-w-[57.5rem]">{children}</div>
    </div>
  );
}

export function ShootsListWorkspace({
  shoots,
  isAuthenticated,
  fetchError,
  onRetry,
}: Props) {
  const handleRetry = onRetry ?? (() => window.location.reload());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ShootListFilter>("all");
  const [sort, setSort] = useState<SortKey>("date");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredShoots = useMemo(() => {
    const q = normalizeSearch(query);
    let list = shoots.filter((shoot) => matchesShootListFilter(filter, shoot.status));

    if (q) {
      list = list.filter((shoot) => {
        const haystack = `${shoot.name} ${shoot.brandName ?? ""} ${shoot.status}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    list = [...list];
    if (sort === "brand") {
      list.sort((a, b) => (a.brandName ?? "").localeCompare(b.brandName ?? ""));
    } else {
      list.sort((a, b) => {
        const aDate = a.start_date ?? a.updated_at;
        const bDate = b.start_date ?? b.updated_at;
        return bDate.localeCompare(aDate);
      });
    }

    return list;
  }, [shoots, filter, query, sort]);

  const selectedShoot = useMemo(
    () => shoots.find((shoot) => shoot.id === selectedId) ?? null,
    [shoots, selectedId],
  );

  useEffect(() => {
    if (selectedId && !shoots.some((shoot) => shoot.id === selectedId)) {
      setSelectedId(null);
    }
  }, [shoots, selectedId]);

  useShootsListIntelDetail(isAuthenticated && !fetchError ? selectedShoot : null);

  const inProductionCount = useMemo(
    () => shoots.filter((shoot) => shoot.status === "active").length,
    [shoots],
  );

  const shootsListUi = useMemo(() => {
    if (!isAuthenticated || fetchError) return null;
    return {
      total: shoots.length,
      inProduction: inProductionCount,
      selected: selectedShoot
        ? {
            id: selectedShoot.id,
            name: selectedShoot.name,
            brandName: selectedShoot.brandName ?? null,
          }
        : null,
    };
  }, [
    isAuthenticated,
    fetchError,
    shoots.length,
    inProductionCount,
    selectedShoot?.id,
    selectedShoot?.name,
    selectedShoot?.brandName,
  ]);

  usePublishShootsListUi(shootsListUi);

  if (!isAuthenticated) {
    return (
      <WorkspaceFrame>
        <div className="flex-shrink-0 px-10 pt-7">
          <header className="mb-[1.125rem] flex items-end justify-between gap-4">
            <div>
              <h1 className="m-0 text-2xl font-semibold tracking-[-0.01em] text-[var(--color-text-primary)]">
                Shoots
              </h1>
              <p className="mt-[0.3125rem] text-sm text-[var(--color-text-secondary)]">
                Sign in to view and manage your shoots.
              </p>
            </div>
            <Link href="/login?redirect=/app/shoots" className={buttonVariants({ variant: "default" })}>
              Sign in
            </Link>
          </header>
        </div>
      </WorkspaceFrame>
    );
  }

  const countLabel = shootListCountLabel(shoots);
  const showNoMatch = !fetchError && filteredShoots.length === 0 && shoots.length > 0;
  const trimmedQuery = query.trim();

  return (
    <WorkspaceFrame>
      <div className="flex-shrink-0 px-10 pt-7 max-[720px]:px-4 max-[720px]:pt-5">
        <header className="mb-[1.125rem] flex items-end justify-between gap-4 max-[720px]:flex-col max-[720px]:items-stretch">
          <div>
            <h1 className="m-0 text-2xl font-semibold tracking-[-0.01em] text-[var(--color-text-primary)]">
              Shoots
            </h1>
            <p className="mt-[0.3125rem] text-sm text-[var(--color-text-secondary)]">
              {countLabel}
            </p>
          </div>
          <Link href="/app/shoots/new" className={cn(buttonVariants({ variant: "default" }), "gap-2")}>
            <Plus size={16} aria-hidden />
            New shoot
          </Link>
        </header>

        {!fetchError ? (
          <>
            <div className="mb-[0.875rem] flex flex-wrap items-center gap-[0.625rem]">
              <div className="flex h-10 min-w-[12.5rem] flex-1 items-center gap-[0.5625rem] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-[0.8125rem] focus-within:border-[var(--color-border-focus)]">
                <Search size={16} aria-hidden className="text-[var(--color-text-muted)]" />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search shoots…"
                  aria-label="Search shoots"
                  className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                aria-pressed={sort === "brand"}
                onClick={() => setSort((prev) => (prev === "date" ? "brand" : "date"))}
                className="h-10 gap-[0.4375rem] whitespace-nowrap bg-[var(--color-bg-card)] font-medium text-[var(--color-text-secondary)]"
              >
                <SlidersHorizontal size={15} aria-hidden />
                Brand · Date
              </Button>
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter shoots">
              {SHOOT_LIST_FILTERS.map((chip) => {
                const active = filter === chip;
                return (
                  <button
                    key={chip}
                    type="button"
                    className={cn(
                      "h-8 rounded-full border px-[0.875rem] text-sm font-medium",
                      active
                        ? "border-[var(--color-action)] bg-[var(--color-action)] text-[var(--color-action-text)]"
                        : "border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]",
                    )}
                    aria-pressed={active}
                    onClick={() => setFilter(chip)}
                  >
                    {SHOOT_LIST_FILTER_LABELS[chip]}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </div>

      <div className="flex-1 px-10 pb-6 pt-5 max-[720px]:px-4 max-[720px]:pb-6 max-[720px]:pt-4">
        {fetchError ? (
          <div
            className="flex flex-col items-center gap-[0.625rem] px-6 py-16 text-center"
            data-testid="shoots-list-error"
          >
            <WifiOff size={28} aria-hidden className="text-[var(--color-text-muted)]" />
            <p className="m-0 text-base font-semibold">Couldn&apos;t load shoots</p>
            <p className="mx-auto mt-2 max-w-[26.25rem] text-sm leading-[1.55] text-[var(--color-text-secondary)]">
              Check your connection and try again.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleRetry}
              className="mt-[0.375rem] h-[2.375rem] bg-[var(--color-bg-card)] font-medium"
            >
              Try again
            </Button>
          </div>
        ) : showNoMatch ? (
          <div
            className="flex flex-col items-center px-6 py-12 text-center"
            data-testid="shoots-list-no-match"
          >
            <Search size={30} aria-hidden className="text-[var(--color-text-disabled)]" />
            <h2 className="mt-[0.875rem] text-base font-semibold text-[var(--color-text-primary)]">
              {trimmedQuery
                ? `No matches for “${trimmedQuery}”`
                : "No matches for this filter"}
            </h2>
            <p className="mx-auto mt-2 max-w-[26.25rem] text-sm leading-[1.55] text-[var(--color-text-secondary)]">
              Try a different name, brand, or status.
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-3 items-start gap-5 max-[1280px]:grid-cols-2 max-[720px]:grid-cols-1"
            data-testid="shoots-list-grid"
          >
            {filteredShoots.map((shoot) => (
              <ShootCard
                key={shoot.id}
                shoot={shoot}
                selected={selectedId === shoot.id}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        )}
      </div>
    </WorkspaceFrame>
  );
}

export function ShootsListSkeleton() {
  return (
    <div
      className="flex min-h-full w-full flex-col bg-[var(--color-bg-page)]"
      aria-busy="true"
      aria-label="Loading shoots"
      data-testid="shoots-list-loading"
    >
      <div className="mx-auto w-full max-w-[57.5rem]">
        <div className="flex-shrink-0 px-10 pt-7">
          <header className="mb-[1.125rem] flex items-end justify-between gap-4">
            <div>
              <Skeleton className="h-[0.875rem] w-[70%] rounded-[0.625rem]" />
              <Skeleton className="mt-2 h-[0.6875rem] w-[45%] rounded-[0.625rem]" />
            </div>
          </header>
        </div>
        <div className="flex-1 px-10 pb-6 pt-5">
          <div className="grid grid-cols-3 gap-5 max-[1280px]:grid-cols-2 max-[720px]:grid-cols-1">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[4/3] w-full rounded-[var(--image-radius,1.25rem)]" />
                <Skeleton className="h-[0.875rem] w-[70%] rounded-[0.625rem]" />
                <Skeleton className="h-[0.6875rem] w-[45%] rounded-[0.625rem]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
