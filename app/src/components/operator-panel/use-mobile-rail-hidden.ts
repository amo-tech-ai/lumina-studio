"use client";

import { useEffect, useState } from "react";

/** Matches `.nav { display: none }` at max-width 768px in nav-sidebar.module.css. */
const MOBILE_RAIL_MQ = "(max-width: 768px)";

/**
 * IPI-725 — `null` until mounted (SSR / first paint), then whether the left
 * rail is the CSS-hidden mobile layout. Use so only one Sign Out control
 * exists in the DOM (Playwright strict `data-testid`).
 */
export function useMobileRailHidden(): boolean | null {
  const [hidden, setHidden] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_RAIL_MQ);
    const update = () => setHidden(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return hidden;
}
