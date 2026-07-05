import Link from "next/link";

import { getCurrentOrgId, listCompanies } from "@/lib/crm/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CrmCompaniesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-8" style={{ background: "#FBF8F5" }}>
        <h1 className="font-serif text-3xl text-[#1E293B]">Companies</h1>
        <p className="mt-2 font-sans text-[#64748B]">Sign in to view CRM companies.</p>
        <Link href="/login?redirect=/app/crm/companies" className="mt-4 inline-block text-sm text-[#E87C4D]">
          Sign in
        </Link>
      </div>
    );
  }

  const orgId = await getCurrentOrgId(user.id, supabase);
  if (!orgId) {
    return (
      <div className="p-8" style={{ background: "#FBF8F5" }}>
        <h1 className="font-serif text-3xl text-[#1E293B]">Companies</h1>
        <p className="mt-2 font-sans text-[#64748B]">No organization membership found.</p>
      </div>
    );
  }

  const companies = await listCompanies({ orgId }, supabase);

  return (
    <div className="p-8" style={{ background: "#FBF8F5" }}>
      <nav className="mb-6 flex gap-4 font-sans text-sm text-[#64748B]">
        <Link href="/app/crm/companies" className="font-medium text-[#1E293B]">
          Companies
        </Link>
        <Link href="/app/crm/contacts" className="hover:text-[#1E293B]">
          Contacts
        </Link>
        <Link href="/app/crm/pipeline" className="hover:text-[#1E293B]">
          Pipeline
        </Link>
      </nav>
      <h1 className="font-serif text-3xl text-[#1E293B]">Companies</h1>
      <p className="mt-1 font-sans text-sm text-[#64748B]">
        Relationship Hub · Sales CRM module
      </p>
      {companies.length === 0 ? (
        <p className="mt-6 font-sans text-[#64748B]">No companies yet — ask the CRM assistant to help you add prospects.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {companies.map((c) => (
            <li key={c.id}>
              <Link
                href={`/app/crm/companies/${c.id}`}
                className="block rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 hover:border-[#E87C4D]"
              >
                <span className="font-sans font-medium text-[#1E293B]">{c.name}</span>
                {c.domain ? (
                  <span className="ml-2 font-sans text-sm text-[#64748B]">{c.domain}</span>
                ) : null}
                {c.status ? (
                  <span className="ml-2 rounded-full bg-[#F1F5F9] px-2 py-0.5 font-sans text-xs text-[#64748B]">
                    {c.status}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
