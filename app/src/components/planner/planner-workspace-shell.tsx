"use client";

import { useState, type ReactNode } from "react";
import { GanttChart, LayoutGrid, CalendarRange, List as ListIcon } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ViewType } from "@/lib/planner/types";

import { AdaptivePanel } from "./adaptive-panel";
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

function WorkspacePlaceholder({ view, label }: { view: ViewType; label: string }) {
  return (
    <div className={styles.placeholder} data-testid={`planner-workspace-placeholder-${view}`}>
      {label} view — content ships in a later Planner ticket.
    </div>
  );
}

// IPI-579 / IPI-580 / IPI-581 — the page (RSC) passes server-built view nodes
// through `timeline` / `kanban` / `calendar` / `list`. Missing nodes fall back
// to the placeholder so the shell stays self-contained for tests.
export function PlannerWorkspaceShell({
  instanceId,
  timeline,
  kanban,
  calendar,
  list,
}: {
  instanceId: string;
  timeline?: ReactNode;
  kanban?: ReactNode;
  calendar?: ReactNode;
  list?: ReactNode;
}) {
  const [view, setView] = useState<ViewType>("timeline");

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

      <Tabs value={view} onValueChange={(next) => setView(next as ViewType)}>
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

        {VIEWS.map(({ key, label }) => (
          <TabsContent key={key} value={key} style={{ marginTop: "1rem", width: "100%" }}>
            {contentFor(key, label)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
