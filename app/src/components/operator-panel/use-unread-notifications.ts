"use client";

import { useEffect, useState } from "react";

// IPI-407 — NavSidebar unread badge. Mirrors use-operator-brands.ts: client-side
// fetch against the existing GET /api/notifications route (no new endpoint).
// Poll-on-focus only for MVP (Realtime/RT1 is explicitly out of scope — IPI-401).
export const NOTIFICATIONS_UPDATED_EVENT = "ipix:notifications-updated";

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch("/api/notifications?unread_only=true&limit=50");
  if (!res.ok) return 0;
  const body = (await res.json()) as { items?: unknown[] };
  return Array.isArray(body.items) ? body.items.length : 0;
}

export function useUnreadNotifications(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      fetchUnreadCount().then((n) => {
        if (!cancelled) setCount(n);
      });
    };

    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
    };
  }, []);

  return count;
}
