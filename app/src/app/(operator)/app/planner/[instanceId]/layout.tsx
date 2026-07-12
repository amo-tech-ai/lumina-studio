import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// planner.instances.id is a Postgres uuid column — a non-UUID string makes the
// query throw "invalid input syntax for type uuid" rather than return an empty
// row. Reject it here so a malformed id 404s via [instanceId]/not-found.tsx
// instead of surfacing a raw Postgres error. Same pattern as
// app/src/app/(operator)/app/crm/companies/[id]/page.tsx.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export default async function PlannerInstanceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ instanceId: string }>;
}) {
  const { instanceId } = await params;
  if (!UUID_RE.test(instanceId)) notFound();

  // RLS on planner.instances (org-scoped) means a cross-org id returns zero
  // rows here rather than needing a manual org check — same as an id that
  // simply doesn't exist. Both cases 404.
  const supabase = await createSupabaseServerClient();
  const { data: instance } = await supabase
    .schema("planner")
    .from("instances")
    .select("id")
    .eq("id", instanceId)
    .maybeSingle();

  if (!instance) notFound();

  return <>{children}</>;
}
