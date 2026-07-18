"use client";

import {
  AlertCircle,
  ArrowRightLeft,
  Bell,
  Briefcase,
  Check,
  CheckCheck,
  Clock,
  FileText,
  Megaphone,
  Send,
  type LucideIcon,
} from "lucide-react";

import type { NotificationItem } from "@/lib/notifications/notification-service";
import { kindMeta, notificationPreview, relativeTime } from "./inbox-format";
import styles from "./inbox.module.css";

const ICONS: Record<string, LucideIcon> = {
  Send,
  FileText,
  CheckCheck,
  Check,
  Clock,
  AlertCircle,
  Briefcase,
  ArrowRightLeft,
  Megaphone,
  Bell,
};

type Props = {
  item: NotificationItem;
  pending?: boolean;
  onOpen: (item: NotificationItem) => void;
};

export function NotificationRow({ item, pending = false, onOpen }: Props) {
  const { icon, label } = kindMeta(item.kind);
  const Icon = ICONS[icon] ?? Bell;
  const preview = notificationPreview(item);
  const unread = !item.read;

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      disabled={pending}
      data-testid="notification-row"
      data-unread={unread}
      className={`${styles.row} ${unread ? styles.rowUnread : styles.rowRead} ${pending ? styles.rowPending : ""}`}
    >
      <span className={styles.rowIcon} aria-hidden>
        <Icon size={16} strokeWidth={1.8} />
      </span>
      <span className={styles.rowBody}>
        <span className={unread ? styles.rowTitleUnread : styles.rowTitle}>{label}</span>
        {preview ? <span className={styles.rowPreview}>{preview}</span> : null}
      </span>
      <span className={styles.rowTime}>{relativeTime(item.created_at)}</span>
      {unread ? <span className={styles.unreadDot} aria-label="Unread" /> : null}
    </button>
  );
}
