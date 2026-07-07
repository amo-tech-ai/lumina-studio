import { notFound } from "next/navigation";

import { CompanyDetailWorkspace } from "@/components/crm/company-detail-workspace";
import { getCompanyDetail } from "@/lib/crm/get-company-detail";
import { getCurrentOrgId } from "@/lib/crm/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CrmCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  } catch {
    // A real query failure gets a retryable ErrorState — an invalid/missing id (below) is a 404, not this.
    return <CompanyDetailWorkspace data={null} fetchError="Unable to load this company. Try again in a moment." />;
  }

  if (!data) notFound();

  return <CompanyDetailWorkspace data={data} fetchError={null} />;
}
