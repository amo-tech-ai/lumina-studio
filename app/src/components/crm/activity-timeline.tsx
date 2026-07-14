import type { LucideIcon } from "lucide-react";
import { Calendar, CheckSquare, Mail, Phone, Sparkles, StickyNote } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { deriveTaskState } from "@/lib/crm/activity-state";
import type { ActivityRow } from "@/lib/crm/queries";

import styles from "./activity-timeline.module.css";

const TYPE_ICON: Record<string, LucideIcon> = {
  note: StickyNote,
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: CheckSquare,
  ai_summary: Sparkles,
};

const TYPE_LABEL: Record<string, string> = {
  note: "Note",
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  task: "Task",
  ai_summary: "AI summary",
};

// `type` is generated as a plain string (Supabase doesn't reflect CHECK constraints as
// literal unions), so an unrecognized value falls back rather than crashing — same
// guarded-lookup approach as status-tokens.ts's crmStatusLabel/crmStatusDotToken.
function iconFor(type: string): LucideIcon {
  return TYPE_ICON[type] ?? StickyNote;
}
function labelFor(type: string): string {
  return TYPE_LABEL[type] ?? "Activity";
}

// ponytail: pin to a fixed locale/UTC (matches formatShootDate's fix) so SSR
// and client hydration render the same string regardless of the server's or
// browser's local locale/timezone — raw toLocaleString() would mismatch.
// timeZoneName labels it explicitly ("... UTC") so a non-UTC reader isn't
// silently shown the wrong wall-clock time as if it were their own.
function formatActivityTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

type Props = {
  activities: ActivityRow[];
  emptyHeading?: string;
  emptyBody?: string;
};

/** Generic activity timeline shared across Company/Contact/Deal detail (IPI-391/392/396).
 *  Presentational only — the caller fetches via listActivities(anchor, client) and passes
 *  the rows in, so this has no Supabase dependency and no loading/error state of its own
 *  (the caller's fetch already owns those via ErrorState before this ever renders). */
export function ActivityTimeline({
  activities,
  emptyHeading = "No activity yet",
  emptyBody = "Notes, calls, and updates will appear here.",
}: Props) {
  if (activities.length === 0) {
    return <EmptyState heading={emptyHeading} body={emptyBody} icon={<StickyNote aria-hidden />} />;
  }

  return (
    <ol className={styles.timeline} data-testid="activity-timeline">
      {activities.map((activity, i) => {
        const Icon = iconFor(activity.type);
        const taskState =
          activity.type === "task" ? deriveTaskState(activity.due_at, activity.completed_at) : null;
        return (
          <li key={activity.id} className={styles.row}>
            <div className={styles.dotCol} aria-hidden>
              <span className={styles.iconCircle}>
                <Icon size={14} />
              </span>
              {i < activities.length - 1 ? <span className={styles.line} /> : null}
            </div>
            <div className={styles.body}>
              <div className={styles.meta}>
                <span className={styles.typeLabel}>{labelFor(activity.type)}</span>
                {taskState ? <span className={styles.taskState}>{taskState}</span> : null}
              </div>
              {activity.body ? <p className={styles.text}>{activity.body}</p> : null}
              <time className={styles.time} dateTime={activity.created_at}>
                {formatActivityTime(activity.created_at)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
