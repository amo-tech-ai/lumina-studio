"use client";

import { useEffect, useRef, useState } from "react";

import { DEV_PREVIEW_BRANDS } from "./dev-skip-fixture";
import type { Brand } from "./nav-sidebar";

function hasDevFixture(brands: Brand[]): boolean {
  return (
    brands.length === DEV_PREVIEW_BRANDS.length &&
    brands.every((b, i) => b.id === DEV_PREVIEW_BRANDS[i]?.id)
  );
}

async function fetchBrands(): Promise<Brand[]> {
  const res = await fetch("/api/brands");
  if (!res.ok) return [];
  const list = (await res.json()) as Brand[];
  return Array.isArray(list) ? list : [];
}

export function useOperatorBrands(devSkip: boolean) {
  const [brands, setBrands] = useState<Brand[]>(() =>
    devSkip ? [...DEV_PREVIEW_BRANDS] : [],
  );
  const [brandsLoading, setBrandsLoading] = useState(() => !devSkip);
  const brandsRef = useRef<Brand[]>(brands);
  const brandsLoadingRef = useRef(brandsLoading);

  useEffect(() => {
    brandsRef.current = brands;
  }, [brands]);

  useEffect(() => {
    brandsLoadingRef.current = brandsLoading;
  }, [brandsLoading]);

  useEffect(() => {
    if (!devSkip) return;
    if (!hasDevFixture(brandsRef.current)) {
      setBrands([...DEV_PREVIEW_BRANDS]);
    }
    if (brandsLoadingRef.current) {
      setBrandsLoading(false);
    }
  }, [devSkip]);

  useEffect(() => {
    if (devSkip) return;

    let cancelled = false;
    setBrandsLoading(true);

    fetchBrands()
      .then((list) => {
        if (!cancelled) setBrands(list);
      })
      .catch(() => {
        if (!cancelled) setBrands([]);
      })
      .finally(() => {
        if (!cancelled) setBrandsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [devSkip]);

  return { brands, brandsLoading, brandsRef, brandsLoadingRef };
}
