"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { GanttChart, LayoutGrid, CalendarRange, List as ListIcon } from "lucide-react";

import { setViewConfigAction } from "@/app/(operator)/app/planner/[instanceId]/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PersistedViewType, PlannerTask, ViewType } from "@/lib/planner/types";

import { AdaptivePanel } from "./adaptive-panel";
import { NowNextBar } from "./now-next-bar";
import styles from "./planner-workspace-shell.module.css";

// Order/labels/icons match SCR-32-Planner-Workspace.dc.html's VIEWS array
// exactly: [['timeline','Timeline','gantt-chart'],['kanban','Kanban','layout-grid'],
// ['calendar','Calendar','calendar-range'],['list','List','list']].
const VIEWS: { key: ViewType; label: string; Icon: typeof GanttChart }[] = [
  { key: "timeline", label: "Timeline", Icon: GanttChart },
  { key: "kanban", label: "Kanban", Icon: LayoutGrid },
  { key: "calendar", label: "Calendar", Icon: CalendarRange },
  { key: "list", label: "List", Icon: ListIcon },
];

function isPersistedView(view: ViewType): view is PersistedViewType {
  return view !== "list";
}

function WorkspacePlaceholder({ view, label }: { view: ViewType; label: string }) {
  return (
    <div className={styles.placeholder} data-testid={`planner-workspace-placeholder-${view}`}>
      {label} view — content ships in a later Planner ticket.
    </div>
  );
}

export type PlannerWorkspaceShellProps = {
  instanceId: string;
  timeline?: ReactNode;
  kanban?: ReactNode;
  calendar?: ReactNode;
  list?: ReactNode;
  /**
   * IPI-588 — tasks from the page's getInstanceDetail() payload. When set
   * with viewerId + today, the Now & Next bar mounts once above all views.
   */
  tasks?: PlannerTask[];
  viewerId?: string;
  phaseNames?: Record<string, string>;
  /** YYYY-MM-DD — pass the same today string used for Timeline. */
  today?: string;
  /**
   * IPI-582 — user preference from getViewConfig (never "list"; List is
   * session-only). Defaults to Timeline when unset / missing preference.
   */
  initialView?: ViewType;
};

// IPI-579 / IPI-580 / IPI-581 — page passes server-built view nodes.
// IPI-588 · PLN-S1G — Now & Next mounts once between toolbar and view content.
// IPI-582 · PLN-S1E — view tabs persist via setViewConfig (user-scoped).
export function PlannerWorkspaceShell({
  instanceId,
  timeline,
  kanban,
  calendar,
  list,
  tasks,
  viewerId,
  phaseNames = {},
  today,
  initialView = "timeline",
}: PlannerWorkspaceShellProps) {
  const [view, setView] = useState<ViewType>(initialView);
  const [persistWarning, setPersistWarning] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // Last successfully persisted default_view — used to no-op re-select and
  // List→same-persisted-view bounces without a redundant write.
  const lastPersistedRef = useRef<PersistedViewType | null>(
    isPersistedView(initialView) ? initialView : null,
  );

  function handleViewChange(next: string) {
    const nextView = next as ViewType;
    if (nextView === view) return;

    // Session view always updates immediately — preference write is best-effort.
    setView(nextView);
    setPersistWarning(null);

    // "list" is never a persisted default_view (DB CHECK + adapter contract).
    if (!isPersistedView(nextView)) return;

    if (lastPersistedRef.current === nextView) return;

    startTransition(async () => {
      const result = await setViewConfigAction(instanceId, { defaultView: nextView });
      if (!result.ok) {
        // Keep the session tab the operator just chose; do not roll back.
        setPersistWarning("Could not save your view preference for next time.");
        return;
      }
      lastPersistedRef.current = nextView;
    });
  }

  const contentFor = (key: ViewType, label: string): ReactNode => {
    if (key === "timeline") return timeline ?? <WorkspacePlaceholder view={key} label={label} />;
    if (key === "kanban") return kanban ?? <WorkspacePlaceholder view={key} label={label} />;
    if (key === "calendar") return calendar ?? <WorkspacePlaceholder view={key} label={label} />;
    if (key === "list") return list ?? <WorkspacePlaceholder view={key} label={label} />;
    return <WorkspacePlaceholder view={key} label={label} />;
  };

  return (
    <div style={{ padding: "2rem" }}>
      {/* IPI-551 · PLN-S4b — no DOM presence of its own; manages the shared
          Intelligence⇄Detail panel via context. Order relative to the rest
          of this tree doesn't matter. */}
      <AdaptivePanel instanceId={instanceId} />

      <h1>Planner Workspace</h1>

      <Tabs value={view} onValueChange={handleViewChange}>
        <div className={styles.toolbar}>
          <TabsList className={styles.tabsList} aria-label="Planner view">
            {VIEWS.map(({ key, label, Icon }) => (
              <TabsTrigger key={key} value={key} className={styles.tabsTrigger}>
                <Icon aria-hidden="true" style={{ width: 14, height: 14 }} />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {persistWarning ? (
          <p
            role="status"
            style={{ color: "var(--color-text-muted)", fontSize: 13, margin: "0.5rem 0 0" }}
            data-testid="planner-view-persist-warning"
          >
            {persistWarning}
          </p>
        ) : null}

        {tasks && viewerId && today ? (
          <NowNextBar
            tasks={tasks}
            viewerId={viewerId}
            phaseNames={phaseNames}
            today={today}
          />
        ) : null}

        {VIEWS.map(({ key, label }) => (
          <TabsContent key={key} value={key} style={{ marginTop: "1rem", width: "100%" }}>
            {contentFor(key, label)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
