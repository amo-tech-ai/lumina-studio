"use client";

// IPI-85 / IPI-273 — Shoots list via shoot_portfolio_view (shoot.* only)

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { ShootCard, type ShootRow } from "@/components/shoot/ShootCard";

const STATUS_TABS = [
  { id: "", label: "All" },
  { id: "planning", label: "Planning" },
  { id: "active", label: "Active" },
  { id: "post_production", label: "Post" },
  { id: "complete", label: "Complete" },
  { id: "archived", label: "Archived" },
] as const;

type SortKey = "updated_at" | "dna_asc" | "dna_desc";

const PORTFOLIO_SELECT =
  "id, name, type, status, dna_score, target_channels, estimated_budget, updated_at, start_date, end_date, location, shot_count, asset_count, cover_image";

export default function ShootsPage() {
  const [shoots, setShoots] = useState<ShootRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("updated_at");

  useEffect(() => {
    setLoading(true);
    setError(null);
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    );
    sb.from("shoot_portfolio_view")
      .select(PORTFOLIO_SELECT)
      .order("updated_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) {
          // Fallback if extended view columns not migrated yet
          if (err.message.includes("column") || err.code === "42703") {
            return sb
              .from("shoot_portfolio_view")
              .select("id, name, type, status, dna_score, target_channels, estimated_budget, updated_at")
              .order("updated_at", { ascending: false })
              .then(({ data: legacy, error: legacyErr }) => {
                if (legacyErr) setError(legacyErr.message);
                else setShoots((legacy as ShootRow[]) ?? []);
                setLoading(false);
              });
          }
          setError(err.message);
          setLoading(false);
          return;
        }
        setShoots((data as ShootRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  const visible = useMemo(() => {
    let list = shoots;
    if (filterStatus) list = list.filter((s) => s.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.location?.toLowerCase().includes(q) ?? false),
      );
    }
    if (sort === "dna_asc") list = [...list].sort((a, b) => (a.dna_score ?? 0) - (b.dna_score ?? 0));
    if (sort === "dna_desc") list = [...list].sort((a, b) => (b.dna_score ?? 0) - (a.dna_score ?? 0));
    return list;
  }, [shoots, filterStatus, search, sort]);

  return (
    <div className="mx-auto w-full max-w-[60rem] space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/app"
            className="font-sans text-sm text-[var(--color-text-secondary)] hover:underline"
          >
            ← Command Center
          </Link>
          <h1 className="mt-2 font-serif text-3xl text-[var(--color-text-primary)]">Shoots</h1>
          {!loading && (
            <p className="mt-1 font-sans text-sm text-[var(--color-text-muted)]">
              {shoots.length} shoot{shoots.length !== 1 ? "s" : ""} in your portfolio
            </p>
          )}
        </div>
        <Link
          href="/app/shoots/new"
          className="rounded-full bg-[var(--color-action)] px-5 py-2.5 font-sans text-sm font-medium text-[var(--color-action-text,white)]"
        >
          + New shoot
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex overflow-x-auto rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] p-0.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className="rounded-full px-3 py-1.5 font-sans text-xs font-medium transition-all"
              style={{
                background: filterStatus === tab.id ? "var(--color-action)" : "transparent",
                color: filterStatus === tab.id ? "var(--color-action-text, white)" : "var(--color-text-secondary)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Search shoots…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[160px] flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2 font-sans text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-action)]"
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-2 font-sans text-sm text-[var(--color-text-secondary)] outline-none focus:border-[var(--color-action)]"
        >
          <option value="updated_at">Sort: Recent</option>
          <option value="dna_asc">Sort: DNA ↑</option>
          <option value="dna_desc">Sort: DNA ↓</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-sans text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-muted)]"
            />
          ))}
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((s) => (
            <ShootCard key={s.id} shoot={s} />
          ))}
          <Link
            href="/app/shoots/new"
            className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-action)] hover:text-[var(--color-action)]"
          >
            <span className="text-2xl">+</span>
            <span className="font-sans text-xs">New shoot</span>
          </Link>
        </div>
      )}

      {!loading && visible.length === 0 && !error && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-12 text-center">
          {search || filterStatus ? (
            <>
              <p className="font-sans text-[var(--color-text-secondary)]">No shoots match this filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterStatus("");
                }}
                className="mt-3 font-sans text-sm text-[var(--color-action)] hover:underline"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="font-sans text-[var(--color-text-secondary)]">No shoots yet.</p>
              <p className="mt-1 font-sans text-sm text-[var(--color-text-muted)]">
                Start the wizard to plan your first shoot with AI.
              </p>
              <Link
                href="/app/shoots/new"
                className="mt-4 inline-block rounded-full bg-[var(--color-action)] px-5 py-2.5 font-sans text-sm font-medium text-[var(--color-action-text,white)]"
              >
                Plan a shoot
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
