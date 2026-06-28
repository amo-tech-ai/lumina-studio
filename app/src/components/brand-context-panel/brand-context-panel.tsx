"use client";

// IPI-218 — Right panel: shows brand profile + DNA scores for the active brand.
// Fetches on brandId change; handles loading / error / empty states.

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

export function BrandContextPanel({ brandId }: { brandId: string }) {
  const [data, setData] = useState<BrandDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  return (
    <aside className={styles.panel} aria-label="Brand context">
      {loading && <p className={styles.state}>Loading…</p>}
      {!loading && (error || !data) && (
        <p className={styles.state}>Brand unavailable</p>
      )}
      {!loading && data && <BrandView data={data} />}
    </aside>
  );
}

function BrandView({ data: { brand, scores } }: { data: BrandDetail }) {
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
              {pillars.map(([key, value]) => (
                <div key={key} className={styles.pillar}>
                  <div className={styles.pillarRow}>
                    <span className={styles.pillarName}>{key}</span>
                    <span className={styles.pillarScore}>{Math.round(value)}</span>
                  </div>
                  <div className={styles.bar}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                    />
                  </div>
                </div>
              ))}
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
    </>
  );
}
