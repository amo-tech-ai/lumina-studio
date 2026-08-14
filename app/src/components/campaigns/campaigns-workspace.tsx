"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveBrand } from "@/context/active-brand-context";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  CAMPAIGN_FILTERS,
  CAMPAIGN_FILTER_LABELS,
  campaignCountLabel,
  matchesCampaignFilter,
  type CampaignFilter,
  type CampaignRow,
  type DeliverableRow,
} from "@/lib/campaigns";

import { CampaignCard } from "./campaign-card";
import { useCampaignsContext } from "./campaigns-context";

export function CampaignsWorkspace() {
  useCampaignsContext();
  const { activeBrandId } = useActiveBrand();

  const [campaigns, setCampaigns] = useState<CampaignRow[] | null>(null);
  const [deliverablesByCampaign, setDeliverablesByCampaign] = useState<Map<string, DeliverableRow[]>>(
    () => new Map(),
  );
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CampaignFilter>("all");
  const loadGen = useRef(0);

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  async function load() {
    const gen = ++loadGen.current;
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }
    if (!activeBrandId) {
      setCampaigns([]);
      setDeliverablesByCampaign(new Map());
      setError(null);
      return;
    }
    setError(null);
    setCampaigns(null);
    try {
      const q = supabase.from("campaigns").select("*").eq("brand_id", activeBrandId).order("created_at", { ascending: false });
      const { data: camps, error: cErr } = await q;
      if (cErr) throw new Error(cErr.message);
      const rows = (camps ?? []) as CampaignRow[];
      if (loadGen.current !== gen) return;
      if (rows.length === 0) {
        setCampaigns(rows);
        setDeliverablesByCampaign(new Map());
        return;
      }
      const ids = rows.map((r) => r.id);
      const { data: delivs, error: dErr } = await supabase
        .from("campaign_deliverables")
        .select("*")
        .in("campaign_id", ids);
      if (dErr) throw new Error(dErr.message);
      if (loadGen.current !== gen) return;
      const map = new Map<string, DeliverableRow[]>();
      for (const d of (delivs ?? []) as DeliverableRow[]) {
        const arr = map.get(d.campaign_id) ?? [];
        arr.push(d);
        map.set(d.campaign_id, arr);
      }
      setCampaigns(rows);
      setDeliverablesByCampaign(map);
    } catch (e) {
      if (loadGen.current !== gen) return;
      setError(e instanceof Error ? e.message : "Failed to load campaigns.");
      setCampaigns([]);
    }
  }

  useEffect(() => {
    load();
  }, [activeBrandId]);

  const filtered = useMemo(() => {
    if (!campaigns) return null;
    const q = search.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (!matchesCampaignFilter(filter, c.status)) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [campaigns, search, filter]);

  const countLabel = useMemo(() => {
    if (!campaigns) return "";
    return campaignCountLabel(campaigns);
  }, [campaigns]);

  const needsBrand = !activeBrandId;
  const isLoading = !needsBrand && campaigns === null && !error;
  const isEmpty = !needsBrand && campaigns !== null && campaigns.length === 0 && !error;
  const isError = !!error && !needsBrand;
  const isFilteredEmpty = !needsBrand && filtered !== null && filtered.length === 0 && !isLoading && !isError && !isEmpty;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--color-bg-page, #fff)" }}>
      <style>{`@media(max-width:1280px){.cgrid{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:1024px){.cgrid{grid-template-columns:1fr!important}}`}</style>
      <div style={{ flexShrink: 0, padding: "28px 40px 0" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-.01em" }}>Campaigns</h1>
              <p style={{ margin: "5px 0 0", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                {needsBrand ? "Select a brand to view campaigns" : isLoading ? "Loading campaigns…" : isError ? "Couldn’t load campaigns" : countLabel}
              </p>
            </div>
            <button
              type="button"
              disabled
              title="New campaign — coming soon"
              aria-disabled="true"
              style={{
                height: 40,
                padding: "0 18px",
                border: "none",
                borderRadius: "0.625rem",
                background: "var(--color-text-muted)",
                color: "var(--color-bg-card)",
                fontSize: "0.875rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "not-allowed",
                opacity: 0.7,
              }}
            >
              + New campaign
            </button>
          </div>

          {!needsBrand && !isEmpty && !isError ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <label
                  htmlFor="campaign-search"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    flex: 1,
                    minWidth: 200,
                    height: 40,
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.625rem",
                    padding: "0 13px",
                  }}
                >
                  <Search size={16} strokeWidth={2} color="var(--color-text-muted)" aria-hidden="true" />
                  <span className="sr-only">Search campaigns</span>
                  <input
                    id="campaign-search"
                    aria-label="Search campaigns"
                    placeholder="Search campaigns…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: "0.875rem",
                      color: "var(--color-text-primary)",
                      fontFamily: "inherit",
                    }}
                  />
                </label>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                {CAMPAIGN_FILTERS.map((f) => {
                  const active = filter === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      aria-pressed={active}
                      style={{
                        height: 32,
                        padding: "0 14px",
                        border: `1px solid ${active ? "var(--color-text-primary)" : "var(--color-border)"}`,
                        background: active ? "var(--color-text-primary)" : "var(--color-bg-card)",
                        color: active ? "#fff" : "var(--color-text-secondary)",
                        borderRadius: 999,
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {CAMPAIGN_FILTER_LABELS[f]}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 40px 24px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          {needsBrand ? (
            <EmptyState
              heading="Select a brand"
              body="Choose a brand above to view its campaigns. Campaigns are scoped to the active brand."
            />
          ) : isLoading ? (
            <div
              data-testid="campaigns-loading"
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}
              className="cgrid"
            >
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <Skeleton style={{ width: "100%", aspectRatio: "16/9", borderRadius: "1.25rem" }} />
                  <Skeleton style={{ height: 16, width: "65%", marginTop: 14 }} />
                  <Skeleton style={{ height: 11, width: "45%", marginTop: 9 }} />
                  <Skeleton style={{ height: 5, width: "100%", marginTop: 13 }} />
                </div>
              ))}
            </div>
          ) : isError ? (
            <ErrorState title="Couldn’t load campaigns" message={error ?? "Check your connection and try again."} onRetry={load} />
          ) : isEmpty ? (
            <EmptyState
              heading="No campaigns yet"
              body="Plan a campaign and I'll build the brief, shoots, and deliverable checklist from your Brand DNA."
              hint='Creative Director: "Spring is your next launch window — I can draft a campaign now."'
              action={
                <button
                  type="button"
                  disabled
                  title="New campaign — coming soon"
                  style={{
                    height: 42,
                    padding: "0 22px",
                    border: "none",
                    borderRadius: "0.625rem",
                    background: "var(--color-text-muted)",
                    color: "#fff",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: "not-allowed",
                    opacity: 0.7,
                  }}
                >
                  + New campaign
                </button>
              }
            />
          ) : isFilteredEmpty ? (
            <EmptyState
              heading="No matching campaigns"
              body={search ? `No campaigns match “${search}”.` : `No campaigns in “${CAMPAIGN_FILTER_LABELS[filter]}”.`}
              action={
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                  style={{
                    height: 38,
                    padding: "0 16px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-card)",
                    borderRadius: "0.625rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <div
              data-testid="campaigns-grid"
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}
              className="cgrid"
            >
              {filtered!.map((c) => (
                <CampaignCard key={c.id} campaign={c} deliverables={deliverablesByCampaign.get(c.id) ?? []} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
