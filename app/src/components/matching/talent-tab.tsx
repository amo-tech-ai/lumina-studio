"use client";

// IPI-308 · MODEL-P2 — Talent tab: filters, swipe/list toggle, shortlist.
// Calls public.search_talent / get_or_create_shortlist / toggle_shortlist_item
// directly from the browser (RLS + SECURITY DEFINER RPCs enforce access —
// same pattern as other authenticated browser-client reads in this app).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EvidenceBlock } from "@/components/evidence-block";
import { useSetIntelligenceDetail } from "@/context/intelligence-detail-context";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { computeMatchScore } from "@/lib/talent/match-score";
import type { TalentResult, TalentSearchFilters } from "@/lib/talent/types";
import { TalentSwipeCard, TalentRow } from "./talent-card";
import { ShortlistDrawer } from "./shortlist-drawer";

type ViewMode = "swipe" | "list";

const ANY = "any";

export function TalentTab() {
  const [filters, setFilters] = useState<TalentSearchFilters>({});
  const [view, setView] = useState<ViewMode>("swipe");
  const [talents, setTalents] = useState<TalentResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [shortlistId, setShortlistId] = useState<string | null>(null);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [shortlistedTalents, setShortlistedTalents] = useState<TalentResult[]>([]);
  const [pendingToggleIds, setPendingToggleIds] = useState<Set<string>>(new Set());
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [passedIds, setPassedIds] = useState<Set<string>>(new Set());

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  // Guards the search RPC against out-of-order responses: only the reply
  // matching the latest request is applied, so a slow older request can't
  // overwrite a newer filter's results.
  const searchRequestId = useRef(0);

  useEffect(() => {
    fetch("/api/org/current")
      .then((r) => (r.ok ? (r.json() as Promise<{ orgId: string }>) : null))
      .then((data) => data && setOrgId(data.orgId))
      .catch((err) => console.error("[matching] org lookup failed:", err));
  }, []);

  const runSearch = useCallback(
    async (nextFilters: TalentSearchFilters) => {
      const requestId = ++searchRequestId.current;
      setTalents(null);
      setError(null);
      const { data, error: rpcError } = await supabase.rpc("search_talent", {
        p_shoot_type: nextFilters.shootType ?? null,
        p_budget_tier: nextFilters.budgetTier ?? null,
        p_date_start: nextFilters.dateStart ?? null,
        p_date_end: nextFilters.dateEnd ?? null,
        p_representation: nextFilters.representation ?? null,
        p_only_shortlist_id: null,
      });
      if (requestId !== searchRequestId.current) return; // a newer search has since started
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      setTalents((data ?? []) as TalentResult[]);
    },
    [supabase],
  );

  useEffect(() => {
    runSearch(filters);
    setPassedIds(new Set());
  }, [filters, runSearch]);

  // Rehydrates shortlist state from the DB (not just this session's local
  // toggles) so a page refresh doesn't make the shortlist appear empty.
  const refreshShortlist = useCallback(
    async (currentShortlistId: string) => {
      const { data, error: rpcError } = await supabase.rpc("search_talent", {
        p_shoot_type: null,
        p_budget_tier: null,
        p_date_start: null,
        p_date_end: null,
        p_representation: null,
        p_only_shortlist_id: currentShortlistId,
      });
      if (rpcError) {
        console.error("[matching] shortlist refresh failed:", rpcError.message);
        return;
      }
      const list = (data ?? []) as TalentResult[];
      setShortlistedTalents(list);
      setShortlistedIds(new Set(list.map((t) => t.id)));
    },
    [supabase],
  );

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    (async () => {
      const { data, error: getErr } = await supabase.rpc("get_or_create_shortlist", {
        p_org_id: orgId,
      });
      if (cancelled) return;
      if (getErr || !data) {
        console.error("[matching] get_or_create_shortlist failed:", getErr?.message);
        return;
      }
      setShortlistId(data as string);
      await refreshShortlist(data as string);
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, refreshShortlist, supabase]);

  const toggleShortlist = useCallback(
    async (talentProfileId: string) => {
      if (!orgId || pendingToggleIds.has(talentProfileId)) return;
      setPendingToggleIds((prev) => new Set(prev).add(talentProfileId));
      try {
        const adding = !shortlistedIds.has(talentProfileId);
        let currentShortlistId = shortlistId;
        if (!currentShortlistId) {
          const { data, error: getErr } = await supabase.rpc("get_or_create_shortlist", {
            p_org_id: orgId,
          });
          if (getErr || !data) {
            console.error("[matching] get_or_create_shortlist failed:", getErr?.message);
            return;
          }
          currentShortlistId = data as string;
          setShortlistId(currentShortlistId);
        }
        const { error: toggleErr } = await supabase.rpc("toggle_shortlist_item", {
          p_shortlist_id: currentShortlistId,
          p_talent_profile_id: talentProfileId,
          p_add: adding,
        });
        if (toggleErr) {
          console.error("[matching] toggle_shortlist_item failed:", toggleErr.message);
          return;
        }
        await refreshShortlist(currentShortlistId);
      } finally {
        setPendingToggleIds((prev) => {
          const next = new Set(prev);
          next.delete(talentProfileId);
          return next;
        });
      }
    },
    [orgId, shortlistId, shortlistedIds, pendingToggleIds, supabase, refreshShortlist],
  );

  const selected = talents?.find((t) => t.id === selectedId) ?? null;
  const selectedMatch = selected
    ? computeMatchScore({ talent: selected, shootType: filters.shootType, representationPreferred: filters.representation })
    : null;

  // Memoized on primitives only — useSetIntelligenceDetail's effect deps on
  // this node's identity, and TalentTab itself consumes the same context, so
  // a node rebuilt on every render would re-trigger the effect every render.
  const detailNode = useMemo(
    () =>
      selected && selectedMatch ? (
        <div className="flex flex-col gap-3 p-4">
          <EvidenceBlock
            title={selected.display_name}
            score={selectedMatch.score}
            confidence={selectedMatch.confidence}
            why={selectedMatch.why}
          />
          <Button type="button" variant="default" disabled title="Coming soon — Booking Wizard (IPI-309)">
            Request booking
          </Button>
          <Button type="button" variant="outline" disabled title="Coming soon — Talent Profile Detail">
            View full profile
          </Button>
        </div>
      ) : null,
    [selected, selectedMatch?.score, selectedMatch?.confidence, selectedMatch?.why],
  );

  useSetIntelligenceDetail(detailNode);

  const visible = talents?.filter((t) => !passedIds.has(t.id)) ?? null;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.shootType ?? ANY}
          onValueChange={(v) => setFilters((f) => ({ ...f, shootType: v === ANY ? undefined : v }))}
        >
          <SelectTrigger className="w-40" aria-label="Shoot type"><SelectValue placeholder="Shoot type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any shoot type</SelectItem>
            <SelectItem value="Editorial">Editorial</SelectItem>
            <SelectItem value="Commercial">Commercial</SelectItem>
            <SelectItem value="Runway">Runway</SelectItem>
            <SelectItem value="UGC">UGC</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.budgetTier ?? ANY}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, budgetTier: v === ANY ? undefined : (v as "$" | "$$" | "$$$") }))
          }
        >
          <SelectTrigger className="w-36" aria-label="Budget range"><SelectValue placeholder="Budget" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any budget</SelectItem>
            <SelectItem value="$">$</SelectItem>
            <SelectItem value="$$">$$</SelectItem>
            <SelectItem value="$$$">$$$</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.representation ?? ANY}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              representation: v === ANY ? undefined : (v as "independent" | "agency"),
            }))
          }
        >
          <SelectTrigger className="w-40" aria-label="Representation"><SelectValue placeholder="Representation" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Independent/Agency/Any</SelectItem>
            <SelectItem value="independent">Independent</SelectItem>
            <SelectItem value="agency">Agency</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5 font-sans text-xs text-[#6B7280]">
          <span aria-hidden>Available</span>
          <input
            type="date"
            aria-label="Available from"
            className="rounded-md border border-[#E5E7EB] px-2 py-1 text-xs"
            value={filters.dateStart ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, dateStart: e.target.value || undefined }))}
          />
          <span aria-hidden>–</span>
          <input
            type="date"
            aria-label="Available until"
            className="rounded-md border border-[#E5E7EB] px-2 py-1 text-xs"
            value={filters.dateEnd ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, dateEnd: e.target.value || undefined }))}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setShortlistOpen(true)}>
            Shortlist ({shortlistedIds.size})
          </Button>
          <div className="flex overflow-hidden rounded-md border border-[#E5E7EB]">
            <Button
              type="button"
              variant={view === "swipe" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setView("swipe")}
            >
              Swipe deck
            </Button>
            <Button
              type="button"
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              className="hidden rounded-none md:inline-flex"
              onClick={() => setView("list")}
            >
              Table
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" aria-live="polite">
        {error ? (
          <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 font-sans text-sm text-[#DC2626]">
            {error}{" "}
            <Button type="button" variant="outline" size="sm" onClick={() => runSearch(filters)}>
              Retry
            </Button>
          </div>
        ) : visible === null ? (
          <div className={view === "swipe" ? "grid grid-cols-2 gap-3 lg:grid-cols-3" : "flex flex-col gap-2"}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className={view === "swipe" ? "aspect-[3/4] rounded-2xl" : "h-16 rounded-xl"} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-sans text-sm text-[#6B7280]">No talent matches this brief yet.</p>
            <Button type="button" variant="outline" onClick={() => setFilters({})}>
              Adjust filters
            </Button>
          </div>
        ) : view === "swipe" ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {visible.map((t) => {
              const match = computeMatchScore({
                talent: t,
                shootType: filters.shootType,
                representationPreferred: filters.representation,
              });
              return (
                <TalentSwipeCard
                  key={t.id}
                  talent={t}
                  match={match}
                  selected={t.id === selectedId}
                  shortlisted={shortlistedIds.has(t.id)}
                  pending={pendingToggleIds.has(t.id)}
                  onSelect={() => setSelectedId(t.id)}
                  onPass={() => setPassedIds((prev) => new Set(prev).add(t.id))}
                  onShortlist={() => toggleShortlist(t.id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((t) => {
              const match = computeMatchScore({
                talent: t,
                shootType: filters.shootType,
                representationPreferred: filters.representation,
              });
              return (
                <TalentRow
                  key={t.id}
                  talent={t}
                  match={match}
                  selected={t.id === selectedId}
                  shortlisted={shortlistedIds.has(t.id)}
                  pending={pendingToggleIds.has(t.id)}
                  onSelect={() => setSelectedId(t.id)}
                  onShortlist={() => toggleShortlist(t.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      <ShortlistDrawer
        open={shortlistOpen}
        onOpenChange={setShortlistOpen}
        talents={shortlistedTalents}
        onRemove={toggleShortlist}
      />
    </div>
  );
}
