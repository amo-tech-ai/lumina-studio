import { notFound } from "next/navigation";

import { CompanyDetailWorkspace } from "@/components/crm/company-detail-workspace";
import { getCompanyDetail } from "@/lib/crm/get-company-detail";
import { getCurrentOrgId } from "@/lib/crm/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// crm_companies.id is a Postgres uuid column — a non-UUID string makes the query
// throw "invalid input syntax for type uuid" (a real error), not return an empty
// row. Reject it here so a malformed id in the URL 404s instead of landing in the
// catch below and showing a misleading "try again" (retrying won't ever help).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CrmCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
    data = await getCompanyDetail(supabase, orgId, id);
  } catch (error) {
    // A real query failure gets a retryable ErrorState — an invalid/missing id (below) is a 404, not this.
    console.error(`[crm/companies/${id}] getCompanyDetail failed for org ${orgId}:`, error);
    // key={id}: the App Router keeps this client component's instance (and its
    // tab state) alive across a companies/[id] -> companies/[otherId] navigation
    // since it's the same position in the tree — key forces a remount per id.
    return (
      <CompanyDetailWorkspace key={id} data={null} fetchError="Unable to load this company. Try again in a moment." />
    );
  }

  if (!data) notFound();

  return <CompanyDetailWorkspace key={id} data={data} fetchError={null} />;
}
