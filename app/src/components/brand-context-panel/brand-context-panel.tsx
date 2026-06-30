"use client";

// IPI-218 — Right panel: shows brand profile + DNA scores for the active brand.
// IPI-219 — Asset thumbnail grid below DNA scores.

import { useEffect, useState } from "react";
import styles from "./brand-context-panel.module.css";

interface BrandRow {
  id: string;
  name: string;
  status: string;
  profile: { summary?: string } | null;
}

interface ScoresRow {
  scores: Record<string, number> | null;
  confidence: number | null;
}

interface BrandDetail {
  brand: BrandRow;
  scores: ScoresRow | null;
}

function dnaBarTier(score: number): "high" | "mid" | "low" {
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

interface AssetRow {
  id: string;
  cloudinary_public_id: string | null;
  thumb_url: string | null;
  status: string;
  dna_status: string | null;
}

interface AssetsPayload {
  assets: AssetRow[];
  total: number;
}

const DNA_BADGE: Record<string, string> = { approved: "✓", review: "!", blocked: "✗" };

export function BrandContextPanel({ brandId }: { brandId: string }) {
  const [data, setData] = useState<BrandDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [assetsPayload, setAssetsPayload] = useState<AssetsPayload | null>(null);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetsError, setAssetsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setData(null);
    fetch(`/api/brands/${brandId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<BrandDetail>;
      })
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [brandId]);

  useEffect(() => {
    const controller = new AbortController();
    setAssetsLoading(true);
    setAssetsError(false);
    setAssetsPayload(null);
    fetch(`/api/brands/${brandId}/assets`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<AssetsPayload>;
      })
      .then((d) => {
        if (!controller.signal.aborted) { setAssetsPayload(d); setAssetsLoading(false); }
      })
      .catch((err) => {
        if (err.name !== "AbortError") { setAssetsError(true); setAssetsLoading(false); }
      });
    return () => controller.abort();
  }, [brandId]);

  return (
    <aside className={styles.panel} aria-label="Brand context">
      {loading && <p className={styles.state}>Loading…</p>}
      {!loading && (error || !data) && (
        <p className={styles.state}>Brand unavailable</p>
      )}
      {!loading && data && (
        <BrandView
          data={data}
          assetsPayload={assetsPayload}
          assetsLoading={assetsLoading}
          assetsError={assetsError}
        />
      )}
    </aside>
  );
}

function BrandView({
  data: { brand, scores },
  assetsPayload,
  assetsLoading,
  assetsError,
}: {
  data: BrandDetail;
  assetsPayload: AssetsPayload | null;
  assetsLoading: boolean;
  assetsError: boolean;
}) {
  const pillars = scores?.scores
    ? Object.entries(scores.scores).filter(([, v]) => typeof v === "number")
    : [];

  return (
    <>
      <div className={styles.header}>
        <h2 className={styles.name}>{brand.name}</h2>
        <span className={styles.badge} data-status={brand.status}>
          {brand.status}
        </span>
      </div>

      {pillars.length > 0 && (
        <>
          <hr className={styles.divider} />
          <section>
            <h3 className={styles.sectionTitle}>DNA Scores</h3>
            <div className={styles.pillars}>
              {pillars.map(([key, value]) => {
                const score = Math.round(value);
                return (
                <div key={key} className={styles.pillar}>
                  <div className={styles.pillarRow}>
                    <span className={styles.pillarName}>{key}</span>
                    <span className={styles.pillarScore}>{score}</span>
                  </div>
                  <div className={styles.bar}>
                    <div
                      className={styles.barFill}
                      data-tier={dnaBarTier(score)}
                      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                    />
                  </div>
                </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {brand.profile?.summary && (
        <>
          <hr className={styles.divider} />
          <section>
            <h3 className={styles.sectionTitle}>Profile</h3>
            <p className={styles.summary}>{brand.profile.summary}</p>
          </section>
        </>
      )}

      <hr className={styles.divider} />
      <AssetGrid
        payload={assetsPayload}
        loading={assetsLoading}
        error={assetsError}
      />
    </>
  );
}

function AssetGrid({
  payload,
  loading,
  error,
}: {
  payload: AssetsPayload | null;
  loading: boolean;
  error: boolean;
}) {
  const total = payload?.total ?? 0;
  const assets = payload?.assets ?? [];

  return (
    <section>
      <h3 className={styles.sectionTitle}>
        Assets{!loading ? ` (${total})` : ""}
      </h3>
      {total > 6 && !loading && (
        <p className={styles.assetSubLabel}>showing latest 6 of {total}</p>
      )}

      {loading && (
        <div className={styles.assetGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${styles.assetThumb} ${styles.skeleton}`} />
          ))}
        </div>
      )}

      {!loading && error && <p className={styles.state}>Assets unavailable</p>}

      {!loading && !error && assets.length === 0 && (
        <p className={styles.state}>No assets yet</p>
      )}

      {!loading && !error && assets.length > 0 && (
        <div className={styles.assetGrid}>
          {assets.map((asset, i) => (
            <div key={asset.id} className={styles.assetThumb}>
              {asset.thumb_url ? (
                <img
                  src={asset.thumb_url}
                  alt={`Brand asset ${i + 1}`}
                  className={styles.assetImg}
                />
              ) : (
                <div className={styles.assetPlaceholder} aria-hidden="true" />
              )}
              {asset.dna_status && DNA_BADGE[asset.dna_status] && (
                <span
                  className={styles.dnaBadge}
                  data-status={asset.dna_status}
                  aria-label={asset.dna_status}
                >
                  {DNA_BADGE[asset.dna_status]}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
