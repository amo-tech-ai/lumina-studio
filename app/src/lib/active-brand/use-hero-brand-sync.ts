"use client";

import { useEffect } from "react";

import { useActiveBrand } from "@/context/active-brand-context";
import { registerCommandCenterHeroBrandSync } from "@/lib/active-brand/command-center-hero-sync";

/** Wire Command Center hero brand into ActiveBrandContext (OperatorShell only). */
export function useHeroBrandSync() {
  const { setActiveBrandId } = useActiveBrand();

  useEffect(() => {
    return registerCommandCenterHeroBrandSync((heroBrandId) => {
      if (!heroBrandId) return;
      setActiveBrandId(heroBrandId);
    });
  }, [setActiveBrandId]);
}
