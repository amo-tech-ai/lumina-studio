"use client";

import { useState } from "react";

import styles from "./brand-detail.module.css";

type SharedNode = {
  node_type?: string;
  label?: string;
};

type SimilarBrand = {
  brand_id: string;
  brand_name: string;
  shared_nodes: unknown;
  similarity: number;
};

type SimilarBrandsResponse = {
  similar?: SimilarBrand[];
  notice?: string;
  error?: string;
};

function sharedLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((node) => (node && typeof node === "object" ? (node as SharedNode).label : undefined))
    .filter((label): label is string => Boolean(label));
}

export function SimilarBrandsSection({ brandId }: { brandId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [similar, setSimilar] = useState<SimilarBrand[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  async function findSimilarBrands() {
    setState("loading");
    setNotice(null);

    try {
      const response = await fetch(`/api/brand/${brandId}/similar`, {
        method: "GET",
        credentials: "same-origin",
      });
      const payload = (await response.json()) as SimilarBrandsResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Unable to find similar brands");
      }

      setSimilar(payload.similar ?? []);
      setNotice(payload.notice ?? null);
      setState("success");
    } catch (error) {
      console.error("[similar-brands] request failed:", error);
      setSimilar([]);
      setState("error");
    }
  }

  return (
    <section className={styles.card} aria-label="Similar brands">
      <div className={styles.cardEyebrow}>
        <span className={styles.cardEyebrowLabel}>Similar brands</span>
      </div>
      <p className={styles.cardBody}>
        Find brands in your organization with the closest Brand Intelligence embedding.
      </p>

      <div className={styles.chipRow}>
        <button
          type="button"
          className={styles.chip}
          onClick={findSimilarBrands}
          disabled={state === "loading"}
        >
          {state === "loading" ? "Finding similar brands…" : "Find similar brands"}
        </button>
      </div>

      {state === "error" ? (
        <p className={styles.cardBody} role="alert">
          Similar brands could not be loaded. Try again.
        </p>
      ) : null}

      {state === "success" && similar.length === 0 ? (
        <p className={styles.cardBody}>
          {notice === "no-embeddings"
            ? "No brand embeddings are available yet. Re-run Brand Intelligence after embeddings are enabled."
            : "No similar brands were found in this organization."}
        </p>
      ) : null}

      {similar.map((brand) => {
        const labels = sharedLabels(brand.shared_nodes);
        return (
          <div key={brand.brand_id}>
            <p className={styles.cardBody}>
              <strong>{brand.brand_name}</strong> · {Math.round(brand.similarity * 100)}% similar
            </p>
            {labels.length > 0 ? (
              <div className={styles.chipRow} aria-label={`${brand.brand_name} shared traits`}>
                {labels.map((label) => (
                  <span key={`${brand.brand_id}-${label}`} className={styles.chip}>
                    {label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
