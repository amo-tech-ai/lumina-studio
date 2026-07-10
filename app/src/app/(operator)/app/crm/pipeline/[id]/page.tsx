import { notFound } from "next/navigation";

import { DealDetailWorkspace } from "@/components/crm/deal-detail-workspace";
import { getDealDetail } from "@/lib/crm/get-deal-detail";
import { getCurrentOrgId } from "@/lib/crm/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// crm_deals.id is a Postgres uuid column — same guard shape as
// crm/companies/[id]/page.tsx and crm/contacts/[id]/page.tsx: reject a
// malformed id here so it 404s instead of hitting the catch below and
// showing a misleading "try again" (retrying a bad id never helps).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CrmDealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const orgId = await getCurrentOrgId(user.id, supabase);
  if (!orgId) notFound();

  let data;
  try {
    data = await getDealDetail(supabase, orgId, id);
  } catch (error) {
    // A real query failure gets a retryable ErrorState — an invalid/missing id (above) is a 404, not this.
    console.error(`[crm/pipeline/${id}] getDealDetail failed for org ${orgId}:`, error);
    return <DealDetailWorkspace key={id} data={null} fetchError="Unable to load this deal. Try again in a moment." />;
  }

  if (!data) notFound();

  return <DealDetailWorkspace key={id} data={data} fetchError={null} />;
}
