"use client";

// IPI-85 SHOOT-UX-002 — Shoots Dashboard

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ShootCard, type ShootRow } from "@/components/shoot/ShootCard";

// ponytail: useAgentContext deferred to IPI-128 (requires CopilotKit provider)

const STATUS_TABS = [
  { id: "", label: "All" },
  { id: "planning", label: "Planning" },
  { id: "active", label: "Active" },
  { id: "post_production", label: "Post" },
  { id: "complete", label: "Complete" },
  { id: "archived", label: "Archived" },
] as const;

type SortKey = "updated_at" | "dna_asc" | "dna_desc";

export default function ShootsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [shoots, setShoots] = useState<ShootRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("updated_at");

  // ── Fetch shoots (RLS ensures user sees only their brand's shoots)
  useEffect(() => {
    setLoading(true);
    setError(null);

    // ponytail: query via public view — shoot.shoots is not in the exposed schema list;
    // migration 20260626000001_shoot_portfolio_view.sql adds this view.
    supabase
      .from("shoot_portfolio_view")
      .select("id, name, type, status, dna_score, target_channels, estimated_budget, updated_at")
      .order("updated_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setShoots((data as ShootRow[]) ?? []);
        setLoading(false);
      });
  }, [supabase]);

  // ── Client-side filter + sort
  const visible = useMemo(() => {
    let list = shoots;
    if (filterStatus) list = list.filter((s) => s.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (sort === "dna_asc") list = [...list].sort((a, b) => (a.dna_score ?? 0) - (b.dna_score ?? 0));
    if (sort === "dna_desc") list = [...list].sort((a, b) => (b.dna_score ?? 0) - (a.dna_score ?? 0));
    return list;
  }, [shoots, filterStatus, search, sort]);

  return (
    <div className="min-h-screen p-6" style={{ background: "#FBF8F5" }}>
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/app" className="font-sans text-sm text-[#64748B] hover:underline">
              ← Command Center
            </Link>
            <h1 className="mt-2 font-serif text-3xl text-[#1E293B]">Shoots</h1>
            {!loading && (
              <p className="mt-1 font-sans text-sm text-[#64748B]">
                {shoots.length} shoot{shoots.length !== 1 ? "s" : ""} in your portfolio
              </p>
            )}
          </div>
          <Link
            href="/app/shoots/new"
            className="rounded-full px-5 py-2.5 font-sans text-sm font-medium text-white"
            style={{ background: "#E87C4D" }}
          >
            + New shoot
          </Link>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status tabs */}
          <div className="flex overflow-x-auto rounded-full border border-[#E8E0D8] bg-white p-0.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className="rounded-full px-3 py-1.5 font-sans text-xs font-medium transition-all"
                style={{
                  background: filterStatus === tab.id ? "#E87C4D" : "transparent",
                  color: filterStatus === tab.id ? "white" : "#64748B",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="search"
            placeholder="Search shoots…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[160px] rounded-full border border-[#E8E0D8] bg-white px-4 py-2 font-sans text-sm text-[#1E293B] outline-none focus:border-[#E87C4D]"
          />

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-full border border-[#E8E0D8] bg-white px-4 py-2 font-sans text-sm text-[#64748B] outline-none focus:border-[#E87C4D]"
          >
            <option value="updated_at">Sort: Recent</option>
            <option value="dna_asc">Sort: DNA ↑</option>
            <option value="dna_desc">Sort: DNA ↓</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-sans text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl border border-[#E8E0D8] bg-white" />
            ))}
          </div>
        )}

        {/* Grid */}
        {!loading && visible.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((s) => <ShootCard key={s.id} shoot={s} />)}
            {/* + New Shoot trailing card */}
            <Link
              href="/app/shoots/new"
              className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#E8E0D8] bg-white text-[#94A3B8] transition-colors hover:border-[#E87C4D] hover:text-[#E87C4D]"
            >
              <span className="text-2xl">+</span>
              <span className="font-sans text-xs">New shoot</span>
            </Link>
          </div>
        )}

        {/* Empty state */}
        {!loading && visible.length === 0 && !error && (
          <div className="rounded-2xl border border-[#E8E0D8] bg-white p-12 text-center">
            {search || filterStatus ? (
              <>
                <p className="font-sans text-[#64748B]">No shoots match this filter.</p>
                <button
                  onClick={() => { setSearch(""); setFilterStatus(""); }}
                  className="mt-3 font-sans text-sm text-[#E87C4D] hover:underline"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="font-sans text-[#64748B]">No shoots yet.</p>
                <p className="mt-1 font-sans text-sm text-[#94A3B8]">
                  Start the wizard to plan your first shoot with AI.
                </p>
                <Link
                  href="/app/shoots/new"
                  className="mt-4 inline-block rounded-full px-5 py-2.5 font-sans text-sm font-medium text-white"
                  style={{ background: "#E87C4D" }}
                >
                  Plan a shoot
                </Link>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
