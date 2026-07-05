import Link from "next/link";
import { notFound } from "next/navigation";

import { getPrimaryEntry } from "@/lib/crm/jsonb-contact-fields";
import { getCurrentOrgId } from "@/lib/crm/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CrmContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const orgId = await getCurrentOrgId(user.id, supabase);
  if (!orgId) notFound();

  const { data: contact } = await supabase
    .from("crm_contacts")
    .select("id, name, email, phone, role_title")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!contact) notFound();

  const email = getPrimaryEntry((contact.email as { value: string }[]) ?? [])?.value;

  return (
    <div className="p-8" style={{ background: "#FBF8F5" }}>
      <Link href="/app/crm/contacts" className="font-sans text-sm text-[#64748B] hover:underline">
        ← Contacts
      </Link>
      <h1 className="mt-4 font-serif text-3xl text-[#1E293B]">{contact.name}</h1>
      <dl className="mt-4 grid gap-2 font-sans text-sm text-[#64748B]">
        {email ? (
          <>
            <dt className="font-medium text-[#1E293B]">Email</dt>
            <dd>{email}</dd>
          </>
        ) : null}
        {contact.role_title ? (
          <>
            <dt className="font-medium text-[#1E293B]">Role</dt>
            <dd>{contact.role_title}</dd>
          </>
        ) : null}
      </dl>
    </div>
  );
}
