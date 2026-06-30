"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";

export type BrandListItem = {
  id: string;
  name: string;
  dnaScore: number;
  intakeStatus: string | null;
};

/** IPI-260 — inject brand list context on /app/brand for brand-intelligence agent. */
export function useBrandListContext(brands: BrandListItem[]) {
  useAgentContext({
    description:
      "Brand list on /app/brand — each entry has brandId. Use setActiveBrand or navigate to /app/brand/{brandId} to focus one.",
    value: {
      view: "brand_list",
      count: brands.length,
      brands: brands.map((b) => ({
        brandId: b.id,
        name: b.name,
        dna_score: b.dnaScore,
        intake_status: b.intakeStatus,
      })),
    },
  });
}

export function BrandListContext({ brands }: { brands: BrandListItem[] }) {
  useBrandListContext(brands);
  return null;
}
