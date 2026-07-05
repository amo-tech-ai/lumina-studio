import Link from "next/link";

import { getCurrentOrgId, listContacts } from "@/lib/crm/queries";
import { getPrimaryEntry } from "@/lib/crm/jsonb-contact-fields";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CrmContactsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-8" style={{ background: "#FBF8F5" }}>
        <h1 className="font-serif text-3xl text-[#1E293B]">Contacts</h1>
        <p className="mt-2 font-sans text-[#64748B]">Sign in to view CRM contacts.</p>
        <Link href="/login?redirect=/app/crm/contacts" className="mt-4 inline-block text-sm text-[#E87C4D]">
          Sign in
        </Link>
      </div>
    );
  }

  const orgId = await getCurrentOrgId(user.id, supabase);
  if (!orgId) {
    return (
      <div className="p-8" style={{ background: "#FBF8F5" }}>
        <h1 className="font-serif text-3xl text-[#1E293B]">Contacts</h1>
        <p className="mt-2 font-sans text-[#64748B]">No organization membership found.</p>
      </div>
    );
  }

  const contacts = await listContacts({ orgId }, supabase);

  return (
    <div className="p-8" style={{ background: "#FBF8F5" }}>
      <nav className="mb-6 flex gap-4 font-sans text-sm text-[#64748B]">
        <Link href="/app/crm/companies" className="hover:text-[#1E293B]">
          Companies
        </Link>
        <Link href="/app/crm/contacts" className="font-medium text-[#1E293B]">
          Contacts
        </Link>
        <Link href="/app/crm/pipeline" className="hover:text-[#1E293B]">
          Pipeline
        </Link>
      </nav>
      <h1 className="font-serif text-3xl text-[#1E293B]">Contacts</h1>
      {contacts.length === 0 ? (
        <p className="mt-6 font-sans text-[#64748B]">No contacts yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {contacts.map((c) => {
            const email = getPrimaryEntry((c.email as { value: string; primary?: boolean }[]) ?? [])?.value;
            return (
              <li key={c.id}>
                <Link
                  href={`/app/crm/contacts/${c.id}`}
                  className="block rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 hover:border-[#E87C4D]"
                >
                  <span className="font-sans font-medium text-[#1E293B]">{c.name}</span>
                  {email ? <span className="ml-2 font-sans text-sm text-[#64748B]">{email}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
