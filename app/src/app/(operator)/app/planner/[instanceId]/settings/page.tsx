// IPI-577 · PLN-S6 — Settings route. Existence/UUID guard lives in the
// sibling [instanceId]/layout.tsx. Members tab wired to listMembers();
// Notifications/Workflow/Danger stay disabled (SettingsTabs).

import { notFound } from "next/navigation";

import { SettingsTabs } from "@/components/planner/settings-tabs";
import { getEffectivePermissions } from "@/lib/planner/permissions";
import { listMembers } from "@/lib/planner/queries";
import type { PlannerRole } from "@/lib/planner/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PlannerSettingsPage({
  params,
}: {
  params: Promise<{ instanceId: string }>;
}) {
  const { instanceId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const permissions = await getEffectivePermissions(instanceId, supabase);
  if (!permissions.canRead) notFound();

  const members = await listMembers(instanceId);
  if (!members.ok) throw new Error(members.error.message);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Settings</h1>
      <SettingsTabs
        instanceId={instanceId}
        members={members.data}
        role={permissions.role as PlannerRole | null}
        currentUserId={user.id}
      />
    </div>
  );
}
