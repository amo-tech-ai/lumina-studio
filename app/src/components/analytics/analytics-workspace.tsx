"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveBrand } from "@/context/active-brand-context";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AnalyticsPayload } from "@/lib/analytics";
import { BASE_SCORE_TYPES, computeDnaScore, type BrandScoreRow } from "@/lib/brand-scores";

type LoadState = AnalyticsPayload | null;

export function AnalyticsWorkspace() {
  const { activeBrandId } = useActiveBrand();
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
      const [liveRes, assetsRes, scoresRes] = await Promise.all([
        supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("brand_id", activeBrandId).eq("status", "live"),
        supabase.from("assets").select("id,dna_score").eq("brand_id", activeBrandId).in("status", ["approved", "final"]),
        supabase.from("brand_scores").select("score_type,score").eq("brand_id", activeBrandId),
      ]);
      if (liveRes.error) throw new Error(liveRes.error.message);
      if (assetsRes.error) throw new Error(assetsRes.error.message);
      if (scoresRes.error) throw new Error(scoresRes.error.message);
      if (loadGen.current !== gen) return;

      const campaignsLive = liveRes.count ?? 0;

      const assets = (assetsRes.data ?? []) as { dna_score: number | null }[];
      const assetsPublished = assetsRes.count ?? assets.length;
      const avgAssetMatch =
        assets.length === 0
          ? null
          : (() => {
              const vals = assets.map((a) => a.dna_score).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
              if (vals.length === 0) return null;
              return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100;
            })();

      const scores = (scoresRes.data ?? []) as BrandScoreRow[];
      const hasAllBase = BASE_SCORE_TYPES.every((t) => scores.some((s) => s.score_type === t && typeof s.score === "number" && Number.isFinite(s.score)));
      const avgBrandDna = hasAllBase ? computeDnaScore(scores) : null;

      const payload: AnalyticsPayload = {
        campaignsLive,
        assetsPublished,
        avgBrandDna,
        avgAssetMatch,
        reach: null,
        engagementRate: null,
        ctr: null,
        conversions: null,
        cpe: null,
        aiActionsApproved: null,
        approvalTurnaroundDays: null,
      };
      setData(payload);
    } catch (e) {
      if (loadGen.current !== gen) return;
      setError(e instanceof Error ? e.message : "Failed to load analytics.");
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
    data.campaignsLive === 0 &&
    data.assetsPublished === 0 &&
    data.avgBrandDna === null &&
    data.avgAssetMatch === null;

  const kpis = data
    ? [
        { key: "dna", label: "Avg Brand DNA", value: data.avgBrandDna, fmt: (v: number) => String(v) },
        { key: "live", label: "Campaigns live", value: data.campaignsLive, fmt: (v: number) => String(v) },
        { key: "assets", label: "Assets published", value: data.assetsPublished, fmt: (v: number) => String(v) },
        { key: "match", label: "Avg asset match", value: data.avgAssetMatch, fmt: (v: number) => `${v}%` },
        { key: "ai", label: "AI actions approved", value: data.aiActionsApproved, fmt: (v: number) => String(v) },
        { key: "turn", label: "Approval turnaround", value: data.approvalTurnaroundDays, fmt: (v: number) => `${v}d` },
      ]
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "var(--color-bg-page, #fff)" }}>
      <style>{`@media(max-width:1180px){.kpirow{grid-template-columns:repeat(3,1fr)!important}}@media(max-width:640px){.kpirow{grid-template-columns:repeat(2,1fr)!important}}`}</style>
      <div style={{ flexShrink: 0, padding: "28px 40px 0" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-.01em" }}>Analytics</h1>
              <p style={{ margin: "5px 0 0", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                {needsBrand ? "Select a brand to view analytics" : isLoading ? "Loading analytics…" : isError ? "Couldn’t load analytics" : "Trusted overview"}
              </p>
            </div>
            <a
              href="/app/analytics/campaigns"
              style={{
                height: 40,
                padding: "0 14px",
                border: "1px solid var(--color-border)",
                borderRadius: "0.625rem",
                background: "var(--color-bg-card)",
                color: "var(--color-text-primary)",
                fontSize: "0.875rem",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
              }}
              style-hover={{ border: "1px solid var(--color-border-strong)" }}
            >
              Compare campaigns →
            </a>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 40px 24px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          {needsBrand ? (
            <EmptyState heading="Select a brand" body="Choose a brand above to view its analytics. Data is scoped to the active brand." />
          ) : isLoading ? (
            <div data-testid="analytics-loading" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }} className="kpirow">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: 15 }}>
                  <Skeleton style={{ height: 10, width: "60%" }} />
                  <Skeleton style={{ height: 26, width: "70%", marginTop: 12 }} />
                </div>
              ))}
            </div>
          ) : isError ? (
            <ErrorState title="Couldn’t load analytics" message={error ?? "Check your connection and try again."} onRetry={load} />
          ) : isNoData ? (
            <EmptyState heading="No analytics yet" body="Publish a campaign and its assets to see performance, DNA trends, and AI activity here." />
          ) : !data ? (
            <EmptyState heading="No analytics yet" body="Publish a campaign and its assets to see performance, DNA trends, and AI activity here." />
          ) : (
            <>
              <div data-testid="analytics-kpis" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 16 }} className="kpirow">
                {kpis.map((k) => {
                  const isNull = k.value === null;
                  return (
                    <div
                      key={k.key}
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
                      <span className="mono" style={{ fontSize: "var(--fs-2xl)", fontWeight: 700, lineHeight: 1, color: "var(--color-text-primary)" }}>
                        {isNull ? "—" : k.fmt(k.value as number)}
                      </span>
                      <span style={{ fontSize: "var(--fs-xs)", color: "var(--color-text-muted)" }}>{isNull ? "Unavailable" : "Verified"}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: 16, background: "var(--color-bg-card)", marginBottom: 16 }}>
                <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>Campaign performance</div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--color-text-muted)", marginTop: 3 }}>Campaign comparison</div>
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <a
                    href="/app/analytics/campaigns"
                    style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--color-text-primary)", textDecoration: "none" }}
                  >
                    Open Campaign Performance →
                  </a>
                </div>
              </div>

              <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: 16, background: "var(--color-bg-card)" }}>
                <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>Brand DNA over time</div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--color-text-muted)", marginTop: 3 }}>Overall score · last 7 periods — canonical computeDnaScore</div>
                <div style={{ marginTop: 12, height: 112, background: "var(--color-bg-muted)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "var(--fs-sm)" }}>
                  No history yet — Brand DNA history unavailable
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
