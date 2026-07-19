import { notFound } from "next/navigation";

import { InboxWorkspace } from "@/components/notifications/inbox-workspace";
import { listNotifications } from "@/lib/notifications/notification-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// IPI-407 / SCR-15 — Notification Center. RPC is self-scoped via auth.uid()
// inside list_notifications (see public.is_org_member usage) — no org_id param.
export default async function InboxPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const result = await listNotifications(supabase, {
    unread_only: false,
    limit: 50,
  });

  if (!result.ok) {
    return (
      <InboxWorkspace
        initialItems={null}
        fetchError="Unable to load notifications. Try again in a moment."
      />
    );
  }

  return <InboxWorkspace initialItems={result.data.items} fetchError={null} />;
}
