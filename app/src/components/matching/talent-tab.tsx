"use client";

// IPI-308 · MODEL-P2 — Talent tab: filters, swipe/list toggle, shortlist.
// Calls public.search_talent / get_or_create_shortlist / toggle_shortlist_item
// directly from the browser (RLS + SECURITY DEFINER RPCs enforce access —
// same pattern as other authenticated browser-client reads in this app).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
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
  const [sortBy, setSortBy] = useState<"match" | "name">("match");
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
  // Same guard for shortlist refreshes — rapid toggles fire refreshShortlist
  // repeatedly, and without this an older in-flight response can overwrite
  // the shortlist with stale state.
  const shortlistRequestId = useRef(0);

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
      const requestId = ++shortlistRequestId.current;
      const { data, error: rpcError } = await supabase.rpc("search_talent", {
        p_shoot_type: null,
        p_budget_tier: null,
        p_date_start: null,
        p_date_end: null,
        p_representation: null,
        p_only_shortlist_id: currentShortlistId,
      });
      if (requestId !== shortlistRequestId.current) return; // a newer refresh has since started
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

  const visibleRaw = talents?.filter((t) => !passedIds.has(t.id)) ?? null;
  const visible = useMemo(() => {
    if (!visibleRaw) return null;
    if (sortBy === "name") return [...visibleRaw].sort((a, b) => a.display_name.localeCompare(b.display_name));
    return [...visibleRaw].sort((a, b) => {
      const sa = computeMatchScore({ talent: a, shootType: filters.shootType, representationPreferred: filters.representation }).score;
      const sb = computeMatchScore({ talent: b, shootType: filters.shootType, representationPreferred: filters.representation }).score;
      return sb - sa;
    });
  }, [visibleRaw, sortBy, filters.shootType, filters.representation]);

  return (
    <div className="flex h-full flex-col gap-4 min-w-0">
      <div className="flex flex-wrap items-center gap-3 min-w-0">
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

        <div
          className="flex items-center gap-1.5 font-sans text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <span aria-hidden>Available</span>
          <input
            type="date"
            aria-label="Available from"
            className="rounded-md border px-2 py-1 text-xs"
            style={{ borderColor: "var(--color-border)" }}
            value={filters.dateStart ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, dateStart: e.target.value || undefined }))}
          />
          <span aria-hidden>–</span>
          <input
            type="date"
            aria-label="Available until"
            className="rounded-md border px-2 py-1 text-xs"
            style={{ borderColor: "var(--color-border)" }}
            value={filters.dateEnd ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, dateEnd: e.target.value || undefined }))}
          />
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2 min-w-0">
          {visible !== null ? (
            <span className="font-mono text-xs" style={{ color: "var(--color-text-muted)" }} data-testid="result-count">
              {visible.length} models
            </span>
          ) : null}
          {visible !== null && view === "list" && visible.length > 1 ? (
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "match" | "name")}>
              <SelectTrigger className="w-[132px]" aria-label="Sort by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Sort: Best match</SelectItem>
                <SelectItem value="name">Sort: Name A–Z</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShortlistOpen(true)}
            aria-label={`Open shortlist, ${shortlistedIds.size} items`}
          >
            Shortlist <span className="font-mono" style={{ color: "var(--color-text-muted)" }}>({shortlistedIds.size})</span>
          </Button>
          <div
            className="flex overflow-hidden rounded-md border"
            style={{ borderColor: "var(--color-border)" }}
            role="group"
            aria-label="View mode"
          >
            <Button
              type="button"
              variant={view === "swipe" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              aria-pressed={view === "swipe"}
              onClick={() => setView("swipe")}
            >
              Swipe deck
            </Button>
            <Button
              type="button"
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              Table
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" aria-live="polite">
        {error ? (
          <ErrorState message={error} onRetry={() => runSearch(filters)} retryLabel="Retry" />
        ) : visible === null ? (
          <div className={view === "swipe" ? "grid grid-cols-2 gap-3 lg:grid-cols-3" : "flex flex-col gap-2"}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className={view === "swipe" ? "aspect-[3/4] rounded-2xl" : "h-16 rounded-xl"} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            heading="No talent matches this brief yet."
            body="Try adjusting filters or clearing the date range."
            icon={<SearchX size={28} strokeWidth={1.7} aria-hidden />}
            action={
              <Button type="button" variant="outline" onClick={() => setFilters({})}>
                Adjust filters
              </Button>
            }
          />
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
                  pending={pendingToggleIds.has(t.id) || !orgId}
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
                  pending={pendingToggleIds.has(t.id) || !orgId}
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
