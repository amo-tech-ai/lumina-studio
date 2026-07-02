"use client";

import { useEffect } from "react";

import { syncCommandCenterHeroBrand } from "@/lib/active-brand/command-center-hero-sync";

/** Align IntelligencePanel with Command Center hero brand on `/app` (client-only). */
export function CommandCenterBrandSync({
  heroBrandId,
}: {
  heroBrandId: string | null;
}) {
  useEffect(() => {
    syncCommandCenterHeroBrand(heroBrandId);
  }, [heroBrandId]);

  return null;
}
