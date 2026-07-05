import Link from "next/link";

import { dealLabel, type DealWithCompany } from "@/lib/crm/deal-display";
import { getCurrentOrgId } from "@/lib/crm/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STAGES = ["lead", "qualified", "proposal", "negotiation", "won", "lost"] as const;
const DEAL_LIST_LIMIT = 200;

export default async function CrmPipelinePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-8" style={{ background: "#FBF8F5" }}>
        <h1 className="font-serif text-3xl text-[#1E293B]">Pipeline</h1>
        <p className="mt-2 font-sans text-[#64748B]">Sign in to view the deal pipeline.</p>
        <Link href="/login?redirect=/app/crm/pipeline" className="mt-4 inline-block text-sm text-[#E87C4D]">
          Sign in
        </Link>
      </div>
    );
  }

  const orgId = await getCurrentOrgId(user.id, supabase);
  if (!orgId) {
    return (
      <div className="p-8" style={{ background: "#FBF8F5" }}>
        <h1 className="font-serif text-3xl text-[#1E293B]">Pipeline</h1>
        <p className="mt-2 font-sans text-[#64748B]">No organization membership found.</p>
      </div>
    );
  }

  const { data: deals, error } = await supabase
    .from("crm_deals")
    .select("id, stage, value, company_id, crm_companies(name)")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(DEAL_LIST_LIMIT);

  if (error) {
    return (
      <div className="p-8" style={{ background: "#FBF8F5" }}>
        <h1 className="font-serif text-3xl text-[#1E293B]">Pipeline</h1>
        <p className="mt-2 font-sans text-[#64748B]">Could not load deals. Try again shortly.</p>
      </div>
    );
  }

  const rows = (deals ?? []) as unknown as DealWithCompany[];

  return (
    <div className="p-8" style={{ background: "#FBF8F5" }}>
      <nav className="mb-6 flex gap-4 font-sans text-sm text-[#64748B]">
        <Link href="/app/crm/companies" className="hover:text-[#1E293B]">
          Companies
        </Link>
        <Link href="/app/crm/contacts" className="hover:text-[#1E293B]">
          Contacts
        </Link>
        <Link href="/app/crm/pipeline" className="font-medium text-[#1E293B]">
          Pipeline
        </Link>
      </nav>
      <h1 className="font-serif text-3xl text-[#1E293B]">Pipeline</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {STAGES.map((stage) => {
          const stageDeals = rows.filter((d) => d.stage === stage);
          return (
            <div key={stage} className="rounded-lg border border-[#E2E8F0] bg-white p-3">
              <h2 className="font-sans text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                {stage}
              </h2>
              <ul className="mt-2 space-y-2">
                {stageDeals.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/app/crm/pipeline/${d.id}`}
                      className="block font-sans text-sm text-[#1E293B] hover:text-[#E87C4D]"
                    >
                      {dealLabel(d)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
