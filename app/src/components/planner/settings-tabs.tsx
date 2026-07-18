"use client";

// IPI-577 · PLN-S6 — Settings tabs shell. Only Members has real content;
// Notifications/Workflow/Danger stay disabled placeholders using the repo's
// disabled + title="Coming soon" convention (not the ComingSoonButton
// component itself — that's a disabled CTA-button pattern, not a tab one).

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PlannerMember, PlannerRole } from "@/lib/planner/types";

import { AdaptivePanel } from "./adaptive-panel";
import { MemberTable } from "./member-table";
import styles from "./settings-tabs.module.css";

const DISABLED_TABS = ["Notifications", "Workflow", "Danger zone"];

type Props = {
  instanceId: string;
  members: PlannerMember[];
  role: PlannerRole | null;
  currentUserId: string;
};

export function SettingsTabs({ instanceId, members, role, currentUserId }: Props) {
  return (
    <Tabs defaultValue="members">
      {/* IPI-551 · PLN-S4b — no DOM presence of its own; manages the shared
          Intelligence⇄Detail panel via context. Order doesn't matter. */}
      <AdaptivePanel instanceId={instanceId} />

      <TabsList className={styles.tabsList} aria-label="Settings">
        <TabsTrigger value="members" className={styles.tabsTrigger}>
          Members
        </TabsTrigger>
        {DISABLED_TABS.map((label) => (
          <button
            key={label}
            type="button"
            disabled
            title="Coming soon"
            className={styles.disabledTab}
          >
            {label}
          </button>
        ))}
      </TabsList>

      <TabsContent value="members" className={styles.content}>
        <MemberTable instanceId={instanceId} members={members} role={role} currentUserId={currentUserId} />
      </TabsContent>
    </Tabs>
  );
}
