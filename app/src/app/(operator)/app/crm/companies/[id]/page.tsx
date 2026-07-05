import Link from "next/link";
import { notFound } from "next/navigation";

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

  const { data: company } = await supabase
    .from("crm_companies")
    .select("id, name, domain, status, industry, owner")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!company) notFound();

  return (
    <div className="p-8" style={{ background: "#FBF8F5" }}>
      <Link href="/app/crm/companies" className="font-sans text-sm text-[#64748B] hover:underline">
        ← Companies
      </Link>
      <h1 className="mt-4 font-serif text-3xl text-[#1E293B]">{company.name}</h1>
      <dl className="mt-4 grid gap-2 font-sans text-sm text-[#64748B]">
        {company.domain ? (
          <>
            <dt className="font-medium text-[#1E293B]">Domain</dt>
            <dd>{company.domain}</dd>
          </>
        ) : null}
        {company.status ? (
          <>
            <dt className="font-medium text-[#1E293B]">Status</dt>
            <dd>{company.status}</dd>
          </>
        ) : null}
      </dl>
    </div>
  );
}
