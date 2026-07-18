"use client";

import { useEffect, useState } from "react";

// IPI-407 — NavSidebar unread badge. Mirrors use-operator-brands.ts: client-side
// fetch against the existing GET /api/notifications route (no new endpoint).
// Poll-on-focus only for MVP (Realtime/RT1 is explicitly out of scope — IPI-401).
export const NOTIFICATIONS_UPDATED_EVENT = "ipix:notifications-updated";

// list_notifications caps a single page at `limit` and signals more pages
// via next_cursor — it never reports a total count. `count` here is only
// "how many came back in this page" and must never be compared against a
// cap on its own (fetching limit=50 makes count > 50 impossible by
// construction); `hasMore` — non-null next_cursor — is the real "50+" signal.
export type UnreadBadgeState = { count: number; hasMore: boolean };

async function fetchUnreadState(): Promise<UnreadBadgeState> {
  const res = await fetch("/api/notifications?unread_only=true&limit=50");
  if (!res.ok) return { count: 0, hasMore: false };
  const body = (await res.json()) as { items?: unknown[]; next_cursor?: string | null };
  return {
    count: Array.isArray(body.items) ? body.items.length : 0,
    hasMore: body.next_cursor != null,
  };
}

export function useUnreadNotifications(): UnreadBadgeState {
  const [state, setState] = useState<UnreadBadgeState>({ count: 0, hasMore: false });

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      fetchUnreadState().then((next) => {
        if (!cancelled) setState(next);
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
    };
  }, []);

  return state;
}
