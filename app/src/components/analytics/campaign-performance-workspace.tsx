"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Download, Info, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveBrand } from "@/context/active-brand-context";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CampaignPerformancePayload, CampaignPerformanceRow } from "@/lib/analytics";
import { campaignStatusLabel, campaignStatusDot, type CampaignStatus } from "@/lib/campaigns";

type LoadState = CampaignPerformancePayload | null;

export function CampaignPerformanceWorkspace() {
  const { activeBrandId } = useActiveBrand();
  const searchParams = useSearchParams();
  const selectedCampaignId = searchParams.get("c");
  
  const [data, setData] = useState<LoadState>(null);
  const [error, setError] = useState<string | null>(null);
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
      setData(null);
      setError(null);
      return;
    }
    setError(null);
    setData(null);
    try {
      const campaignsRes = await supabase
        .from("campaigns")
        .select("id,name,status,brand_id,org_id")
        .eq("brand_id", activeBrandId)
        .order("created_at", { ascending: false });

      if (campaignsRes.error) throw new Error(campaignsRes.error.message);
      if (loadGen.current !== gen) return;

      const campaigns = (campaignsRes.data ?? []).map((row: any) => ({
        campaignId: row.id,
        name: row.name,
        status: row.status,
        brandId: row.brand_id,
        orgId: row.org_id,
      })) as CampaignPerformanceRow[];
      const payload: CampaignPerformancePayload = { campaigns };
      setData(payload);
    } catch (e) {
      if (loadGen.current !== gen) return;
      setError(e instanceof Error ? e.message : "Failed to load campaign data.");
      setData(null);
    }
  }

  useEffect(() => {
    load();
  }, [activeBrandId]);

  const needsBrand = !activeBrandId;
  const isLoading = !needsBrand && data === null && !error;
  const isError = !!error && !needsBrand;
  const isNoData =
    !needsBrand &&
    !isLoading &&
    !isError &&
    data !== null &&
    data.campaigns.length === 0;

  const selectedCampaign = selectedCampaignId
    ? data?.campaigns.find((c) => c.campaignId === selectedCampaignId)
    : null;

  // Validate selected campaign belongs to active brand
  const validSelectedCampaign =
    selectedCampaign && selectedCampaign.brandId === activeBrandId
      ? selectedCampaign
      : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--color-bg-page, #fff)" }}>
      <style>{`@media(max-width:1180px){.kpirow{grid-template-columns:repeat(3,1fr)!important}.chartgrid{grid-template-columns:1fr!important}}@media(max-width:1024px){.kpirow{grid-template-columns:repeat(2,1fr)!important}.chartgrid{grid-template-columns:1fr!important}}@media(max-width:390px){.campaign-name{flex:0 1 150px;min-width:0}}`}</style>
      
      <div style={{ flexShrink: 0, padding: "24px 40px 0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: 8 }}>
            <Link href="/app/analytics" style={{ color: "var(--color-text-secondary)", textDecoration: "none" }}>Analytics</Link>
            <ChevronRight width="14" height="14" />
            <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>Campaign performance</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-.01em" }}>Campaign performance</h1>
              <p style={{ margin: "5px 0 0", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                {needsBrand ? "Select a brand to view campaigns" : isLoading ? "Loading campaigns…" : isError ? "Couldn't load campaigns" : `Compare ${data?.campaigns.length || 0} campaigns`}
              </p>
            </div>
            <button
              title="Export report"
              aria-label="Export report"
              disabled
              style={{
                height: 40,
                padding: "0 16px",
                border: "1px solid var(--color-border)",
                borderRadius: "0.625rem",
                background: "var(--color-bg-card)",
                color: "var(--color-text-primary)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "not-allowed",
                opacity: 0.6,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Download width="15" height="15" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 40px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          {needsBrand ? (
            <EmptyState heading="Select a brand" body="Choose a brand above to view its campaign performance." />
          ) : isLoading ? (
            <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "18px 20px", background: "var(--color-bg-card)", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 15 }}>
                <div><div style={{ fontSize: "0.875rem", fontWeight: 600 }}>All campaigns</div><div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 3 }}>Click a campaign to drill in</div></div>
              </div>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 11px", border: "1px solid var(--color-border)", borderRadius: 12, marginBottom: 8 }}>
                  <Skeleton style={{ width: 34, height: 34, borderRadius: 8 }} />
                  <div style={{ flex: "0 1 150px", minWidth: 0 }}>
                    <Skeleton style={{ height: 14, width: "70%" }} />
                    <Skeleton style={{ height: 12, width: "40%", marginTop: 4 }} />
                  </div>
                  <Skeleton style={{ flex: 1, height: 10, borderRadius: 6, minWidth: 36 }} />
                  <Skeleton style={{ width: 44, height: 16 }} />
                </div>
              ))}
            </div>
          ) : isError ? (
            <ErrorState title="Couldn't load campaign data" message={error ?? "The analytics service didn't respond."} onRetry={load} />
          ) : isNoData ? (
            <EmptyState
              heading="No campaigns"
              body="Create your first campaign to see campaign comparison."
              action={<Link href="/app/campaigns" style={{ height: 40, padding: "0 20px", border: "none", borderRadius: "0.625rem", background: "var(--color-action)", color: "var(--color-action-text)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Go to Campaigns</Link>}
            />
          ) : !data ? (
            <EmptyState heading="No campaigns yet" body="Create your first campaign to see performance comparison." />
          ) : (
            <>
              {/* CAMPAIGN LIST */}
              <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "18px 20px", background: "var(--color-bg-card)", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 15 }}>
                  <div><div style={{ fontSize: "0.875rem", fontWeight: 600 }}>All campaigns</div><div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 3 }}>Click a campaign to drill in</div></div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.campaigns.map((c: CampaignPerformanceRow) => {
                    const isSelected = validSelectedCampaign?.campaignId === c.campaignId;
                    const statusLabel = campaignStatusLabel(c.status);
                    const statusColor = campaignStatusDot(c.status);
                    return (
                      <button
                        key={c.campaignId}
                        onClick={() => {
                          const url = new URL(window.location.href);
                          if (isSelected) {
                            url.searchParams.delete("c");
                          } else {
                            url.searchParams.set("c", c.campaignId);
                          }
                          window.history.pushState({}, "", url.toString());
                        }}
                        aria-label={isSelected ? `Deselect ${c.name}` : `View ${c.name}`}
                        aria-pressed={isSelected}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 11px",
                          border: `1px solid ${isSelected ? "var(--color-border-focus)" : "var(--color-border)"}`,
                          borderRadius: 12,
                          background: isSelected ? "var(--color-bg-subtle)" : "var(--color-bg-card)",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-muted)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="campaign-name" style={{ flex: "0 1 150px", minWidth: 0 }}>
                          <div style={{ fontSize: "0.875rem", fontWeight: isSelected ? 600 : 500, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                          <div style={{ fontSize: "0.75rem", color: statusColor, fontWeight: 500, marginTop: 2 }}>{statusLabel}</div>
                        </div>
                        <div style={{ flex: "1 1 auto", height: 10, borderRadius: 6, background: "var(--color-bg-muted)", overflow: "hidden", minWidth: 36 }}>
                          <span style={{ display: "block", height: "100%", width: "0%", background: "var(--color-action)", borderRadius: 6 }} />
                        </div>
                        <span className="mono" style={{ width: 44, textAlign: "right", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", flexShrink: 0 }}>—</span>
                        <ChevronRight width="16" height="16" style={{ color: isSelected ? "var(--color-text-primary)" : "var(--color-text-muted)", flexShrink: 0 }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SELECTED CAMPAIGN DETAIL */}
              {validSelectedCampaign && (
                <>
                  <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: 20, background: "var(--color-bg-card)", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                      <div style={{ width: 74, height: 74, borderRadius: "var(--image-radius-sm, 0.75rem)", border: "1px solid var(--color-border)", background: "var(--color-bg-muted)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "1.5rem", fontWeight: 600 }}>
                        {validSelectedCampaign.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>{validSelectedCampaign.name}</h2>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 22, padding: "0 9px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, background: "var(--color-bg-muted)", color: campaignStatusDot(validSelectedCampaign.status) }}>
                            {campaignStatusLabel(validSelectedCampaign.status)}
                          </span>
                        </div>
                        <p style={{ margin: "5px 0 0", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>ID: {validSelectedCampaign.campaignId}</p>
                      </div>
                      <button
                        title="Explain performance"
                        disabled
                        style={{
                          height: 38,
                          padding: "0 15px",
                          border: "1px solid var(--color-border)",
                          borderRadius: "0.625rem",
                          background: "var(--color-bg-card)",
                          color: "var(--color-text-primary)",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          cursor: "not-allowed",
                          opacity: 0.6,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          flexShrink: 0,
                        }}
                      >
                        <Info width="14" height="14" />
                        Explain
                      </button>
                    </div>
                  </div>

                  {/* PER-CAMPAIGN KPIS */}
                  <div className="kpirow" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 16 }}>
                    {[
                      { label: "Reach", value: null, note: "Unavailable" },
                      { label: "Engagement", value: null, note: "Unavailable" },
                      { label: "Spend", value: null, note: "Unavailable" },
                      { label: "Conversions", value: null, note: "Unavailable" },
                      { label: "ROI", value: null, note: "Unavailable" },
                      { label: "CPE", value: null, note: "Unavailable" },
                    ].map((k, i) => (
                      <div
                        key={i}
                        style={{
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--card-radius)",
                          padding: "14px 15px",
                          background: "var(--color-bg-card)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 9,
                        }}
                      >
                        <span style={{ fontSize: "var(--fs-xs)", fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--color-text-muted)", lineHeight: 1.3 }}>{k.label}</span>
                        <span className="mono" style={{ fontSize: "var(--fs-2xl)", fontWeight: 700, lineHeight: 1, color: "var(--color-text-primary)" }}>—</span>
                        <span style={{ fontSize: "var(--fs-xs)", color: "var(--color-text-muted)" }}>{k.note}</span>
                      </div>
                    ))}
                  </div>

                  {/* CHART ROW */}
                  <div className="chartgrid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "18px 20px", background: "var(--color-bg-card)" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                        <div><div style={{ fontSize: "0.875rem", fontWeight: 600 }}>Engagement over time</div><div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 3 }}>{validSelectedCampaign.name} · daily rate</div></div>
                      </div>
                      <div style={{ height: 130, background: "var(--color-bg-muted)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                        Trend data unavailable
                      </div>
                    </div>
                    <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "18px 20px", background: "var(--color-bg-card)" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                        <div><div style={{ fontSize: "0.875rem", fontWeight: 600 }}>Top assets</div><div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 3 }}>By engagement · DNA shown</div></div>
                      </div>
                      <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                        Asset data unavailable
                      </div>
                    </div>
                  </div>

                  {/* AI INSIGHTS */}
                  <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "18px 20px", background: "var(--color-bg-card)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--color-bg-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Sparkles width="13" height="13" style={{ color: "var(--color-text-secondary)" }} />
                      </span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>AI insights · {validSelectedCampaign.name}</span>
                    </div>
                    <div style={{ padding: "40px 0", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                      Insights unavailable — requires campaign metrics
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
