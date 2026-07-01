"use client";

import { useEffect, useRef, useState } from "react";

import { DEV_PREVIEW_BRANDS } from "./dev-skip-fixture";
import type { Brand } from "./nav-sidebar";

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
    if (devSkip) {
      const hasFixture =
        brandsRef.current.length === DEV_PREVIEW_BRANDS.length &&
        brandsRef.current.every((b, i) => b.id === DEV_PREVIEW_BRANDS[i]?.id);
      if (!hasFixture) setBrands([...DEV_PREVIEW_BRANDS]);
      if (brandsLoadingRef.current) setBrandsLoading(false);
      return;
    }

    let cancelled = false;
    setBrandsLoading(true);

    fetch("/api/brands")
      .then((r) => (r.ok ? (r.json() as Promise<Brand[]>) : Promise.resolve([])))
      .then((list) => {
        if (!cancelled) setBrands(Array.isArray(list) ? list : []);
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
