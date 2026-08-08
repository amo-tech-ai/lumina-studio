"use client";

// IPI-924 · AGENT-RAG-001 — "Similar brands" card on the brand detail page.
// Client-side caller for GET /api/brands/[id]/similar (the org-scoped
// public.search_brands RPC is service_role-only, so the browser must go through
// the API route). Handles loading, no embedding yet (0/5832 live), no matches,
// error, and the success list with similarity % and shared-DNA chips.

import { useEffect, useState } from "react";
import Link from "next/link";

import styles from "./brand-detail.module.css";

type SimilarBrand = {
  brand_id: string;
  brand_name: string;
  similarity: number;
  shared_nodes: unknown;
};

type FetchState =
  | { status: "loading" }
  | { status: "no_embedding" }
  | { status: "error" }
  | { status: "ready"; results: SimilarBrand[] };

function sharedNodeChips(sharedNodes: unknown): string[] {
  if (!Array.isArray(sharedNodes)) return [];
  return sharedNodes.filter((n): n is string => typeof n === "string").slice(0, 4);
}

export function SimilarBrandsSection({ brandId }: { brandId: string }) {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/brands/${brandId}/similar`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setState({ status: "error" });
          return;
        }
        const body = (await res.json()) as { data?: SimilarBrand[]; reason?: string };
        if (body.reason === "no_embedding") {
          setState({ status: "no_embedding" });
          return;
        }
        setState({ status: "ready", results: body.data ?? [] });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  return (
    <section className={styles.card} aria-label="Similar brands">
      <div className={styles.cardEyebrow}>
        <span className={styles.cardEyebrowDot} aria-hidden />
        <span className={styles.cardEyebrowLabel}>Similar brands</span>
      </div>

      {state.status === "loading" ? (
        <p className={styles.cardBody}>Finding similar brands…</p>
      ) : null}

      {state.status === "no_embedding" ? (
        <p className={styles.cardBody}>
          Similar brands will appear here once this brand has an AI embedding.
        </p>
      ) : null}

      {state.status === "error" ? (
        <p className={styles.cardBody}>Couldn&apos;t load similar brands right now.</p>
      ) : null}

      {state.status === "ready" && state.results.length === 0 ? (
        <p className={styles.cardBody}>No similar brands in your workspace yet.</p>
      ) : null}

      {state.status === "ready" && state.results.length > 0 ? (
        <ul className={styles.similarList}>
          {state.results.map((r) => {
            const chips = sharedNodeChips(r.shared_nodes);
            return (
              <li key={r.brand_id} className={styles.similarItem}>
                <div className={styles.similarRow}>
                  <Link href={`/app/brand/${r.brand_id}`} className={styles.similarName}>
                    {r.brand_name}
                  </Link>
                  <span className={styles.similarScore}>
                    {Math.round(r.similarity * 100)}% similar
                  </span>
                </div>
                {chips.length > 0 ? (
                  <div className={styles.chipRow}>
                    {chips.map((node) => (
                      <span key={node} className={styles.similarChip}>
                        {node}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
