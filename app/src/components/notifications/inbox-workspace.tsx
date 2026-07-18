"use client";

import { BellOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { NOTIFICATIONS_UPDATED_EVENT } from "@/components/operator-panel/use-unread-notifications";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { NotificationItem } from "@/lib/notifications/notification-service";

import { GROUP_LABEL, GROUP_ORDER, groupNotifications } from "./inbox-format";
import styles from "./inbox.module.css";
import { NotificationRow } from "./notification-row";

type Props = {
  initialItems: NotificationItem[] | null;
  fetchError: string | null;
};

export function InboxWorkspace({ initialItems, fetchError }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>(initialItems ?? []);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  async function markRead(item: NotificationItem) {
    if (item.read || pendingIds.has(item.id)) return;

    setPendingIds((prev) => new Set(prev).add(item.id));
    // Optimistic: dot removed, row dims immediately (IPI-407 AC).
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));

    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_ids: [item.id] }),
      });
      if (!res.ok) throw new Error(`mark-read failed: ${res.status}`);
      window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
    } catch {
      // Roll back — the write didn't actually persist.
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: false } : n)));
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }

  if (fetchError) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <ErrorState message={fetchError} onRetry={() => router.refresh()} />
        </div>
      </div>
    );
  }

  const unreadCount = items.filter((n) => !n.read).length;

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <EmptyState
            heading="No notifications yet"
            body="Booking updates, approvals, and deal activity will show up here."
            icon={<BellOff size={26} strokeWidth={1.6} />}
          />
        </div>
      </div>
    );
  }

  const groups = groupNotifications(items);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.heading}>Notifications</h1>
            <p className={styles.unreadCount}>
              <span className={styles.unreadCountNumber}>{unreadCount}</span> unread
            </p>
          </div>
        </header>

        {GROUP_ORDER.map((group) => {
          const rows = groups[group];
          if (!rows || rows.length === 0) return null;
          return (
            <section key={group} className={styles.groupSection}>
              <h2 className={styles.groupLabel}>{GROUP_LABEL[group]}</h2>
              <div className={styles.groupRows}>
                {rows.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    pending={pendingIds.has(item.id)}
                    onOpen={markRead}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function InboxSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        </header>
        <div className={styles.groupRows} data-testid="inbox-skeleton">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skeletonRow}>
              <Skeleton className={styles.skeletonIcon} />
              <div className={styles.skeletonLines}>
                <Skeleton className={styles.skeletonLineWide} />
                <Skeleton className={styles.skeletonLineNarrow} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
