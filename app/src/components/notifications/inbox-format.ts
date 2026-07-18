// IPI-407 — SCR-15 Notification Center. Pure formatting helpers, no React.
// `list_notifications` returns {id, kind, payload, created_at, read, deep_link} only —
// no title/preview text. Row copy is derived from `kind` here; `payload.message` (when
// present) is used verbatim as the preview line. Never invent copy the payload doesn't have.
import type { NotificationItem } from "@/lib/notifications/notification-service";

export type NotificationGroup = "today" | "yesterday" | "week" | "earlier";

export const GROUP_LABEL: Record<NotificationGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This week",
  earlier: "Earlier",
};

export const GROUP_ORDER: NotificationGroup[] = ["today", "yesterday", "week", "earlier"];

/** Icon key (matches a lucide-react export name — mapped to a component in
 *  notification-row.tsx) + label per real `kind` values seen in `public.notifications`.
 *  Unknown kinds fall back to a humanized version of the raw string — still honest, no guess. */
const KIND_META: Record<string, { icon: string; label: string }> = {
  booking_requested: { icon: "Send", label: "Booking requested" },
  booking_quoted: { icon: "FileText", label: "Booking quoted" },
  booking_confirmed: { icon: "CheckCheck", label: "Booking confirmed" },
  booking_approved: { icon: "Check", label: "Booking approved" },
  booking_expired: { icon: "Clock", label: "Booking request expired" },
  approval_request: { icon: "AlertCircle", label: "Approval requested" },
  deal_update: { icon: "Briefcase", label: "Deal updated" },
  deal_stage_changed: { icon: "ArrowRightLeft", label: "Deal stage changed" },
  campaign_milestone: { icon: "Megaphone", label: "Campaign milestone" },
};

function humanizeKind(kind: string): string {
  return kind
    .split("_")
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}

export function kindMeta(kind: string): { icon: string; label: string } {
  return KIND_META[kind] ?? { icon: "Bell", label: humanizeKind(kind) || "Notification" };
}

function payloadMessage(payload: unknown): string | null {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const message = (payload as Record<string, unknown>).message;
    if (typeof message === "string" && message.trim().length > 0) return message;
  }
  return null;
}

/** Preview line under the title — only real payload text, never fabricated. */
export function notificationPreview(item: NotificationItem): string | null {
  return payloadMessage(item.payload);
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function groupOf(iso: string, now: Date = new Date()): NotificationGroup {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "earlier";
  const today = startOfDay(now);
  const day = startOfDay(then);
  const diffDays = Math.round((today - day) / 86_400_000);
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays <= 7) return "week";
  return "earlier";
}

export function groupNotifications(
  items: NotificationItem[],
  now: Date = new Date(),
): Partial<Record<NotificationGroup, NotificationItem[]>> {
  const groups: Partial<Record<NotificationGroup, NotificationItem[]>> = {};
  for (const item of items) {
    const g = groupOf(item.created_at, now);
    (groups[g] ??= []).push(item);
  }
  return groups;
}
