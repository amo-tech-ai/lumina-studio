import Link from "next/link";
import { notFound } from "next/navigation";

import { companyNameFromDeal, dealHeading, type DealWithCompany } from "@/lib/crm/deal-display";
import { getCurrentOrgId } from "@/lib/crm/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CrmDealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const orgId = await getCurrentOrgId(user.id, supabase);
  if (!orgId) notFound();

  const { data: deal } = await supabase
    .from("crm_deals")
    .select("id, stage, value, company_id, crm_companies(name)")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!deal) notFound();

  const row = deal as unknown as DealWithCompany;
  const company = companyNameFromDeal(row);
  const heading = dealHeading(row);

  return (
    <div className="p-8" style={{ background: "#FBF8F5" }}>
      <Link href="/app/crm/pipeline" className="font-sans text-sm text-[#64748B] hover:underline">
        ← Pipeline
      </Link>
      <h1 className="mt-4 font-serif text-3xl text-[#1E293B]">{heading}</h1>
      <p className="mt-2 font-sans text-sm text-[#64748B]">
        Stage: <span className="font-medium text-[#1E293B]">{row.stage}</span>
      </p>
      {company ? (
        <p className="mt-2 font-sans text-sm text-[#64748B]">
          Company:{" "}
          <Link href={`/app/crm/companies/${row.company_id}`} className="text-[#E87C4D] hover:underline">
            {company}
          </Link>
        </p>
      ) : null}
      {row.stage !== "won" && row.stage !== "lost" ? (
        <p className="mt-4 font-sans text-sm text-[#64748B]">
          Won/Lost conversion uses the HITL gate (IPI-367) — not available in wave 1.
        </p>
      ) : null}
    </div>
  );
}
